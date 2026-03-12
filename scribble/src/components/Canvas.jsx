import React, { useLayoutEffect,useState,useRef } from 'react'
import WordGuess from "../components/WordGuess.jsx"
import Start from '../components/Start'
import Score from '../components/Score'
import {useRoom} from '../store/roomStore'
const Canvass = () => {
const canvaRef=useRef(null)
const [strok,setStrok]=useState(3)
const [clr,setClr]=useState("black")
const [isDrawing,setIsDrawing]=useState(false)

useLayoutEffect(() => {
  const canvas = canvaRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = strok;
    ctx.strokeStyle = clr;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize);
  return () => window.removeEventListener('resize', resize);
}, [strok, clr]);

const getPosFromEvent = (nativeEvent) => {
  const rect = canvaRef.current.getBoundingClientRect();
  return { x: nativeEvent.clientX - rect.left, y: nativeEvent.clientY - rect.top };
};

const startDrawing = (e) => {
  const native = e.nativeEvent;
  const { x, y } = getPosFromEvent(native);
  const canvas = canvaRef.current;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(x, y);
  setIsDrawing(true);
  canvas.setPointerCapture?.(native.pointerId);
  native.preventDefault();
};

const draw = (e) => {
  if (!isDrawing) return;
  const native = e.nativeEvent;
  const { x, y } = getPosFromEvent(native);
  const ctx = canvaRef.current.getContext('2d');
  ctx.lineWidth = strok;
  ctx.strokeStyle = clr;
  ctx.lineTo(x, y);
  ctx.stroke();
};

const stopDrawing = (e) => {
  const canvas = canvaRef.current;
  if (e && e.nativeEvent && e.nativeEvent.pointerId !== undefined) {
    canvas.releasePointerCapture?.(e.nativeEvent.pointerId);
  }
  setIsDrawing(false);
  const ctx = canvas.getContext('2d');
  ctx.closePath();
}


const room=useRoom()
const isHost = room?.hostId === room?.sktId
const isDrawer = room?.drawerId === room?.sktId
const currentDrawer = room?.players?.find((player) => player.socketId === room?.drawerId)
const drawerName = currentDrawer?.name || 'A player'

const renderStatusCard = (title, subtitle) => (
  <div className="flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border-4 border-gray-300 bg-white px-8 py-12 text-center shadow-xl">
    <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Scribble</p>
    <h2 className="mt-4 text-3xl font-black text-gray-800 md:text-4xl">{title}</h2>
    <p className="mt-3 text-base font-semibold text-gray-600 md:text-lg">{subtitle}</p>
  </div>
)

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ maxWidth: '100%', maxHeight: '100%' }}>
      {!room?.isPlaying
        ? (isHost
            ? <Start/>
            : renderStatusCard('Wait', 'Waiting for the host to start the game'))
        : room?.isChoosing
          ? (isDrawer
              ? <WordGuess/>
              : renderStatusCard('Get Ready', `${drawerName} is choosing the word`))
          : <canvas ref={canvaRef} onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} className="w-full h-full bg-white" style={{ maxWidth: '900px', maxHeight: '600px' }}></canvas>}
    </div>
  )
}

export default Canvass
