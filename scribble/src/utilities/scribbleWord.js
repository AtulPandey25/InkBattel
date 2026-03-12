

export const getScribbleWord=(word,room)=>{
    return word.split("").map((char)=>{
        if(char===" ") return " "
        if(room?.hintsShown>0){

        }
        else return "_"
    }).join(" ")
}

export const scoreDisplay=(drawerId,room,guessed)=>{
    room?.setDisplayScore(true)
    setInterval(() => {
    }, 5000);
    room?.setDisplayScore(false)
    
}