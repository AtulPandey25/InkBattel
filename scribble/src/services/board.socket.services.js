import socket from "../utilities/socket.js"

export const startOnBoard=(xRatio,yRatio,roomId)=>{
    try{
        socket.emit("start-board",{xRatio,yRatio,roomId})
    }
    catch(error){
        console.log(error)
    }
}

export const drawOnBoard=(xRatio,yRatio,tool,roomId,pencilStrok,eraserStrok,pencilClr)=>{
    try{
        socket.emit("draw-board",{xRatio,yRatio,tool,roomId,pencilStrok,eraserStrok,pencilClr})
    }
    catch(error){
        console.log(error)
    }
}

export const stopOnBoard=(roomId)=>{
    try{
        socket.emit("stop-board",{roomId})
    }
    catch(error){
        console.log(error)
    }
}

export const clearOnBoard=(roomId)=>{
    try{
        socket.emit("clear-board",{roomId})
    }
    catch(error){
        console.log(error)
    }
}

export const requestBoardSync = (roomId) => {
    try{
        socket.emit("request-board-sync", { roomId })
    }catch(error){
        console.log(error)
    }
}

export const sendBoardSnapshot = (roomId, imageData, requesterId) => {
    try{
        socket.emit("board-snapshot", { roomId, imageData, requesterId })
    }catch(error){
        console.log(error)
    }
}