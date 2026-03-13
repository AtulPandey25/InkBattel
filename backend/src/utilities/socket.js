const {Server} = require("socket.io")
const http =require('http')
const {createRoom,joinRoom,exitRoom,sendMessage,gameStart,drawWord,updateScore,timerUpdate,deleteRoom,verifyGuess,getRoundScore,markRoundEnded}=require("../controller/room.controller.js")
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

let timerStart=false

const socketRooms = new Map();
const roomTimers = new Map();
const roomChooseTimers = new Map();

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
        const room = rooms.get(roomId)
        if(!room){
            socket.emit("join-room-failed",{message:"Room not found"})
            return;
        }

        if(room.players.length >= room.settings.numPlayers){
            socket.emit("join-room-failed",{message:"Max player limit reached"})
            return;
        }

        const rooom=joinRoom(socket,roomId,playerDetail)
        if(!rooom){
            socket.emit("join-room-failed",{message:"Unable to join room"})
            return;
        }
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
        const {players,drawerId,round,words,guessed,notGuessed}=gameData
        if(!players || !drawerId || !round || !words) return;
        io.to(roomId).emit("round-started",{roomId,players,drawerId,round,words,guessed,notGuessed})
    })

    socket.on("draw-word",({roomId,word})=>{
        const room=drawWord({roomId,word})
        if(!room) return null
        io.to(roomId).emit("guess-word",{roomId,rooom:room,word})
    })

    socket.on("update-score",({roomId,socketId,score,drawerId})=>{
        const rooom=updateScore({roomId,socketId,score,drawerId})
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
        timerStart=false
        const trackedTimer = roomTimers.get(roomId)
        if(trackedTimer){
            clearInterval(trackedTimer)
            roomTimers.delete(roomId)
        }
        const currentRoom = rooms.get(roomId)
        if(!currentRoom) return null

        io.to(roomId).emit("round-ended",{
            roomId,
            correctWord: currentRoom.guessWord,
            guessed: currentRoom.guessed,
            notGuessed:currentRoom.notGuessed
        })
        markRoundEnded(roomId)

        setTimeout(() => {
            const gameData = gameStart(roomId)
            if(!gameData) return;
            const {players,drawerId,round,totalRounds,words,guessed,notGuessed}=gameData
            if(!players || !drawerId || !round || !words) return null;
            if(round>totalRounds){
                const room=deleteRoom(roomId)
                if(!room) return null
                timerStart=false
                io.to(roomId).emit("game-ended",{roomId,guessed,notGuessed})
            }
            else{
                io.to(roomId).emit("round-started",{roomId,players,drawerId,round,words,guessed,notGuessed})
            }
        }, 5000)
    }

    socket.on("timer-start",(roomId)=>{
        timerStart=true
        const timerData = timerUpdate(roomId)
        if(!timerData) return null
        let {time}=timerData
        if(!time) return null

        const activeChooseTimer = roomChooseTimers.get(roomId)
        if(activeChooseTimer){
            clearInterval(activeChooseTimer)
            roomChooseTimers.delete(roomId)
        }

        const existingTimer = roomTimers.get(roomId)
        if(existingTimer){
            clearInterval(existingTimer)
            roomTimers.delete(roomId)
        }

        let roundEnding = false
        time--;
        let timerInterval=setInterval(() => {
            if(roundEnding) return

            const room = rooms.get(roomId)
            if(!room || room.phase !== "drawing"){
                roundEnding = true
                clearInterval(timerInterval)
                roomTimers.delete(roomId)
                return
            }
            
            io.to(roomId).emit("update-time",({roomId,time}))
            time--;
            if(time<0 || room.notGuessed.length===0){
                roundEnding = true
                roundEnd(roomId,timerInterval)
            }
            if(room.guessWord.length==3 && room.settings.hints==3){
                   if(time==room.settings.drawTime-21 ||  time==room.settings.drawTime-51){
                   io.to(roomId).emit("show-hints")
                }

            }
            else{
                  if(room.settings.hints==3 && (time==room.settings.drawTime-21 || time==room.settings.drawTime-41 || time==room.settings.drawTime-51)) io.to(roomId).emit("show-hints")
                  else if(room.settings.hints==2 && (time==room.settings.drawTime-21 || time==room.settings.drawTime-41)) io.to(roomId).emit("show-hints")
                  else if(room.settings.hints==1 && (time==room.settings.drawTime-21 )) io.to(roomId).emit("show-hints") 
            }
        }, 1000);

        roomTimers.set(roomId, timerInterval)
    })

    socket.on("choose-timer",({roomId,socketId,drawerId})=>{
        if(socketId !== drawerId) return

        const existingChooseTimer = roomChooseTimers.get(roomId)
        if(existingChooseTimer){
            clearInterval(existingChooseTimer)
            roomChooseTimers.delete(roomId)
        }

        let time=15;
        let chooseInterval=setInterval(() => {
            const room = rooms.get(roomId)
            if(!room || room.phase !== "choosing"){
                clearInterval(chooseInterval)
                roomChooseTimers.delete(roomId)
                return
            }

            time--
            io.to(roomId).emit("update-time",({roomId,time}))
            if(time<=0){
                clearInterval(chooseInterval)
                roomChooseTimers.delete(roomId)
            }
            
        }, 1000);

        roomChooseTimers.set(roomId, chooseInterval)
    })



    socket.on("guessed-message",({roomId,socketId,name})=>{
        io.to.emit("guessed-edit",({roomId,socketId,name}))
    })



    socket.on("start-board",({xRatio,yRatio,roomId})=>{
        socket.to(roomId).emit("start-draw",{xRatio,yRatio,roomId})
    })

    socket.on("draw-board",({xRatio,yRatio,tool,roomId,pencilStrok,eraserStrok,pencilClr})=>{
        socket.to(roomId).emit("draw-draw",{xRatio,yRatio,tool,roomId,pencilStrokk:pencilStrok,eraserStrokk:eraserStrok,pencilClrr:pencilClr})
    })

    socket.on("stop-board",({roomId})=>{
        socket.to(roomId).emit("stop-draw",{roomId})
    })


    socket.on("request-board-sync", ({ roomId }) => {
        const room = rooms.get(roomId)
        if (!room || room.phase !== "drawing") return
        socket.to(roomId).emit("board-sync-request", { roomId, requesterId: socket.id })
    })

    socket.on("board-snapshot", ({ roomId, imageData, requesterId }) => {
        const room = rooms.get(roomId)
        if (!room || room.phase !== "drawing" || !imageData) return
        io.to(requesterId).emit("board-snapshot", { roomId, imageData })
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