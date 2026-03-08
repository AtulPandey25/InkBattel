import React from 'react'

const Avatar = ({colourr,eyee,smilee}) => {
  return (
    <div className="flex  flex-col justify-center items-center">
      <div className={`w-15 h-15 ${colourr} border-4 border-black rounded-[50%] `}>
            <div className="flex flex-col justify-center items-center">
              <div className="flex justify-center items-center gap-4 mt-3">
                <div className={`${eyee}`}></div>
                <div className={`${eyee}`}></div>
              </div>
              <div className={`${smilee}`}></div>
            </div>
          </div>
          <div className={`w-20 h-12 ${colourr} border-4 border-black rounded-t-full `}></div>
    </div>
  )
}

export default Avatar
