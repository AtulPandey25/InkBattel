const wordData=require("../data/words.json")

const wordGenerator=()=>{
    return wordData.words[Math.floor(Math.random()*wordData.words.length)]
}


const randomWords=(wordCount, excludedWords=[])=>{
    const requestedCount = Number(wordCount) || 0
    if(requestedCount<=0) return []

    const excludedSet = new Set(Array.isArray(excludedWords) ? excludedWords : [])
    const availableWords = wordData.words.filter((word)=>!excludedSet.has(word))
    const pool = [...availableWords]
    const words=[]
    const limit = Math.min(requestedCount, pool.length)

    for(let i=0;i<limit;i++){
        const randomIndex = Math.floor(Math.random()*pool.length)
        words.push(pool[randomIndex])
        pool.splice(randomIndex,1)
    }

    return words
}

module.exports={randomWords}
