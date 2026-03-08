import React from 'react';
import {useRoom} from "../store/roomStore.jsx"
import toast from "react-hot-toast"
import {gameBegin} from "../services/socket.services.js"

const Start = () => {
    const room=useRoom()

    const startGame=(roomId)=>{
      if(!roomId){
        toast.error("Room not found")
        return
      }
        try{
            room?.setIsPlaying(true)
            toast.success("Game Started")
            gameBegin(roomId)
        }catch(error){
            room?.setIsPlaying(false)
            toast.error("Failed to Start game")
        }
    }

  return (
    <div className="w-full min-h-30 flex items-center justify-center px-4">
      <button
      onClick={() => startGame(room?.roomId)}
        type="button"
        className="font-bold px-8 py-3 rounded-xl border-2 transition-all duration-200"
        style={{
          background: '#22c55e',
          color: '#13281b',
          fontFamily: 'Gochi Hand, cursive',
          fontSize: '1.2rem',
          borderColor: '#15803d',
          boxShadow: '0 6px 14px rgba(21, 128, 61, 0.22)',
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
        Start Game
      </button>
    </div>
  );
};

export default Start;
