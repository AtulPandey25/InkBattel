const { io } = require("../utilities/socket")
const {v4:uuidv4} = require("uuid")
const {rooms}=require('../model/room.model.js')
const {randomWords}=require("../utilities/words.js")

const createSystemMessage = (message, systemType) => ({
    name: "System",
    socketId: "system",
    message,
    type: "system",
    systemType,
})

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
            phase:"lobby",
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
            revealedHintIndexes:[],
            displayedWords:[],
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
        if(room.players.length===room.settings.numPlayers){
            return null
        }
        socket.join(roomId)
        const joinedPlayer = {
            ...playerDetail,
            socketId: socket.id,
            score: 0,
            isDrawing: false
        }
        room.players.push(joinedPlayer)
        room.messages.push(createSystemMessage(`${joinedPlayer.name} joined the room`, "join"))

        // If a round is active (choosing/drawing), include late joiners in current guessers.
        if(room.isPlaying && (room.phase === "choosing" || room.phase === "drawing")){
            const currentDrawer = room.players[room.choose]
            if(!currentDrawer || currentDrawer.socketId !== socket.id){
                room.notGuessed.push(joinedPlayer)
            }
        }
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
        room.messages.push(createSystemMessage(`${player.name} exited the room`, "exit"))
        const index=room.players.findIndex((p)=> p.socketId==socketId)
        room.players.splice(index,1)

        // Keep drawer index valid after removing a player.
        if(room.players.length>0){
            if(index < room.choose){
                room.choose = Math.max(0, room.choose - 1)
            }
            else if(room.choose >= room.players.length){
                room.choose = 0
            }
        }

        const notGuessedIndex = room.notGuessed.findIndex((player)=>player.socketId==socketId)
        if(notGuessedIndex!==-1){
            room.notGuessed.splice(notGuessedIndex,1)
        }

        const guessedIndex = room.guessed.findIndex((player)=>player.socketId==socketId)
        if(guessedIndex!==-1){
            room.guessed.splice(guessedIndex,1)
        }

        if(room.hostId===socketId && room.players.length>0){
            const nextHostIndex = index >= room.players.length ? 0 : index
            room.hostId = room.players[nextHostIndex].socketId
            room.messages.push(createSystemMessage(`${room.players[nextHostIndex].name} is the new host`, "host-transfer"))
        }

        if(room.players.length===1 && room.isPlaying){
            const rm={...room}
            rooms.delete(roomId)
            console.log(rm)
            return rm
        }
        else if(room.players.length===0){
            rooms.delete(roomId)
            return null
        }

        else return room;
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
                type:"chat",
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
        room.guessWord=""
        room.revealedHintIndexes=[]
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
        

        room.phase = "choosing"

        room.players.forEach((player,index)=>{
            player.isDrawing = index===room.choose
        })
        const currentDrawer = room.players[room.choose]
        let words=randomWords(room.settings.wordCount, room.displayedWords)

        // When all words are exhausted for this room, restart the cycle.
        if(words.length < room.settings.wordCount){
            room.displayedWords=[]
            words = randomWords(room.settings.wordCount, room.displayedWords)
        }

        
        room.displayedWords=[...new Set([...room.displayedWords,...words])]
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
        room.revealedHintIndexes=[]
        room.phase = "drawing"
        return room;
    }catch(error){
        console.log(error)
        return null
    }
}


const updateScore=({roomId,socketId,score,drawerId})=>{
    try{
        const room=rooms.get(roomId)
        if(!room) return null
        if(room.phase !== "drawing") return room

        const guesserIndex = room.notGuessed.findIndex((player)=>player.socketId===socketId)
        if(guesserIndex===-1) return room

        room.players.forEach((player) => {
            if(player.socketId==socketId){
                player.score=player.score+score
                room.guessed.push({
                     socketId,
                     scoreGained:score,
                     name:player.name,
                })
                room.notGuessed.splice(guesserIndex,1)
            }
            if(player.socketId===drawerId){
                player.score=player.score+50;
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

const markRoundEnded=(roomId)=>{
    try{
        const room=rooms.get(roomId)
        if(!room) return null
        room.phase = "scoring"
        room.guessWord = ""
        room.players.forEach((player)=>{
            player.isDrawing = false
        })
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
        const normalizedMessage = String(message || "").trim().toLowerCase()
        const normalizedWord = String(room.guessWord || "").trim().toLowerCase()
        if(normalizedMessage!=="" && normalizedMessage===normalizedWord) return {room,res:true}
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

const getHintsIndex=(roomId)=>{
    try{
        const room=rooms.get(roomId)
        if(!room) return null
        if(!room.guessWord) return null

        const availableIndexes = room.guessWord
            .split("")
            .map((char, index) => (char === " " ? -1 : index))
            .filter((index) => index !== -1 && !room.revealedHintIndexes.includes(index))

        if(availableIndexes.length===0) return null

        const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
        room.revealedHintIndexes.push(randomIndex)
        return randomIndex
    }catch(error){
        console.log(error)
        return null
    }
}


const getPublicRoomId=()=>{
    try{
        for(const room of rooms.values()){
            if(room.settings.visibility==="public" && room.settings.numPlayers>room.players.length){
                return room.roomId
            }
        }
        return null
    }   
    catch(error){
        console.log(error)
        return null
    }
}


const replay=(roomId,socketId,playerDetail,roomSettings,socket)=>{
    try{
        const room=rooms.get(roomId)
        if(!room){
            const rooom=createRoom(socketId, playerDetail, roomSettings)
            if(!rooom) return {create:false,rooom:null}
            const oldRoomId=rooom.roomId
            rooms.delete(oldRoomId)
            rooom.roomId=roomId
            rooms.set(roomId, rooom);
            return {create:true,rooom}
        }
        else{
            const rooom=joinRoom(socket,roomId,playerDetail)
            if(!rooom) return {create:false,rooom:null}
            return {create:false,rooom}
        }

    }catch(error){
        console.log(error)
        return null
    }
}



const getHints=(roomId,revealedHints)=>{
    const room=rooms.get(roomId)
    if(!room) return null
    const word=room.guessWord
    if(!word || word.trim()==="") return null

    const revealed = Array.isArray(revealedHints)
        ? revealedHints
        : room.revealedHintIndexes
    const revealedSet = new Set(revealed)

    return word
        .split("")
        .map((char, index) => {
            if (char === " ") return " "
            if (revealedSet.has(index)) {
                return char
            }

            return "_"
        })
        .join(" ")
}

module.exports={joinRoom,createRoom,exitRoom,sendMessage,gameStart,drawWord,updateScore,timerUpdate,deleteRoom,verifyGuess,getRoundScore,markRoundEnded,getHintsIndex,getPublicRoomId,replay,getHints}