import React, { useState,useEffect, useRef } from 'react'
import Canvass from '../components/Canvas'
import Start from '../components/Start'
import {useRoom} from '../store/roomStore'
import socket from "../utilities/socket"
import {exitRoom} from "../services/socket.services.js"
import {sendMessage,updateScore,verifyGuess} from "../services/socket.services.js"
import toast from "react-hot-toast"
import {useNavigate} from "react-router-dom"
import { useDispatch } from 'react-redux'
import { createRooom } from '../features/userDetail'
import Avatar from "../components/Avatar.jsx"
import {getScribbleWord} from "../utilities/scribbleWord.js"
import Score from '../components/Score.jsx'
const PlayGround = () => {
  const room = useRoom()
  const [message, setMessage] = useState('')
  const [correctWord, setCorrectWord] = useState('')
  const messagesEndRefDesktop = useRef(null)
  const messagesEndRefMobile = useRef(null)
  const playerEndRef = useRef(null)
  const playerEndRefMobile = useRef(null)

  const navigate=useNavigate()
  const dispatch = useDispatch()

   useEffect(() => {
    return () => {
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
    socket.on("player-exited",({roomId,rooom,socketId})=>{
      room.setPlayers(rooom.players)
    })

    socket.on("new-message",({roomId,meessage,socketId})=>{
      console.log("Reached")
      console.log(meessage)
      room?.setMessages(meessage)
    })

    socket.on("round-started",async ({roomId,players,drawerId,round,words,guessed,notGuessed})=>{
      room?.setDrawerId(drawerId)
      room?.setRound(round)
      room?.setWords(words)
      room?.setGuessedPlayers(guessed || [])
      room?.setNotGuessedPlayers(notGuessed || [])
      room?.setGuessed(false)
      room?.setDrawWord("")
      room?.setDisplayScore(false)
      if(drawerId===room?.sktId) room?.setIsChoosing(true)
    })

    socket.on("round-ended",({roomId,correctWord,guessed,notGuessed})=>{
      room?.setGuessedPlayers(guessed || [])
      setCorrectWord(correctWord || "")
      room?.setDisplayScore(true)
      room?.setNotGuessedPlayers(notGuessed || [])
      room?.setIsChoosing(false)
    })

    socket.on("guess-word",({roomId,rooom,word})=>{
      // if(room?.sktId===room?.drawerId) 
        room?.setDrawWord(word)
    })

    socket.on("update-time",({roomId,time})=>{
      if(time==0){
        room?.setGuessed(false)
        room?.setDrawWord("")
      }
      room?.setTimer(time)

    })

    socket.on("game-ended",({roomId})=>{
      dispatch(createRooom(false))
      room?.setMessages([])
      room?.setDisplayScore(false)
      room?.setIsChoosing(false)
      room?.setGuessed(false)
      room?.setDrawWord("")
      navigate("/")
    })
    socket.on("verified",({rooom,res})=>{
      room?.setVerify(res)
    })

    socket.on("score-updated",({roomId,rooom})=>{
      room?.setRoomDetail(rooom)
      room?.setPlayers(rooom.players)
    })

    return ()=>{
      socket.off("player-exited")
      socket.off("new-message")
      socket.off("round-started")
      socket.off("round-ended")
      socket.off("guess-word")
      socket.off("update-time")
      socket.off("game-ended")
      socket.off("verified")
      socket.off("score-updated")
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
    console.log(room?.drawWord)
    // await verifyGuess({roomId,message})
    if(message.trim()!="" && room?.drawWord===message){
      if(!room?.guessed)
        {toast.success("You guessed It right !!!")
        room?.setGuessed(true)
        const score = room?.timer*2;
        updateScore(roomId,score)
      }
    }
    else{
        sendMessage(roomId,message)
    }
  } catch (error) {
    console.log(error)
    toast.error("Failed to send message")
  }
}



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
            <span className="text-2xl font-bold tracking-widest text-gray-800">{!room?.guessed?getScribbleWord(room?.drawWord):room?.drawWord}</span>
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
        <div className="flex items-center">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
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
              room.players.map((player, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 mb-2 border-2 border-gray-200 hover:border-blue-400 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
                      {/* <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {player?.name?.charAt(0).toUpperCase() || 'P'}
                      </div> */}
                      <div><Avatar className="w-15 h-15" colourr={player?.colour} eyee={player?.eyes} smilee={player?.smile} /></div>
                      <span className="font-semibold text-gray-800">{player?.name || 'Player'}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{player?.score}</span>
                  </div>
                </div>
              ))
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
            <Canvass/>
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
              room?.messages?.map((msg, index) => (
                <div key={index} className="mb-2 p-2 bg-white rounded-lg border border-gray-200">
                  <span className="font-semibold text-blue-600">{msg.socketId===room?.sktId?"You":msg.name}: </span>
                  <span className="text-gray-800">{msg.message}</span>
                </div>
              ))
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
                room.players.map((player, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 mb-1 border border-gray-200 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-700">#{index + 1}</span>
                        {/* <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                          {player?.name?.charAt(0).toUpperCase() || 'P'}
                        </div> */}
                        <div><Avatar className="w-15 h-15" colourr={player?.colour} eyee={player?.eyes} smilee={player?.smile} /></div>
                        <span className="font-semibold text-gray-800 truncate">{player?.name || 'Player'}</span>
                      </div>
                      <span className="text-xs font-bold text-green-600">{player?.score}</span>
                    </div>
                  </div>
                ))
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
                room?.messages?.map((msg, index) => (
                  <div key={index} className="mb-1 p-1 bg-white rounded border border-gray-200 text-xs">
                    <span className="font-semibold text-blue-600">{msg.socketId===room?.sktId?"You":msg.name}: </span>
                    <span className="text-gray-800">{msg.message}</span>
                  </div>
                ))
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
    </div>
  )
}

export default PlayGround
