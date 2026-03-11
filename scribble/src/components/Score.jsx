import React from 'react'

const Score = ({ notGuessedPlayers=[],guessedPlayers = [], correctWord = '' }) => {
  return (
    <div className="paper-card word-guess-card w-full" style={{ maxWidth: '760px', margin: 0, paddingTop: '28px' }}>
      <div className="mb-3 text-center">
        <h2 className="mt-1 text-2xl font-black leading-tight text-black md:text-3xl">
          Correct word was <span className="text-green-600">{correctWord || '---'}</span>
        </h2>
        <p className="mt-1 text-sm font-semibold text-black/70">Round Scoreboard</p>
      </div>

      <div className="max-h-[52vh] overflow-y-auto pt-2">
        {guessedPlayers.length === 0 ? (
          <p className="py-6 text-center text-sm font-semibold text-black">No players guessed this turn.</p>
        ) : (
          <div className="mx-auto w-full max-w-md space-y-2">
            {guessedPlayers.map((player, index) => (
              <div
                key={player?.socketId || `${player?.name || 'player'}-${index}`}
                className="flex items-center justify-between rounded-md bg-white/70 px-2 py-1"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-sm font-bold text-black/70">#{index + 1}</span>
                  <span className="truncate text-lg font-extrabold text-black">{player?.name || 'Player'}</span>
                </div>
                <span className="shrink-0 rounded-md bg-green-600 px-2.5 py-0.5 text-sm font-extrabold text-white">
                  +{player?.scoreGained ?? player?.score ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
        {notGuessedPlayers.length === 0 ? (
          <p className="py-6 text-center text-sm font-semibold text-black">Everyone Guessed.</p>
        ) : (
          <div className="mx-auto w-full max-w-md space-y-2">
            {notGuessedPlayers.map((player, index) => (
              <div
                key={player?.socketId || `${player?.name || 'player'}-${index}`}
                className="flex items-center justify-between rounded-md bg-white/70 px-2 py-1"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-sm font-bold text-black/70">#{index + 1}</span>
                  <span className="truncate text-lg font-extrabold text-black">{player?.name || 'Player'}</span>
                </div>
                <span className="shrink-0 rounded-md bg-red-600 px-2.5 py-0.5 text-sm font-extrabold text-white">
                  {player?.scoreGained ?? player?.score ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Score
