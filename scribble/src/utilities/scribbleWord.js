export const getScribbleWord = (roomId,word = "", revealedHintIndexes = []) => {
    const revealedHints = new Set(revealedHintIndexes)
    return word
        .split("")
        .map((char, index) => {
            if (char === " ") return " "
            if (revealedHints.has(index)) {
                return char
            }

            return "_"
        })
        .join(" ")


}




export const scoreDisplay=(drawerId,room,guessed)=>{
    room?.setDisplayScore(true)
    setInterval(() => {
    }, 5000);
    room?.setDisplayScore(false)
}