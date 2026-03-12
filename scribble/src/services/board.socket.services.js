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

