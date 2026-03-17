import React from 'react'

const Player = ({colourr,eyee,smilee}) => {
  return (
    <div className="flex flex-col items-center justify-center leading-none">
      <div className={`h-8 w-8 ${colourr} rounded-full border-2 border-black`}>
        <div className="flex flex-col items-center justify-center">
          <div className="mt-1.5 -mb-2 flex items-center justify-center gap-1">
            <div className={`scale-75 ${eyee}`}></div>
            <div className={`scale-75 ${eyee}`}></div>
          </div>
          <div className={`scale-75 ${smilee}`}></div>
        </div>
      </div>
      <div className={`h-5 w-9 ${colourr} rounded-t-full border-2 border-black`}></div>
    </div>
  )
}
export default Player



