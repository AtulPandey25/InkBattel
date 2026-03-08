const express = require("express")
const cors=require('cors')
const roomRoute=require("./routes/room.route")
const {app,server}=require("./utilities/socket")

app.use(
    cors({
        origin:"http://localhost:5173",
        credentials:true,
    })
)

app.use(express.json())
module.exports={app}

app.use("/room",roomRoute)

server.listen(8000,()=>{
    console.log("Server being listened on port 8000")
})