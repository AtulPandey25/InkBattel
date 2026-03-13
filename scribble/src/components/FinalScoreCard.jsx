import React from 'react'
import Avatar from './Avatar'
import { useRoom } from '../store/roomStore'
import { useNavigate } from 'react-router-dom'
import { exitRoom } from '../services/socket.services'

const FinalScoreCard = ({ players = [] }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const top3 = sortedPlayers.slice(0, 3)
  const remaining = sortedPlayers.slice(3)
  const room = useRoom()
  const navigate = useNavigate()

  const handleExit = () => {
    if (room.roomId) {
      exitRoom(room.roomId)
    }
    navigate("/")
    room?.setDisplayFinalScore(false)
  }

  return (
    <div className="paper-card w-full" style={{ maxWidth: '800px', margin: 0, paddingTop: '28px' }}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-black">Game Over!</h2>
        <p className="mt-2 text-lg font-semibold text-black/70">Final Scores</p>
      </div>

      {/* Podium Section */}
      <div className="mb-8">
        {/* Winner (1st Place) - Centered at top */}
        {top3[0] && (
          <div className="mb-6 flex flex-col items-center">
            <div className="relative mb-3">
              {/* Crown for 1st place */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl">👑</div>
              
              <div className="flex flex-col items-center">
                <Avatar 
                  colourr={top3[0].colour} 
                  eyee={top3[0].eyes} 
                  smilee={top3[0].smile}
                />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-black text-yellow-600">1st Place</p>
              <p className="mt-1 text-xl font-bold text-black">{top3[0].name}</p>
              <p className="mt-0.5 text-lg font-extrabold text-black">{top3[0].score} pts</p>
            </div>
          </div>
        )}

        {/* 2nd and 3rd Place - Side by side */}
        <div className="mt-8 flex items-center justify-center gap-8">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex flex-col items-center">
                <Avatar 
                  colourr={top3[1].colour} 
                  eyee={top3[1].eyes} 
                  smilee={top3[1].smile}
                />
              </div>
              
              <div className="text-center">
                <p className="text-lg font-bold text-gray-500">2nd Place</p>
                <p className="mt-0.5 text-sm font-bold text-black">{top3[1].name}</p>
                <p className="text-sm font-semibold text-black">{top3[1].score} pts</p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex flex-col items-center">
                <Avatar 
                  colourr={top3[2].colour} 
                  eyee={top3[2].eyes} 
                  smilee={top3[2].smile}
                />
              </div>
              
              <div className="text-center">
                <p className="text-lg font-bold text-orange-600">3rd Place</p>
                <p className="mt-0.5 text-sm font-bold text-black">{top3[2].name}</p>
                <p className="text-sm font-semibold text-black">{top3[2].score} pts</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Remaining Players - Linear List */}
      {remaining.length > 0 && (
        <div className="mt-8 border-t-2 border-black pt-4">
          <p className="mb-3 text-center text-sm font-bold text-black/70">Other Players</p>
          <div className="mx-auto max-w-md space-y-2">
            {remaining.map((player, index) => (
              <div
                key={player.socketId}
                className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-black/70">#{index + 4}</span>
                  <span className="font-bold text-black">{player.name}</span>
                </div>
                <span className="rounded-md bg-blue-600 px-2 py-1 text-sm font-bold text-white">
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 border-t-2 border-black pt-4 flex gap-4 justify-center">
        <button
          onClick={handleExit}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
        >
          Exit
        </button>
        <button
          onClick={() => {
            // Replay logic will be implemented by user
          }}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
        >
          Replay
        </button>
      </div>
    </div>
  )
}

export default FinalScoreCard
