const wordData=require("../data/words.json")

const wordGenerator=()=>{
    return wordData.words[Math.floor(Math.random()*wordData.words.length)]
}


const randomWords=(wordCount)=>{
    const words=[]
    for(let i=0;i<wordCount;i++){
        const data=wordGenerator()
        if(words.includes(data)){
            i--;
            continue;
        }
        words.push(data)
    }

    return words
}

module.exports={randomWords}
