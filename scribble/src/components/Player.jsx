import React from 'react'

const Player = ({colourr,eyee,smilee}) => {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className={`w-10 h-10 ${colourr} border-4 border-black rounded-[50%] `}>
            <div className="flex flex-col justify-center items-center">
              <div className="flex justify-center items-center gap-2 mt-2 mb-[-9px]">
                <div className={`${eyee}`}></div>
                <div className={`${eyee}`}></div>
              </div>
              <div className={`${smilee}`}></div>
            </div>
          </div>
          <div className={`w-15 h-9 ${colourr} border-4 border-black rounded-t-full `}></div>
    </div>
  )
}
export default Player



