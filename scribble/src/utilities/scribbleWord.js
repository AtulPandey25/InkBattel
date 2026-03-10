
export const getScribbleWord=(word)=>{
    return word.split("").map((char)=>char=== " " ? "\u00A0" : "_").join(" ")
}

export const scoreDisplay=(drawerId,room,guessed)=>{
    room?.setDisplayScore(true)
    setInterval(() => {
    }, 5000);
    room?.setDisplayScore(false)
    
}