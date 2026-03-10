import React from 'react'

const Score = ({ guessedPlayers = [], correctWord = '' }) => {
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
      <div className="bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Turn Result</p>
        <h2 className="mt-1 text-xl font-black md:text-2xl">
          Correct word was <span className="underline decoration-cyan-200">{correctWord || '---'}</span>
        </h2>
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-4 py-3 md:px-5">
        <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <span>Name</span>
          <span>Score</span>
        </div>

        {guessedPlayers.length === 0 ? (
          <p className="py-6 text-center text-sm font-semibold text-slate-500">No players guessed this turn.</p>
        ) : (
          guessedPlayers.map((player, index) => (
            <div
              key={player?.socketId || `${player?.name || 'player'}-${index}`}
              className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            >
              <span className="truncate pr-3 text-sm font-semibold text-slate-800">{player?.name || 'Player'}</span>
              <span className="shrink-0 rounded-lg bg-slate-900 px-3 py-1 text-sm font-extrabold text-cyan-300">
                {player?.score ?? 0}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Score
