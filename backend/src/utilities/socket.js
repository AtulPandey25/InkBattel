const {Server} = require("socket.io")
const http =require('http')
const {createRoom,joinRoom,exitRoom,sendMessage,gameStart,drawWord,updateScore,timerUpdate,deleteRoom,verifyGuess,getRoundScore,markRoundEnded,getHintsIndex,getPublicRoomId,replay,getHints}=require("../controller/room.controller.js")
const {rooms}=require('../model/room.model.js')
const express=require("express")

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"

const app=express()

const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:clientUrl,
        credentials:true,
    }
})

let timerStart=false

const socketRooms = new Map();
const roomTimers = new Map();
const roomChooseTimers = new Map();

io.on("connection",(socket)=>{

    const clearRoomTimers = (roomId) => {
        const activeTimer = roomTimers.get(roomId)
        if(activeTimer){
            clearInterval(activeTimer)
            roomTimers.delete(roomId)
        }

        const activeChooseTimer = roomChooseTimers.get(roomId)
        if(activeChooseTimer){
            clearInterval(activeChooseTimer)
            roomChooseTimers.delete(roomId)
        }
    }

    const closeRoomForAll = (roomId, reason) => {
        clearRoomTimers(roomId)
        rooms.delete(roomId)
        io.to(roomId).emit("room-closed", { roomId, reason })
        io.in(roomId).socketsLeave(roomId)
    }

    socket.on("create-room",({roomSettings, playerDetail})=>{
        const rooom=createRoom(socket.id, playerDetail, roomSettings)
        if(!rooom){
            return null;
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
        socketRooms.set(socket.id, roomId)
        io.to(roomId).emit("player-joined",{roomId, playerDetail, socketId:socket.id,rooom})
    })
    
    socket.on("exit-room",({roomId})=>{
        const socketId=socket.id;
        const roomBeforeExit = rooms.get(roomId)
        const wasHost = roomBeforeExit?.hostId === socketId
        const rooom=exitRoom(roomId,socketId)
        socket.leave(roomId)
        socketRooms.delete(socket.id)

        if(!rooom) return

        if(wasHost && rooom.players.length<2){
            closeRoomForAll(roomId, "host-left")
            return
        }

        io.to(roomId).emit("player-exited",{roomId,rooom,socketId})
        if(wasHost && rooom.players.length>=2){
            io.to(roomId).emit("host-transferred",{roomId,newHostId:rooom.hostId})
        }

        if(rooom.players.length===1){
            closeRoomForAll(roomId, "not-enough-players")
        }
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
        const currentDrawer = room.players?.[room.choose]
        if(currentDrawer?.socketId){
            io.to(currentDrawer.socketId).emit("guess-word",{roomId,rooom:room,word:room.guessWord})
        }
        socket.to(roomId).emit("guess-word",{roomId,rooom:room,word:getHints(roomId)})
    })

    socket.on("update-score",({roomId,socketId,score,drawerId})=>{
        const rooom=updateScore({roomId,socketId,score,drawerId})
        if(!rooom) return null
        io.to(roomId).emit("score-updated",{roomId,rooom})
    })



    socket.on("verify-guess",({roomId,message},ack)=>{
        const result=verifyGuess({roomId,message})
        if(!result){
            if(typeof ack==="function") ack({res:false})
            return null
        }
        const {room,res}=result
        if(!room){
            if(typeof ack==="function") ack({res:false})
            return null
        }
        if(typeof ack==="function") ack({res})
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
                    const hintIndex = getHintsIndex(roomId)
                    if(hintIndex !== null) io.to(roomId).emit("show-hints", { hintIndex, hintWord: getHints(roomId) })
                }

            }
            else{
                if(room.settings.hints==3 && (time==room.settings.drawTime-21 || time==room.settings.drawTime-41 || time==room.settings.drawTime-51)){
                    const hintIndex = getHintsIndex(roomId)
                    if(hintIndex !== null) io.to(roomId).emit("show-hints", { hintIndex, hintWord: getHints(roomId) })
                }
                else if(room.settings.hints==2 && (time==room.settings.drawTime-21 || time==room.settings.drawTime-41)){
                    const hintIndex = getHintsIndex(roomId)
                    if(hintIndex !== null) io.to(roomId).emit("show-hints", { hintIndex, hintWord: getHints(roomId) })
                }
                else if(room.settings.hints==1 && (time==room.settings.drawTime-21 )){
                    const hintIndex = getHintsIndex(roomId)
                    if(hintIndex !== null) io.to(roomId).emit("show-hints", { hintIndex, hintWord: getHints(roomId) })
                }
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
        io.to(roomId).emit("guessed-edit",({roomId,socketId,name}))
    })


    socket.on("replay",({roomId,playerDetail,roomSettings})=>{
        const {create,rooom}=replay(roomId,socket.id,playerDetail,roomSettings,socket)
        if(!rooom){
            socket.emit("join-room-failed",{message:"Unable to join room"})
            return;
        }
        if(create){
            socket.join(rooom.roomId)
            socketRooms.set(socket.id, rooom.roomId) // Track which room this socket is in
            socket.emit("room-created",{roomId: rooom.roomId, rooom, playerDetail,socketId:socket.id})
            io.to(roomId).emit("replayed",{roomId,rooom,playerDetail,socketId:socket.id})
        }
        else{
            socketRooms.set(socket.id, roomId)
            io.to(roomId).emit("player-joined",{roomId, playerDetail, socketId:socket.id,rooom})
            io.to(roomId).emit("replayed",{roomId,rooom,playerDetail,socketId:socket.id})
        }
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

    socket.on("clear-board",({roomId})=>{
        socket.to(roomId).emit("clear-draw",{roomId})
    })

    socket

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

    socket.on("public-room-join",({playerDetail})=>{
        const roomId=getPublicRoomId()
        if(!roomId){
            socket.emit("join-room-failed",{message:"No Public room found create one !!!"})
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



    // Handle disconnect - when user closes tab, loses connection, swipes back, etc.
    socket.on("disconnect",()=>{
        const roomId = socketRooms.get(socket.id);
        if(roomId){
            const roomBeforeExit = rooms.get(roomId)
            const wasHost = roomBeforeExit?.hostId === socket.id
            const rooom = exitRoom(roomId, socket.id)
            if(rooom){
                if(wasHost && rooom.players.length<2){
                    closeRoomForAll(roomId, "host-left")
                }
                else{
                    io.to(roomId).emit("player-exited",{roomId,rooom,socketId:socket.id})
                    if(wasHost && rooom.players.length>=2){
                        io.to(roomId).emit("host-transferred",{roomId,newHostId:rooom.hostId})
                    }
                    if(rooom.players.length===1){
                        closeRoomForAll(roomId, "not-enough-players")
                    }
                }
            }
            socketRooms.delete(socket.id)
        }

    })


})





module.exports={io,app,server}