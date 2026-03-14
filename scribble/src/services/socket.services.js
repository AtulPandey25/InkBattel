import socket from "../utilities/socket.js"

export const createRoom=(roomSettings, playerDetail)=>{
    try{
        socket.emit("create-room", {roomSettings, playerDetail})
    }
    catch(error){
        console.log(error)
    }
}

export const joinRoom=(roomId,playerDetail)=>{
    try{
        socket.emit("join-room",{roomId,playerDetail})
    }
    catch(error){
        console.log(error)
    }
    

}

export const exitRoom=(roomId)=>{
    try{
        socket.emit("exit-room",{roomId})
    }catch(error){
        console.log(error)
    }

}

export const sendMessage=(roomId,message)=>{
    try{
        socket.emit("send-message",{roomId,message})
    }catch(error){
        console.log(error)
    }
}

export const gameBegin=(roomId)=>{
    try{
        socket.emit("start-game",roomId)
    }catch(error){
        console.log(error)
    }
}

export const drawWord=(roomId,word)=>{
    try{
        socket.emit("draw-word",{roomId,word})
    }catch(error){
        console.log(error)
    }
}

export const updateScore=(roomId,score,drawerId)=>{
    try{
        socket.emit("update-score",{roomId,socketId:socket.id,score,drawerId})
    }catch(error){
        console.log(error)
    }
}

export const manageTimer=(roomId)=>{
    try{
        socket.emit("timer-start",roomId)
    }catch(error){
        console.log(error)
    }
}

export const verifyGuess=({roomId,message})=>{
    try{
        socket.emit("verify-guess",{roomId,message})
    }catch(error){
        console.log(error)
    }
}

const guessedMessage=(roomId,socketId,name)=>{
    try{
        socket.emit("guessed-message",{roomId,socketId,name})
    }catch(error){
        console.log(error)
    }
}

export const chooseTimer=(roomId,socketId,drawerId)=>{
    try{
        socket.emit("choose-timer",{roomId,socketId,drawerId})
    }catch(error){
        console.log(error)
    }
}

export const joinPublicRoom=(playerDetail)=>{
    try{
        socket.emit("public-room-join",{playerDetail})
    }catch(error){
        console.log(error)
    }
}