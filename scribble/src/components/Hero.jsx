import React, { useEffect, useState } from 'react'
import Avatar from './Avatar.jsx'
import { useDispatch,useSelector } from 'react-redux'
import { updateAvatar,createRooom } from '../features/userDetail'
import {useParams} from "react-router-dom"
import {useRoom} from "../store/roomStore"
import {useNavigate} from "react-router-dom"
import {joinRoom,joinPublicRoom} from "../services/socket.services.js"
import socket from '../utilities/socket.js'
import toast from "react-hot-toast"
const Hero = () => {
const room=useRoom()
const navigate=useNavigate()
const [isCreatingRoom, setIsCreatingRoom] = useState(false)
const [isStartingDrawing, setIsStartingDrawing] = useState(false)

const getMaskedJoinWord = (roomState, viewerSocketId) => {
  if (!roomState?.guessWord) return ""

  const currentDrawer = roomState.players?.[roomState.choose]
  const isDrawer = currentDrawer?.socketId === viewerSocketId
  if (isDrawer) return roomState.guessWord

  if (roomState.guessWord.includes("_")) return roomState.guessWord

  const revealed = new Set(Array.isArray(roomState.revealedHintIndexes) ? roomState.revealedHintIndexes : [])
  return roomState.guessWord
    .split("")
    .map((char, index) => {
      if (char === " ") return " "
      return revealed.has(index) ? char : "_"
    })
    .join("")
}

useEffect(()=>{
    if (socket.id && !room?.sktId) {
      room?.setSktId(socket.id)
    }

    const handlePlayerJoined = ({roomId, playerDetail, socketId, rooom})=>{
      const currentDrawer = rooom.players?.[rooom.choose]
      const phase = rooom.phase || (rooom.guessWord?.trim() ? "drawing" : (rooom.isPlaying ? "choosing" : "lobby"))
      const isChoosing = phase === "choosing"
      const isDrawing = phase === "drawing"

      room?.setPlayers(rooom.players)
      room?.setRoomId(roomId)
      room?.setMyDetail(playerDetail)
      room?.setHostId(rooom.hostId)
      room?.setRoomDetail(rooom)
      room?.setRound(rooom.round)
      room?.setMessages(rooom.messages)
      room?.setTimer(rooom.settings.drawTime)
      room?.setIsPlaying(Boolean(rooom.isPlaying))
      room?.setDrawerId(currentDrawer?.socketId || "")
      room?.setIsChoosing(isChoosing)
      room?.setDrawWord(isDrawing ? getMaskedJoinWord(rooom, socket.id) : "")
      if(socketId === socket.id){
        navigate('/ground')
      }
    }

    const handleJoinFailed = ({message})=>{
      setIsStartingDrawing(false)
      navigate("/")
      toast.error(message || "Unable to join room")
    }

    socket.on("player-joined", handlePlayerJoined)
    socket.on("join-room-failed", handleJoinFailed)

    return ()=>{
      socket.off("player-joined", handlePlayerJoined)
      socket.off("join-room-failed", handleJoinFailed)
    }

  },[navigate, room])
  const {roomId}=useParams();

  const smile=[
  "w-3 h-3 bg-black mt-2",
  "w-3 h-3 bg-black rounded-[50%] mt-3",
  "w-3 h-3 bg-black rounded-t-[50%] mt-3",
  "w-3 h-3 bg-black rounded-b-[50%] mt-3",
  "w-5 h-5 border-b-4 border-b-black rounded-b-3xl mt-1",
  "w-5 h-5 border-t-4 border-t-black rounded-t-3xl mt-2",
  "w-5 h-2 rounded-bl-lg border-b-3 border-black mt-3",
  "w-5 h-2 rounded-br-lg border-b-3 border-black mt-3",
  "w-6 h-3 border-b-4 border-b-black rounded-b-full mt-2",
  "w-4 h-2 border-t-4 border-t-black rounded-t-full mt-2",
  "w-4 h-4 border-2 border-black rounded-full mt-2",
  "w-6 h-2 border-b-2 border-black rounded-full mt-2",
  "w-6 h-2 border-t-2 border-black rounded-full mt-2",
  "w-3 h-1 bg-black rounded-full mt-3",
  "w-6 h-1 bg-black rounded-full mt-3",
  "w-5 h-3 border-2 border-black rounded-b-full border-t-0 mt-2",
  "w-5 h-3 border-2 border-black rounded-t-full border-b-0 mt-2"
]

const eyes=[
  "w-2 h-2 bg-black rounded-[50%]", // classic round
  "w-2 h-2 bg-black", // square
  "w-2 h-2 border-2 border-black bg-white rounded-[50%]", // outlined
  "w-3 h-1 bg-black rounded-t-[50%]", // half-moon (top)
  "w-3 h-1 bg-black rounded-b-[50%]", // half-moon (bottom)
  "w-2 h-2 bg-black rounded-[50%] opacity-50", // sleepy
  "w-4 h-1 bg-black rounded-t-full", // curved up (smile)
  "w-3 h-2 bg-black rounded-b-full", // curved down (sad)
  "w-3 h-2 border-t-4 border-black bg-transparent rounded-t-full", // skribble style up
  "w-3 h-2 border-b-4 border-black bg-transparent rounded-b-full", // skribble style down
  "w-2 h-2 bg-white border-2 border-black rounded-[50%]", // white eye with black border
  "w-3 h-3 bg-black rounded-full",
  "w-2 h-3 bg-black rounded-full",
  "w-4 h-1 border-t-2 border-black rounded-full",
  "w-4 h-1 border-b-2 border-black rounded-full",
  "w-3 h-2 border border-black bg-white rounded-full"
]


const colours=[
  "bg-red-600",
  "bg-rose-600",
  "bg-blue-600",
  "bg-sky-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-fuchsia-600",
  "bg-orange-600",
  "bg-amber-600",
  "bg-lime-600",
  "bg-green-600",
  "bg-emerald-600",
  "bg-teal-600",
  "bg-violet-600",
  "bg-yellow-600",
  "bg-purple-600",
  "bg-cyan-600",
  "bg-slate-600",
  "bg-stone-600"
]

const [sm,setSm]=useState(0)
const [eye,seteye]=useState(0)
const [clr,setclr]=useState(0)
const [name,setName]=useState("")

  const dispatch = useDispatch()
  const playerDetail =useSelector((state)=>state?.avatarUser)
  useEffect(()=>{
    const stored = localStorage.getItem("userDetail");
    if(stored){
      try{
        const ava = JSON.parse(stored);
        setName(ava.name || "");
        seteye(Number(ava.eye) || 0);
        setclr(Number(ava.clr) || 0);
        setSm(Number(ava.sm) || 0);
        const restored = { name: (ava.name || ""), colour: colours[Number(ava.clr) || 0], eyes: eyes[Number(ava.eye) || 0], smile: smile[Number(ava.sm) || 0] };
        dispatch(updateAvatar(restored));
      }catch(err){
        console.warn('Failed to parse userDetail from localStorage', err);
      }
    }
  },[dispatch,updateAvatar])



const [avatarVal,setAvatarVal]=useState({})

const createRoom=()=>{
  if (isCreatingRoom) return
  if(name.trim()==""){
    return toast.error("Please enter the name")
  }
  setIsCreatingRoom(true)
  const payload = {name:name,colour:colours[clr],eyes:eyes[eye],smile:smile[sm]}
  setAvatarVal(payload)
  dispatch(updateAvatar(payload))
  try{
    localStorage.setItem("userDetail", JSON.stringify({name,clr,eye,sm}));
  }catch(err){
    console.warn('Failed to save userDetail to localStorage', err);
  }
  dispatch(createRooom(true))
}

const submit=(e)=>{
  e.preventDefault()
  if (isStartingDrawing) return
  if(name.trim()==""){
    return toast.error("Please enter the name")
  }
  setIsStartingDrawing(true)
  const payload = {name:name,colour:colours[clr],eyes:eyes[eye],smile:smile[sm]}
  setAvatarVal(payload)
  dispatch(updateAvatar(payload))
  try{
    localStorage.setItem("userDetail", JSON.stringify({name,clr,eye,sm}));
    joinPublicRoom(payload)
  }catch(err){
    console.warn('Failed to save userDetail to localStorage', err);
  }
}

const joinRoomm=(roomId,playerDetail)=>{
  if (isStartingDrawing) return
  if(name.trim()==""){
    return toast.error("Please enter the name")
  }
    setIsStartingDrawing(true)
    const payload = {name:name,colour:colours[clr],eyes:eyes[eye],smile:smile[sm]}
    setAvatarVal(payload)
    dispatch(updateAvatar(payload))
  try{
    localStorage.setItem("userDetail", JSON.stringify({name,clr,eye,sm}));
    joinRoom(roomId,payload)
  }catch(err){
    console.warn('Failed to save userDetail to localStorage', err);
  }
}

const incSmile=()=>{
  setSm((prev)=> (prev + 1) % smile.length)
}

const decSmile=()=>{
  setSm((prev)=> (prev - 1 + smile.length) % smile.length)
}
const incEye=()=>{
  seteye((prev)=> (prev + 1) % eyes.length)
}

const decEye=()=>{
  seteye((prev)=> (prev - 1 + eyes.length) % eyes.length)
}


const incClr=()=>{
  setclr((prev)=> (prev + 1) % colours.length)
}

const decClr=()=>{
  setclr((prev)=> (prev - 1 + colours.length) % colours.length)
}

  
  return (
    <div className="paper-container w-screen h-screen flex justify-center items-center">
  <div className="paper-card">
    <h1>Play A Game</h1>
    
    <div className="input-group">
      <label >Your Name:</label>
      <input value={name} onChange={(e)=>setName(e.target.value)} type="text" id="name" placeholder="Type here..."/>
    </div>

    <div className="character-section">
      <p>Choose your Avatar:</p>
      <div className="avatar-grid">
    
        <div className="w-70 flex flex-col justify-center items-center relative">
          <div className="absolute left-0 flex flex-col items-center h-full justify-between w-full pointer-events-none" style={{top: 0, height: '100%'}}>
            <div className="flex w-full justify-between items-center" style={{marginTop: '-3px'}}>
              <button onClick={incEye} className="mx-2 text-4xl select-none pointer-events-auto bg-white/80 rounded-full px-2" aria-label="Previous Eye">{'<'}</button>
              <span></span>
              <button onClick={decEye} className="mx-2 text-4xl select-none pointer-events-auto bg-white/80 rounded-full px-2" aria-label="Next Eye">{'>'}</button>
            </div>
            <div className="flex w-full justify-between items-center" style={{marginTop: '0px'}}>
              <button onClick={incSmile}  className="mx-2 text-4xl select-none pointer-events-auto bg-white/80 rounded-full px-2" aria-label="Previous Mouth">{'<'}</button>
              <span></span>
              <button onClick={decSmile}  className="mx-2 text-4xl select-none pointer-events-auto bg-white/80 rounded-full px-2" aria-label="Next Mouth">{'>'}</button>
            </div>
            <div className="flex w-full justify-between items-center" style={{marginTop: '0px'}}>
              <button onClick={incClr} className="mx-2 text-4xl select-none pointer-events-auto bg-white/80 rounded-full px-2" aria-label="Previous Body">{'<'}</button>
              <span></span>
              <button onClick={decClr} className="mx-2 text-4xl select-none pointer-events-auto bg-white/80 rounded-full px-2" aria-label="Next Body">{'>'}</button>
            </div>
          </div>
          <Avatar colourr={colours[clr]} eyee={eyes[eye]} smilee={smile[sm]}/>
        </div>

      </div>
    </div>

    <div className="mt-4 flex w-full flex-col items-center gap-3">
      {roomId
        ? <button onClick={()=>joinRoomm(roomId,playerDetail)} disabled={isStartingDrawing} className="draw-btn w-full max-w-70" style={{opacity: isStartingDrawing ? 0.7 : 1, cursor: isStartingDrawing ? 'not-allowed' : 'pointer'}}>{isStartingDrawing ? 'STARTING...' : 'START DRAWING'}</button>
        : <button onClick={(e)=>submit(e)} disabled={isStartingDrawing} className="draw-btn w-full max-w-70" style={{opacity: isStartingDrawing ? 0.7 : 1, cursor: isStartingDrawing ? 'not-allowed' : 'pointer'}}>{isStartingDrawing ? 'STARTING...' : 'START DRAWING'}</button>}
      {roomId
        ? null
        : <button onClick={()=>createRoom()} disabled={isCreatingRoom} className="draw-btn w-full max-w-70" style={{opacity: isCreatingRoom ? 0.7 : 1, cursor: isCreatingRoom ? 'not-allowed' : 'pointer'}}>{isCreatingRoom ? 'CREATING...' : 'CREATE ROOM'}</button>}
    </div>
  </div>
</div>
  )
}




export default Hero
