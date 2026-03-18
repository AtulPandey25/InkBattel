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
// import {getScribbleWord} from "../utilities/scribbleWord.js"
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
  const playersListRefDesktop = useRef(null)
  const playersListRefMobile = useRef(null)
  const [time,setTime]=useState(3)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isGuessInputFocused, setIsGuessInputFocused] = useState(false)
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
      // room?.setDrawWord(isDrawing ? rooom.guessWord : "")
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
      room?.setDrawWord("")

      setIsGameOn(false)
    }

    const handleGuessWord = ({word})=>{
      if (chooseFallbackRef.current) {
        clearTimeout(chooseFallbackRef.current)
        chooseFallbackRef.current = null
      }
      room?.setDrawWord(word || "")
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


    const handleHints=({ hintIndex, hintWord })=>{
      const currentRoom = useRoom.getState()
      if (typeof hintIndex !== "number" || hintIndex < 0) {
        return
      }

      currentRoom.addRevealedHintIndex(hintIndex)
      currentRoom.incrementHintsShown()

      const isDrawer = currentRoom.sktId === currentRoom.drawerId
      if(!isDrawer && !currentRoom.guessed && !currentRoom.displayScore){
        currentRoom.setDrawWord(hintWord || currentRoom.drawWord)
      }
    }

    const handleNoPlayerLeft=({roomId})=>{
      toast.error(`Everyone Left Closing room in ${time} seconds`)
      setTimeout(() => {
        dispatch(createRooom(false))
        navigate("/")
      }, 3000);
    }

    const handleReplay=({roomId,rooom,playerDetail,socketId})=>{
      if(room?.sktId===socketId) room?.setDisplayFinalScore(false)
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
    socket.on("replayed",handleReplay)
    
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
      socket.off("replayed",handleReplay)

    }
  },[])

  useEffect(() => {
    messagesEndRefDesktop.current?.scrollIntoView({ behavior: 'smooth' })
    messagesEndRefMobile.current?.scrollIntoView({ behavior: 'smooth' })
  }, [room?.messages])

  useEffect(()=>{
    if (playersListRefDesktop.current) {
      playersListRefDesktop.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    if (playersListRefMobile.current) {
      playersListRefMobile.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
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

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyOverscroll = document.body.style.overscrollBehavior

    // Keep the game layout fixed while mobile keyboards open/close.
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.overscrollBehavior = previousBodyOverscroll
    }
  }, [])

  useEffect(() => {
    const visualViewport = window.visualViewport
    if (!visualViewport) return

    const updateKeyboardState = () => {
      const keyboardThreshold = 120
      const keyboardHeight = window.innerHeight - visualViewport.height
      setIsKeyboardVisible(keyboardHeight > keyboardThreshold)
    }

    updateKeyboardState()
    visualViewport.addEventListener('resize', updateKeyboardState)

    return () => {
      visualViewport.removeEventListener('resize', updateKeyboardState)
    }
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

const sendMessages=async (roomId,message)=>{
  try {
    if(message.trim()==="") return
    const {res}=await verifyGuess({roomId,message})
    if(res){
      if(room?.sktId===room?.drawerId) {
        if(isSoundOn && isGameOn && !room?.isChoosing){
          const audio=new Audio("../../sounds/faa.mp3")
          audio.play()
        }
        return toast.error("You are not elligible")
      }
      if(!room?.guessed){
        toast.success("You guessed It right !!!")
        room?.setDrawWord(message.toLowerCase())
        room?.setGuessed(true)
        const score = decideScore();
        updateScore(roomId,score,room?.drawerId)
        sendMessage(roomId,`${room?.myDetail.name} has guessed`)
      }
      return
    }
    if(isSoundOn && isGameOn && !room?.isChoosing){
      const audio=new Audio("../../sounds/faa.mp3")
      audio.play()
    }
    sendMessage(roomId,message)
  } catch (error) {
    console.log(error)
    toast.error("Failed to send message")
  }
}


const isDrawer = room?.drawerId === room?.sktId
const hasSelectedWord = room?.drawWord?.trim() !== ""
const shouldHideMobilePanels = isKeyboardVisible || isGuessInputFocused
const navbarWord =()=>{
  if(!hasSelectedWord ){
    return "Waiting"
  }
  if(isDrawer || room?.guessed || room?.displayScore){
    return room?.drawWord
  }
  return room?.drawWord
}



  return (
    <div className="fixed inset-0 w-screen h-dvh bg-gray-100 flex flex-col overflow-hidden overscroll-none">
      {/* Top Navbar */}
      <div className="w-full h-14 sm:h-16 md:h-20 bg-white border-b-4 border-gray-300 flex items-center justify-between px-2 sm:px-3 md:px-6 gap-2 shadow-md">
        {/* Left: Clock and Round */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-base sm:text-lg md:text-2xl font-bold text-gray-800">{room?.timer}s</span>
          </div>
          <div className="text-xs sm:text-sm md:text-lg font-semibold text-gray-700 whitespace-nowrap">
            Round {room?.round}/{room?.roomDetail?.settings?.numRounds}
          </div>
        </div>

        {/* Middle: Word Display */}
        <div className="flex-1 flex justify-center min-w-0 px-1 sm:px-2">
          <div className="bg-gray-200 px-2 sm:px-4 md:px-8 py-1.5 sm:py-2 md:py-3 rounded-lg border-2 border-gray-400 max-w-full">
            <span className="block text-sm sm:text-lg md:text-2xl font-bold tracking-wide sm:tracking-widest text-gray-800 truncate">{navbarWord()}</span>
          </div>
        </div>

        {/* Right: Share Icon */}
        <div className="flex items-center shrink-0">
          <button onClick={()=>copyLink(room?.roomId)} className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
        <div className="relative flex items-center" ref={settingsRef}>
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {showSettings && (
            <div className="absolute right-0 top-10 sm:top-12 md:top-14 z-30 w-44 sm:w-52 rounded-xl border-2 border-gray-300 bg-white p-2 sm:p-3 shadow-xl">
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
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        {/* Left Sidebar - Players List (Desktop) */}
        <div className="hidden xl:flex w-64 bg-white border-r-4 border-gray-300 flex-col shadow-lg flex-shrink-0">
          {/* Players Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4">
            <h2 className="text-xl font-bold">Players</h2>
          </div>
          <div ref={playersListRefDesktop} className="flex-1 overflow-y-auto p-3">
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
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="xl:h-auto flex-1 min-h-0 flex items-center justify-center bg-gray-100 p-2 xl:p-4 min-w-0 overflow-hidden">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-300 w-full h-full max-w-5xl max-h-full flex items-center justify-center">
            <Canvass key={room?.drawerId}/>
          </div>
        </div>

        {/* Right Sidebar - Chat (Desktop) */}
        <div className="hidden xl:flex w-80 bg-white border-l-4 border-gray-300 flex-col shadow-lg flex-shrink-0">
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
        <div
          className="xl:hidden flex w-full border-t-4 border-gray-300 shrink-0 grow-0 overflow-hidden"
          style={{ height: '20dvh', minHeight: '20dvh', maxHeight: '20dvh' }}
        >
          {shouldHideMobilePanels ? (
            <div className="w-full h-full bg-transparent" aria-hidden="true" />
          ) : (
            <>
          {/* Players List (Mobile - Left 50%) */}
          <div className="w-1/2 bg-white border-r-2 border-gray-300 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3">
              <h2 className="text-sm font-bold">Players</h2>
            </div>
            <div ref={playersListRefMobile} className="flex-1 overflow-y-auto p-2">
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
                        <div><Player colourr={player?.colour} eyee={player?.eyes} smilee={player?.smile} /></div>
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
              </>
            )}
        </div>

        {/* Mobile Message Input (10vh) */}
        <div
          className="xl:hidden w-full bg-white border-t-4 border-gray-300 p-2 flex items-center shrink-0 grow-0 overflow-hidden"
          style={{ height: '10dvh', minHeight: '10dvh', maxHeight: '10dvh' }}
        >
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setIsGuessInputFocused(true)}
              onBlur={() => setIsGuessInputFocused(false)}
              placeholder="Type your guess..."
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-base"
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
