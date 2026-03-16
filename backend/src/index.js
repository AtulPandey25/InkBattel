require("dotenv").config()
const express = require("express")
const cors=require('cors')
const roomRoute=require("./routes/room.route")
const {app,server}=require("./utilities/socket")

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
const port = Number(process.env.PORT) || 8000

app.use(
    cors({
        origin:clientUrl,
        credentials:true,
    })
)

app.use(express.json())
module.exports={app}

app.use("/room",roomRoute)

server.listen(port,()=>{
    console.log(`Server being listened on port ${port}`)
})