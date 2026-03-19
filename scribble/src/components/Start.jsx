import React, { useState } from 'react';
import {useRoom} from "../store/roomStore.jsx"
import toast from "react-hot-toast"
import {gameBegin} from "../services/socket.services.js"

const Start = () => {
    const room=useRoom()
    const [isStarting, setIsStarting] = useState(false)

    const invitePlayers = async (roomId) => {
      if(!roomId){
        toast.error("Room not found")
        return
      }

      const inviteLink = `${window.location.origin}/join/${roomId}`
      try{
        await navigator.clipboard.writeText(inviteLink)
        toast.success("Invite link copied")
      }catch(error){
        console.log(error)
        toast.error("Failed to copy invite link")
      }
    }

    const startGame=(roomId)=>{
      if (isStarting) return
      if(!roomId){
        toast.error("Room not found")
        return
      }
      if(room?.players.length<2){
        toast.error("At least 2 members are required")
        return
      }
        try{
            setIsStarting(true)
            room?.setIsPlaying(true)
            toast.success("Game Started")
            gameBegin(roomId)
        }catch(error){
            room?.setIsPlaying(false)
            setIsStarting(false)
            toast.error("Failed to Start game")
        }
    }

  return (
    <div className="w-full min-h-30 flex items-center justify-center px-4">
      <div className="flex w-full max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
      <button
      onClick={() => startGame(room?.roomId)}
        disabled={isStarting}
        type="button"
        className="font-bold px-8 py-3 rounded-xl border-2 transition-all duration-200 mobile-start-btn"
        style={{
          background: '#22c55e',
          color: '#13281b',
          fontFamily: 'Gochi Hand, cursive',
          fontSize: '1.2rem',
          borderColor: '#15803d',
          boxShadow: '0 6px 14px rgba(21, 128, 61, 0.22)',
          opacity: isStarting ? 0.7 : 1,
          cursor: isStarting ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 10px 18px rgba(21, 128, 61, 0.28)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 14px rgba(21, 128, 61, 0.22)';
        }}
      >
        {isStarting ? 'Starting...' : 'Start Game'}
      </button>

      <button
        onClick={() => invitePlayers(room?.roomId)}
        type="button"
        className="font-bold px-8 py-3 rounded-xl border-2 transition-all duration-200 inline-flex items-center justify-center gap-2 w-41"
        style={{
          background: '#3b82f6',
          color: '#eff6ff',
          fontFamily: 'Gochi Hand, cursive',
          fontSize: '1.2rem',
          borderColor: '#1d4ed8',
          boxShadow: '0 6px 14px rgba(29, 78, 216, 0.25)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 10px 18px rgba(29, 78, 216, 0.32)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 14px rgba(29, 78, 216, 0.25)';
        }}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M15 19a4 4 0 0 0-8 0" stroke="#eff6ff" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="11" cy="8" r="3" stroke="#eff6ff" strokeWidth="2"/>
          <path d="M19 8v6" stroke="#eff6ff" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 11h6" stroke="#eff6ff" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Invite</span>
      </button>
      </div>
    </div>
  );
};

export default Start;
