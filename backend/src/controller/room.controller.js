const { io } = require("../utilities/socket")
const {v4:uuidv4} = require("uuid")
const {rooms}=require('../model/room.model.js')


//Function to create room
const createRoom=(socketId, playerDetail, roomSettings)=>{
    try {
        const roomId = uuidv4();
        console.log("Creating")
        const room = {
            roomId,
            roomName: roomSettings.roomName,
            hostId: socketId,
            chance:0,
            round:0,
            players: [
                {
                    ...playerDetail,
                    socketId,
                    score: 0,
                    isDrawing: false
                }
            ],
            settings: roomSettings.settings,
            messages:[],
            createdAt: Date.now()
        };
        rooms.set(roomId, room);
        console.log("Creating")
        return room;
    } catch (error) {
        console.log(error);
        return null;
    }
}



//Function to make playerJoin room
const joinRoom=(socket,roomId,playerDetail)=>{
    try {
        const room=rooms.get(roomId)
        console.log(roomId)
        if(!room){
            return null
        }
        socket.join(roomId)
        room.players.push({
            ...playerDetail,
            socketId: socket.id,
            score: 0,
            isDrawing: false
        })
        return room;
    } catch (error) {
        console.log(error)
        return null;
    }
}


const exitRoom=(roomId,socketId)=>{
    try{
        const room=rooms.get(roomId)
        console.log("RID : ",roomId)
        console.log("backend exit")
        if(!room){
            console.log("No room found")
            return null
        }
        const player = room.players.find((player)=>player.socketId==socketId)
        if(!player) return null
        const index=room.players.findIndex((p)=> p.socketId==socketId)
        room.players.splice(index,1)
        console.log("backend exited")
        return room;
    }catch(error){
        console.log(error)
        return null
    }
}

const sendMessage=({roomId,socketId,message})=>{
    try{
        const room=rooms.get(roomId)
        console.log(roomId)
        if(!room){
            console.log("No room found for the message")
            return null
        }
        const player = room.players.find((player)=>player.socketId==socketId)
        if(!player) return null
        room.messages.push(
            {
                name:player.name,
                socketId:player.socketId,
                message:message,
            }
        )
        return room.messages
    }catch(error){
        console.log(error)
        return null
    }
}


const gameStart=(roomId)=>{
    try{
        const room=rooms.get(roomId)
        console.log(roomId)
        if(!room) return null
        room.round++;
        if(room.choose===0){
            room.players[choose].isDrawing=true;
        }
        else if(room.choose===room.players.length-1){
            room.players[choose].isDrawing=false;
            room.choose=0;
            room.round++;
            room.players[choose].isDrawing=false;
        }
        else{
            room.players[choose].isDrawing=false;
            room.choose++;
            room.players[choose].isDrawing=true;
        }
        return room.players;
    }
    catch(error){
        console.log(error)
        return null
    }
}

module.exports={joinRoom,createRoom,exitRoom,sendMessage,gameStart}