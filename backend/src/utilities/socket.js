const {Server} = require("socket.io")
const http =require('http')
const {createRoom,joinRoom,exitRoom,sendMessage,gameStart}=require("../controller/room.controller.js")
const express=require("express")
const app=express()

const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:"http://localhost:5173",
        credentials:true,
    }
})

// Store roomId for each socket
const socketRooms = new Map();

io.on("connection",(socket)=>{
    console.log(socket.id," Joined")


    socket.on("create-room",({roomSettings, playerDetail})=>{
        console.log("Socket-start")
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
        console.log("Room Exitss 1")
        const rooom=exitRoom(roomId,socketId)
        if(!rooom) return null
        socket.leave(roomId)
        socketRooms.delete(socket.id) // Remove from tracking
        console.log("Room Exited 2")
        io.to(roomId).emit("player-exited",{roomId,rooom,socketId})
    })

    socket.on("send-message",({roomId,message})=>{
        const messages=sendMessage({roomId,socketId:socket.id,message})
        if(!messages) return;
        console.log(messages)
        io.to(roomId).emit("new-message",{roomId, meessage:messages, socketId:socket.id})
    })

    socket.on("start-game",(roomId)=>{
        const players=gameStart(roomId)
        if(!players) return;
        console.log(players)
        io.to(roomId).emit("round-started",{roomId,players})
    })

    // Handle disconnect - when user closes tab, loses connection, swipes back, etc.
    socket.on("disconnect",()=>{
        console.log(socket.id," Disconnected")
        const roomId = socketRooms.get(socket.id);
        if(roomId){
            console.log("Auto-removing player from room due to disconnect")
            const rooom = exitRoom(roomId, socket.id)
            if(rooom){
                io.to(roomId).emit("player-exited",{roomId,rooom,socketId:socket.id})
            }
            socketRooms.delete(socket.id)
        }
    })



})

module.exports={io,app,server}