const {Server} = require("socket.io")
const http =require('http')
const {createRoom,joinRoom,exitRoom,sendMessage,gameStart,drawWord,updateScore,timerUpdate,deleteRoom,verifyGuess,getRoundScore}=require("../controller/room.controller.js")
const {rooms}=require('../model/room.model.js')
const express=require("express")
const app=express()

const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:"http://localhost:5173",
        credentials:true,
    }
})


const socketRooms = new Map();

io.on("connection",(socket)=>{

    socket.on("create-room",({roomSettings, playerDetail})=>{
        const rooom=createRoom(socket.id, playerDetail, roomSettings)
        if(!rooom){
            console.log("Error during room Creation")
            return;
        }
        socket.join(rooom.roomId)
        socketRooms.set(socket.id, rooom.roomId) // Track which room this socket is in
        socket.emit("room-created",{roomId: rooom.roomId, rooom, playerDetail,socketId:socket.id})
    })

    socket.on("join-room",({roomId,playerDetail})=>{
        const rooom=joinRoom(socket,roomId,playerDetail)
        if(!rooom) return;
        socketRooms.set(socket.id, roomId) // Track which room this socket is in
        io.to(roomId).emit("player-joined",{roomId, playerDetail, socketId:socket.id,rooom})
    })
    
    socket.on("exit-room",({roomId})=>{
        const socketId=socket.id;
        const rooom=exitRoom(roomId,socketId)
        if(!rooom) return null
        socket.leave(roomId)
        socketRooms.delete(socket.id) // Remove from tracking
        io.to(roomId).emit("player-exited",{roomId,rooom,socketId})
    })

    socket.on("send-message",({roomId,message})=>{
        const messages=sendMessage({roomId,socketId:socket.id,message})
        if(!messages) return;
        io.to(roomId).emit("new-message",{roomId, meessage:messages, socketId:socket.id})
    })

    socket.on("start-game",(roomId)=>{
        const gameData = gameStart(roomId)
        if(!gameData) return;
        const {players,drawerId,round,words,guessed}=gameData
        if(!players || !drawerId || !round || !words || !guessed) return;
        io.to(roomId).emit("round-started",{roomId,players,drawerId,round,words,guessed})
    })

    socket.on("draw-word",({roomId,word})=>{
        const room=drawWord({roomId,word})
        if(!room) return null
        io.to(roomId).emit("guess-word",{roomId,rooom:room,word})
    })

    socket.on("update-score",({roomId,socketId,score})=>{
        const rooom=updateScore({roomId,socketId,score})
        if(!rooom) return null
        io.to(roomId).emit("score-updated",{roomId,rooom})
    })



    socket.on("verify-guess",({roomId,message})=>{
        const {room,res}=verifyGuess({roomId,message})
        if(!room) return null
        io.to(roomId).emit("verified",{rooom:room,res})
    })

    const roundEnd=(roomId,timerInterval)=>{
        clearInterval(timerInterval)
        const currentRoom = rooms.get(roomId)
        if(!currentRoom) return null

        io.to(roomId).emit("round-ended",{
            roomId,
            correctWord: currentRoom.guessWord,
            guessed: currentRoom.guessed,
            notGuessed:currentRoom.notGuessed
        })

        setTimeout(() => {
            const gameData = gameStart(roomId)
            if(!gameData) return;
            const {players,drawerId,round,totalRounds,words,guessed,notGuessed}=gameData
            if(!players || !drawerId || !round || !words || !guessed || !notGuessed) return null;
            if(round>totalRounds){
                const room=deleteRoom(roomId)
                if(!room) return null
                io.to(roomId).emit("game-ended",{roomId,guessed,notGuessed})
            }
            else{
                io.to(roomId).emit("round-started",{roomId,players,drawerId,round,words,guessed,notGuessed})
            }
        }, 5000)
    }

    socket.on("timer-start",(roomId)=>{
        var {time,guessed,players,notGuessed}=timerUpdate(roomId)
        if(!time) return null 
        let roundEnding = false
        let timerInterval=setInterval(() => {
            if(roundEnding) return
            io.to(roomId).emit("update-time",({roomId,time}))
            time--;
            if(time<0 || players.length===guessed.length){
                roundEnding = true
                roundEnd(roomId,timerInterval)
            }
        }, 1000);
    })

    // Handle disconnect - when user closes tab, loses connection, swipes back, etc.
    socket.on("disconnect",()=>{
        const roomId = socketRooms.get(socket.id);
        if(roomId){
            const rooom = exitRoom(roomId, socket.id)
            if(rooom){
                io.to(roomId).emit("player-exited",{roomId,rooom,socketId:socket.id})
            }
            socketRooms.delete(socket.id)
        }
    })



})

module.exports={io,app,server}