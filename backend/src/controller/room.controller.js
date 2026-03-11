const { io } = require("../utilities/socket")
const {v4:uuidv4} = require("uuid")
const {rooms}=require('../model/room.model.js')
const {randomWords}=require("../utilities/words.js")

//Function to create room
const createRoom=(socketId, playerDetail, roomSettings)=>{
    try {
        const roomId = uuidv4();
        const room = {
            roomId,
            roomName: roomSettings.roomName,
            hostId: socketId,
            choose:0,
            round:1,
            guessWord:"",
            isPlaying:false,
            players: [
                {
                    ...playerDetail,
                    socketId,
                    score: 0,
                    isDrawing: false
                }
            ],
            notGuessed:[],
            guessed:[],
            settings: roomSettings.settings,
            messages:[],
            createdAt: Date.now()
        };

        rooms.set(roomId, room);
        return room;
    } catch (error) {
        console.log(error);
        return null;
    }
}



const joinRoom=(socket,roomId,playerDetail)=>{
    try {
        const room=rooms.get(roomId)
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
        if(!room){
            console.log("No room found")
            return null
        }
        const player = room.players.find((player)=>player.socketId==socketId)
        if(!player) return null
        const index=room.players.findIndex((p)=> p.socketId==socketId)
        room.players.splice(index,1)
        return room;
    }catch(error){
        console.log(error)
        return null
    }
}

const sendMessage=({roomId,socketId,message})=>{
    try{
        const room=rooms.get(roomId)
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
        if(!room) return null
        if(room.players.length===0) return null
        room.guessed=[];
        room.notGuessed=[...room.players]
        if(!room.isPlaying){
            room.isPlaying = true
            room.choose = 0
        }
        else{
            const nextDrawerIndex = (room.choose + 1) % room.players.length
            if(nextDrawerIndex===0){
                room.round++
            }
            room.choose = nextDrawerIndex
        }
        

        room.players.forEach((player,index)=>{
            if(index===room.choose){
                player.isDrawing=true
            }
        })
        const currentDrawer = room.players[room.choose]
        const words=randomWords(room.settings.wordCount)
        if(!currentDrawer) return null
        room.notGuessed.forEach((player,index)=>{
            if(player.socketId===currentDrawer.socketId){
                room.notGuessed.splice(index,1)
            }
        })
        return {players:room.players,drawerId:currentDrawer.socketId,round:room.round,totalRounds:room.settings.numRounds,words:words,guessed:room.guessed,notGuessed:room.notGuessed};
    }
    catch(error){
        console.log(error)
        return null
    }
}


const drawWord=({roomId,word})=>{
    try{
        const room=rooms.get(roomId)
        if(!room) return null
        room.guessWord=word;
        return room;
    }catch(error){
        console.log(error)
        return null
    }
}


const updateScore=({roomId,socketId,score})=>{
    try{
        const room=rooms.get(roomId)
        if(!room) return null
        room.players.forEach((player) => {
            if(player.socketId==socketId){
                player.score=player.score+score
                room.guessed.push({
                     socketId,
                     scoreGained:score,
                     name:player.name,
                })
                room.notGuessed.forEach((player,index)=>{
                    if(player.socketId===socketId){
                        room.notGuessed.splice(index,1)
                    }
                }
                )
            }
        });
        return room
    }catch(error){
        console.log(error)
        return null
    }
}

const timerUpdate=(roomId)=>{
     try{
        const room=rooms.get(roomId)
        if(!room) return null
        return {time:room.settings.drawTime,guessed:room.guessed,players:room.players,notGuessed:room.notGuessed}
    }catch(error){
        console.log(error)
        return null
    }
}

const deleteRoom=(roomId)=>{
    try{
        const room=rooms.delete(roomId)
        if(!room) return null
        return room
    }catch(error){
        console.log(error)
        return null
    }
}


const verifyGuess=({roomId,message})=>{
     try{
        const room=rooms.get(roomId)
        if(!room) return null
        if(message===room.guessWord) return {room,res:true}
        else return {room,res:false}
    }catch(error){
        console.log(error)
        return null
    }
}

const getRoundScore=(roomId)=>{
    try{
        const room=rooms.get(roomId)
        if(!room) return null
        return room.guessed;
    }catch(error){
        console.log(error)
        return null
    }
}

module.exports={joinRoom,createRoom,exitRoom,sendMessage,gameStart,drawWord,updateScore,timerUpdate,deleteRoom,verifyGuess,getRoundScore}