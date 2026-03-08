import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { createRooom } from '../features/userDetail';
import { Link, useNavigate} from 'react-router-dom';
import socket from '../utilities/socket';
import { useRoom } from '../store/roomStore';
import {createRoom} from "../services/socket.services.js"
import toast from "react-hot-toast"

const CreateRoom = () => {
  const [numPlayers, setNumPlayers] = useState(10);
  const [numRounds, setNumRounds] = useState(3);
  const [hints, setHints] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [drawTime, setDrawTime] = useState(80);
  const [wordCount, setWordCount] = useState(1);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const playerDetail = useSelector((state) => state?.avatarUser);
  const room = useRoom();


  useEffect(()=>{
    socket.on("room-created",({roomId,rooom,playerDetail,socketId})=>{
      room?.setPlayers(rooom.players)
      console.log(rooom.players)
      room?.setRoomId(roomId)
      // Set socket ID to YOUR OWN socket ID from socket.io client
      room?.setSktId(socket.id)
      console.log(roomId)
      navigate("/ground")
    })

  })
  const createRoomm = async (playerDetail) => {
    try {
      if(roomName.trim()==""){
        return toast.error("Please Enter the Room Name")
      }
      const roomSettings = {
        roomName,
        settings: {
          hints,
          numRounds,
          numPlayers,
          drawTime,
          wordCount,
        }
      };
      await createRoom(roomSettings, playerDetail);
       console.log("crwe")
    } catch(error) {
      console.log(error);
    }
  }


  return (
    <div className="w-screen min-h-screen flex flex-col" style={{ minHeight: '100vh' }}>

      <div className="w-screen flex flex-col items-center">
        <h1 className="create-room-heading" style={{ fontSize: '2rem', marginTop: '24px', marginBottom: '8px', color: '#333' }}>Create Room</h1>
        <div className="create-room-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <form className="paper-card create-room-card scrollable-form mobile-form">
          <div className="flex flex-col items-start">
            <label className="font-semibold mb-1">Room Name:</label>
            <input
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="border px-2 py-1 rounded w-full min-w-45"
              placeholder="Enter room name"
            />
          </div>
          <div className="flex flex-col items-start">
            <label className="font-semibold mb-1">Number of Players:</label>
            <select value={numPlayers} onChange={e => setNumPlayers(Number(e.target.value))} className="border px-2 py-1 rounded w-full min-w-45">
              {Array.from({ length: 19 }, (_, i) => i + 2).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-start">
            <label className="font-semibold mb-1">Number of Rounds:</label>
            <select value={numRounds} onChange={e => setNumRounds(Number(e.target.value))} className="border px-2 py-1 rounded w-full min-w-45">
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-start">
            <label className="font-semibold mb-1">Hints:</label>
            <select value={hints} onChange={e => setHints(Number(e.target.value))} className="border px-2 py-1 rounded w-full min-w-45">
              {[1, 2, 3].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-start">
            <label className="font-semibold mb-1">Draw Time (seconds):</label>
            <select value={drawTime} onChange={e => setDrawTime(Number(e.target.value))} className="border px-2 py-1 rounded w-full min-w-45">
              {[60,80,100,120,140,160,180,200,220,240].map(n => (
                <option key={n} value={n}>{n} s</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-start">
            <label className="font-semibold mb-1">Word Count:</label>
            <select value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="border px-2 py-1 rounded w-full min-w-45">
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </form>
        <div className="absolute left-0 bottom-0 w-full flex flex-row items-center mobile-bottom-btns" style={{height: '70px', gap: 0, padding: 0}}>
          <button
            onClick={()=>createRoomm(playerDetail)}
            className="pop-btn font-bold h-full mobile-create-btn"
            style={{ width: '65%', background: '#22c55e', color: '#222', fontFamily: 'Gochi Hand, cursive', fontSize: '1.15rem', borderColor: '#16a34a', borderWidth: 3, borderStyle: 'solid', borderRadius: '8px 0 0 0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', margin: 0, padding: 0 }}
          >
            Create Room
          </button>
          <button
          onClick={()=>dispatch(createRooom(false))}
            className="pop-btn font-bold h-full mobile-home-btn"
            style={{ width: '35%', background: '#ef4444', color: '#fff', fontFamily: 'Gochi Hand, cursive', fontSize: '1.05rem', borderColor: '#b91c1c', borderWidth: 3, borderStyle: 'solid', borderRadius: '0 0 8px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', margin: 0, padding: 0 }}
          >
            Home
          </button>
        </div>
      </div>
      {/* All mobile and button styles are now in index.css for global control. */}
    </div>
    </div>
  );
}

export default CreateRoom