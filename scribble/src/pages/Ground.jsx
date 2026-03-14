import React, { useState,useEffect, useRef } from 'react'
import Canvass from '../components/Canvas'
import Start from '../components/Start'
import {useRoom} from '../store/roomStore'
import socket from "../utilities/socket"
import {exitRoom} from "../services/socket.services.js"
import {sendMessage,updateScore,verifyGuess,chooseTimer,drawWord,manageTimer} from "../services/socket.services.js"
import toast from "react-hot-toast"
import {useNavigate} from "react-router-dom"
import { useDispatch } from 'react-redux'
import { createRooom } from '../features/userDetail'
import Avatar from "../components/Avatar.jsx"
import Player from "../components/Player.jsx"
import {getScribbleWord} from "../utilities/scribbleWord.js"
import Score from '../components/Score.jsx'
import FinalScoreCard from '../components/FinalScoreCard.jsx'
const PlayGround = () => {
  const room = useRoom()
  const [message, setMessage] = useState('')
  const [correctWord, setCorrectWord] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [isSoundOn, setIsSoundOn] = useState(() => {
    const savedSoundState = localStorage.getItem("scribble-sound")
    if (savedSoundState === null) return true
    return savedSoundState === "on"
  })
  const [isGameOn,setIsGameOn]=useState(false)
  const chooseFallbackRef = useRef(null)
  const settingsRef = useRef(null)
  const messagesEndRefDesktop = useRef(null)
  const messagesEndRefMobile = useRef(null)
  const playerEndRef = useRef(null)
  const playerEndRefMobile = useRef(null)
  const [time,setTime]=useState(3)
  const navigate=useNavigate()
  const dispatch = useDispatch()


  const decideScore=()=>{
    if(room?.guessedPlayers.length===0) return 200+room?.timer;
    else if(room?.guessedPlayers.length===1) return 150+room?.timer;
    else if(room?.guessedPlayers.length===2) return 100+room?.timer;
    else return 50+room?.timer;
  }
   useEffect(() => {
    return () => {
      if (chooseFallbackRef.current) {
        clearTimeout(chooseFallbackRef.current)
      }
      if (room.roomId) {
        exitRoom(room.roomId)
      }
    }
  }, [room.roomId])

  useEffect(()=>{
       if (socket.id && !room?.sktId) {
      room?.setSktId(socket.id)
    }
  }, [])


  useEffect(()=>{
    const handlePlayerJoined = ({roomId, rooom})=>{
      const currentDrawer = rooom.players?.[rooom.choose]
      const phase = rooom.phase || (rooom.guessWord?.trim() ? "drawing" : (rooom.isPlaying ? "choosing" : "lobby"))
      const isChoosing = phase === "choosing"
      const isDrawing = phase === "drawing"

      room?.setPlayers(rooom.players)
      room?.setRoomId(roomId)
      room?.setHostId(rooom.hostId)
      room?.setRoomDetail(rooom)
      room?.setRound(rooom.round)
      room?.setTimer(rooom.settings.drawTime)
      room?.setIsPlaying(Boolean(rooom.isPlaying))
      room?.setDrawerId(currentDrawer?.socketId || "")
      room?.setIsChoosing(isChoosing)
      room?.setMessages(rooom.messages)
      room?.setDrawWord(isDrawing ? rooom.guessWord : "")
    }

    const handlePlayerExited = ({rooom})=>{
      room?.setPlayers(rooom.players)
      room?.setRoomDetail(rooom)
      room?.setMessages(rooom.messages)
    }

    const handleNewMessage = ({meessage})=>{
      console.log("Reached")
      console.log(meessage)
      room?.setMessages(meessage)
    }

    const handleRoundStarted = async ({roomId,players,drawerId,round,words,guessed,notGuessed})=>{
      if (chooseFallbackRef.current) {
        clearTimeout(chooseFallbackRef.current)
        chooseFallbackRef.current = null
      }
      room?.setTimer(room?.roomDetail.settings.drawTime)
      room?.setIsPlaying(true)
      room?.setDrawerId(drawerId)
      room?.setRound(round)
      room?.setWords(words)
      room?.setGuessedPlayers(guessed || [])
      room?.setNotGuessedPlayers(notGuessed || [])
      room?.setGuessed(false)
      room?.setDrawWord("")
      room?.resetHintState()
      room?.setDisplayScore(false)
      setIsGameOn(false)

      if (room?.sktId === drawerId) {
        await chooseTimer(roomId, room?.sktId, drawerId)
      }
      room?.setIsChoosing(true)

      if (room?.sktId === drawerId) {
        chooseFallbackRef.current = setTimeout(() => {
          const index = Math.floor(Math.random() * words.length)
          const fallbackWord = words[index]
          if (!fallbackWord) return
          room?.setIsChoosing(false)
          setIsGameOn(true)
          drawWord(roomId, fallbackWord)
          manageTimer(roomId)
          chooseFallbackRef.current = null
        }, 15000)
      }
      setIsGameOn(true)
    }

    const handleRoundEnded = ({correctWord,guessed,notGuessed})=>{
      room?.setGuessedPlayers(guessed || [])
      setCorrectWord(correctWord || "")
      room?.setDisplayScore(true)
      room?.setNotGuessedPlayers(notGuessed || [])
      room?.setIsChoosing(false)
      room?.resetHintState()
      room?.setTimer(15)
      setIsGameOn(false)
    }

    const handleGuessWord = ({word})=>{
      if (chooseFallbackRef.current) {
        clearTimeout(chooseFallbackRef.current)
        chooseFallbackRef.current = null
      }
      room?.setDrawWord(word)
      room?.resetHintState()
      room?.setIsChoosing(false)
    }

    const handleUpdateTime = ({time})=>{
      if(time==0){
        room?.setGuessed(false)
        room?.setDrawWord("")
        room?.resetHintState()
        setIsGameOn(false)
      }
      room?.setTimer(time)
    }

    const handleGameEnded = ()=>{
      setTimeout(() => {
        room?.setDisplayFinalScore(true)
        dispatch(createRooom(false))
        room?.setMessages([])
        room?.setDisplayScore(false)
        room?.setIsPlaying(false)
        room?.setIsChoosing(false)
        room?.setGuessed(false)
        room?.setDrawWord("")
        room?.resetHintState()
      }, 3000)
    }

    const handleVerified = ({res})=>{
      room?.setVerify(res)
    }

    const handleScoreUpdated = ({rooom})=>{
      room?.setRoomDetail(rooom)
      room?.setPlayers(rooom.players)
      room?.setGuessedPlayers(rooom.guessed || [])
      room?.setNotGuessedPlayers(rooom.notGuessed || [])
    }


    const handleHints=({ hintIndex })=>{
      const currentRoom = useRoom.getState()
      if (typeof hintIndex !== "number" || hintIndex < 0) {
        return
      }

      currentRoom.addRevealedHintIndex(hintIndex)
      currentRoom.incrementHintsShown()
    }

    const handleNoPlayerLeft=({roomId})=>{
      toast.error(`Everyone Left Closing room in ${time} seconds`)
      setTimeout(() => {
        dispatch(createRooom(false))
        navigate("/")
      }, 3000);
    }

    socket.on("player-joined", handlePlayerJoined)
    socket.on("player-exited", handlePlayerExited)
    socket.on("new-message", handleNewMessage)
    socket.on("round-started", handleRoundStarted)
    socket.on("round-ended", handleRoundEnded)
    socket.on("guess-word", handleGuessWord)
    socket.on("update-time", handleUpdateTime)
    socket.on("game-ended", handleGameEnded)
    socket.on("verified", handleVerified)
    socket.on("score-updated", handleScoreUpdated)
    socket.on("show-hints", handleHints)
    socket.on("no-player-left",handleNoPlayerLeft)
    
    
    return ()=>{
      if (chooseFallbackRef.current) {
        clearTimeout(chooseFallbackRef.current)
        chooseFallbackRef.current = null
      }
      socket.off("player-joined", handlePlayerJoined)
      socket.off("player-exited", handlePlayerExited)
      socket.off("new-message", handleNewMessage)
      socket.off("round-started", handleRoundStarted)
      socket.off("round-ended", handleRoundEnded)
      socket.off("guess-word", handleGuessWord)
      socket.off("update-time", handleUpdateTime)
      socket.off("game-ended", handleGameEnded)
      socket.off("verified", handleVerified)
      socket.off("score-updated", handleScoreUpdated)
      socket.off("show-hints", handleHints)
      socket.off("no-player-left",handleNoPlayerLeft)

    }
  },[])

  useEffect(() => {
    messagesEndRefDesktop.current?.scrollIntoView({ behavior: 'smooth' })
    messagesEndRefMobile.current?.scrollIntoView({ behavior: 'smooth' })
  }, [room?.messages])

  useEffect(()=>{
    playerEndRef.current?.scrollIntoView({behavior:'smooth'})
    playerEndRefMobile.current?.scrollIntoView({behavior:'smooth'})
  },[room?.players])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const handleSoundToggle = () => {
    const nextState = !isSoundOn
    setIsSoundOn(nextState)
    localStorage.setItem("scribble-sound", nextState ? "on" : "off")
  }

const copyLink=async (roomId)=>{
    try {
      const text = `${window.location.origin}/join/${roomId}`;
      await navigator.clipboard.writeText(text);
      toast.success("Link Copied Successfully")
    }catch(error){
      console.error(error);
      toast.error("Failed to copy link")
    }
}

const sendMessages=(roomId,message)=>{
  try {
     if(message.trim()!="" && room?.drawWord.toLowerCase()===message.toLowerCase()){

      if(room?.sktId===room?.drawerId) {
        if(isSoundOn && isGameOn && !room?.isChoosing){
          const audio=new Audio("../../sounds/faa.mp3")
          audio.play()
        }
        return toast.error("You are not elligible")
      }
      if(room?.sktId!==room?.drawerId && !room?.guessed)
        {toast.success("You guessed It right !!!")
        room?.setGuessed(true)
        const score = decideScore();
        updateScore(roomId,score,room?.drawerId)
        sendMessage(roomId,`${room?.myDetail.name} has guessed`)
      }
    }
    else{
        if(isSoundOn && isGameOn && !room?.isChoosing){
          const audio=new Audio("../../sounds/faa.mp3")
          audio.play()
        }
        sendMessage(roomId,message)
    }
  } catch (error) {
    console.log(error)
    toast.error("Failed to send message")
  }
}


const isDrawer = room?.drawerId === room?.sktId
const hasSelectedWord = room?.drawWord?.trim() !== ""
const navbarWord = !hasSelectedWord
  ? "Waiting"
  : (isDrawer || room?.guessed || room?.displayScore)
    ? room?.drawWord
    : getScribbleWord(room?.roomId,room?.drawWord, room?.revealedHintIndexes)



  return (
    <div className="relative w-screen h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <div className="w-full h-20 bg-white border-b-4 border-gray-300 flex items-center justify-between px-6 shadow-md">
        {/* Left: Clock and Round */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-2xl font-bold text-gray-800">{room?.timer}s</span>
          </div>
          <div className="text-lg font-semibold text-gray-700">
            Round {room?.round}/{room?.roomDetail?.settings?.numRounds}
          </div>
        </div>

        {/* Middle: Word Display */}
        <div className="flex-1 flex justify-center">
          <div className="bg-gray-200 px-8 py-3 rounded-lg border-2 border-gray-400">
            <span className="text-2xl font-bold tracking-widest text-gray-800">{navbarWord}</span>
          </div>
        </div>

        {/* Right: Share Icon */}
        <div className="flex items-center">
          <button onClick={()=>copyLink(room?.roomId)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
        <div className="relative flex items-center" ref={settingsRef}>
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {showSettings && (
            <div className="absolute right-0 top-14 z-30 w-52 rounded-xl border-2 border-gray-300 bg-white p-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Sound</span>
                <button
                  type="button"
                  onClick={handleSoundToggle}
                  className={`relative h-6 w-12 overflow-hidden rounded-full border-2 transition-colors ${isSoundOn ? 'border-green-500 bg-green-500' : 'border-gray-400 bg-gray-300'}`}
                  aria-label="Toggle sound"
                >
                  <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${isSoundOn ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <p className="mt-2 text-xs font-medium text-gray-500">{isSoundOn ? 'On' : 'Off'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar - Players List (Desktop) */}
        <div className="hidden md:flex w-64 bg-white border-r-4 border-gray-300 flex-col shadow-lg flex-shrink-0">
          {/* Players Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4">
            <h2 className="text-xl font-bold">Players</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {/* Player items */}
            {room?.players?.length > 0 ? (
              [...room.players].sort((a, b) => b.score - a.score).map((player, index) => {
                const hasGuessed = room?.guessedPlayers?.some((gp) => gp.socketId === player.socketId)
                return (
                <div key={player?.socketId || index} className={`rounded-lg p-3 mb-2 border-2 transition-all duration-500 ${hasGuessed ? 'bg-green-100 border-green-400' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
                      {/* <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {player?.name?.charAt(0).toUpperCase() || 'P'}
                      </div> */}
                      <div><Avatar className="w-15 h-15" colourr={player?.colour} eyee={player?.eyes} smilee={player?.smile} /></div>
                      <span className="font-semibold text-gray-800">{player?.name || 'Player'} {player.socketId===room?.sktId?"(You)":null}</span>
                    </div>
                    <span className={`text-sm font-bold ${hasGuessed ? 'text-green-700' : 'text-green-600'}`}>{player?.score}</span>
                  </div>
                </div>
                )
              })
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <p>No players yet</p>
              </div>
            )}
            <div ref={playerEndRef}/>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="h-[70vh] md:h-auto flex-1 flex items-center justify-center bg-gray-100 p-2 md:p-4 min-w-0 overflow-hidden">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-300 w-full h-full max-w-5xl max-h-full flex items-center justify-center">
            <Canvass key={room?.drawerId}/>
          </div>
        </div>

        {/* Right Sidebar - Chat (Desktop) */}
        <div className="hidden md:flex w-80 bg-white border-l-4 border-gray-300 flex-col shadow-lg flex-shrink-0">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4">
            <h2 className="text-xl font-bold">Chat</h2>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {room?.messages?.length > 0 ? (
              room?.messages?.map((msg, index) => {
                const isGuessMsg = msg?.message?.trim()?.toLowerCase()?.endsWith("has guessed")
                const isJoinMsg = msg?.type === 'system' && msg?.systemType === 'join'
                const isExitMsg = msg?.type === 'system' && msg?.systemType === 'exit'
                return (
                <div key={index} className={`mb-2 p-2 rounded-lg border ${isJoinMsg ? 'bg-yellow-100 border-yellow-300' : isExitMsg ? 'bg-red-100 border-red-300' : isGuessMsg ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200'}`}>
                  {isJoinMsg || isExitMsg ? (
                    <span className={`block text-center font-semibold ${isJoinMsg ? 'text-yellow-800' : 'text-red-800'}`}>{msg.message}</span>
                  ) : (
                    <>
                      <span className={`font-semibold ${isGuessMsg ? 'text-green-700' : 'text-blue-600'}`}>{msg.socketId===room?.sktId?"You":msg.name}: </span>
                      <span className={isGuessMsg ? 'font-semibold text-green-800' : 'text-gray-800'}>{msg.message}</span>
                    </>
                  )}
                </div>
                )
              })
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <p>No messages yet</p>
                <p className="text-sm mt-2">Start guessing!</p>
              </div>
            )}
            <div ref={messagesEndRefDesktop} />
          </div>

          {/* Message Input (Desktop) */}
          <div className="p-3 bg-white border-t-2 border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your guess..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (message.trim()){
                      sendMessages(room?.roomId,message)
                      setMessage('')
                    }
                  }
                }
              }
              />
              <button
                onClick={() => {
                  if (message.trim()) {
                    sendMessages(room?.roomId,message)
                    setMessage('')
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-md"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Section - Players & Messages (20vh) */}
        <div className="md:hidden flex h-[20vh] w-full border-t-4 border-gray-300">
          {/* Players List (Mobile - Left 50%) */}
          <div className="w-1/2 bg-white border-r-2 border-gray-300 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3">
              <h2 className="text-sm font-bold">Players</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {room?.players?.length > 0 ? (
                [...room.players].sort((a, b) => b.score - a.score).map((player, index) => {
                  const hasGuessed = room?.guessedPlayers?.some((gp) => gp.socketId === player.socketId)
                  return (
                  <div key={player?.socketId || index} className={`rounded p-2 mb-1 border text-xs transition-all duration-500 ${hasGuessed ? 'bg-green-100 border-green-400' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-700">#{index + 1}</span>
                        {/* <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                          {player?.name?.charAt(0).toUpperCase() || 'P'}
                        </div> */}
                        <div><Avatar className="w-15 h-15" colourr={player?.colour} eyee={player?.eyes} smilee={player?.smile} /></div>
                        <span className="font-semibold text-gray-800 truncate">{player?.name || 'Player'} {player.socketId===room?.sktId?"(You)":null}</span>
                      </div>
                      <span className={`text-xs font-bold ${hasGuessed ? 'text-green-700' : 'text-green-600'}`}>{player?.score}</span>
                    </div>
                  </div>
                  )
                })
              ) : (
                <div className="text-center text-gray-500 text-xs mt-4">
                  <p>No players</p>
                </div>
              )}
              <div ref={playerEndRefMobile}/>
            </div>
          </div>

          {/* Messages Display (Mobile - Right 50%) */}
          <div className="w-1/2 bg-white flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-3">
              <h2 className="text-sm font-bold">Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
              {room?.messages?.length > 0 ? (
                room?.messages?.map((msg, index) => {
                  const isGuessMsg = msg?.message?.trim()?.toLowerCase()?.endsWith("has guessed")
                  const isJoinMsg = msg?.type === 'system' && msg?.systemType === 'join'
                  const isExitMsg = msg?.type === 'system' && msg?.systemType === 'exit'
                  return (
                  <div key={index} className={`mb-1 p-1 rounded border text-xs ${isJoinMsg ? 'bg-yellow-100 border-yellow-300' : isExitMsg ? 'bg-red-100 border-red-300' : isGuessMsg ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200'}`}>
                    {isJoinMsg || isExitMsg ? (
                      <span className={`block text-center font-semibold ${isJoinMsg ? 'text-yellow-800' : 'text-red-800'}`}>{msg.message}</span>
                    ) : (
                      <>
                        <span className={`font-semibold ${isGuessMsg ? 'text-green-700' : 'text-blue-600'}`}>{msg.socketId===room?.sktId?"You":msg.name}: </span>
                        <span className={isGuessMsg ? 'font-semibold text-green-800' : 'text-gray-800'}>{msg.message}</span>
                      </>
                    )}
                  </div>
                  )
                })
              ) : (
                <div className="text-center text-gray-400 text-xs mt-4">
                  <p>No messages</p>
                </div>
              )}
              <div ref={messagesEndRefMobile} />
            </div>
          </div>
        </div>

        {/* Mobile Message Input (10vh) */}
        <div className="md:hidden h-[10vh] w-full bg-white border-t-4 border-gray-300 p-2 flex items-center">
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your guess..."
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (message.trim()) {
                    sendMessages(room?.roomId,message)
                    setMessage('')
                  }
                }
              }}
            />
            <button
              onClick={() => {
                if (message.trim()) {
                  sendMessages(room?.roomId,message)
                  setMessage('')
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-md text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {room?.displayScore && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3">
          <Score notGuessedPlayers={room?.notGuessedPlayers} guessedPlayers={room?.guessedPlayers || []} correctWord={correctWord} />
        </div>
      )}

      {room?.displayFinalScore && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3">
          <FinalScoreCard players={room?.players || []} />
        </div>
      )}
    </div>
  )
}

export default PlayGround
