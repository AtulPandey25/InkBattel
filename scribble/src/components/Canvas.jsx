import React, { useLayoutEffect,useState,useRef } from 'react'
import WordGuess from "../components/WordGuess.jsx"

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


const choose=true;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ maxWidth: '100%', maxHeight: '100%' }}>
      {choose?<WordGuess/>:<canvas ref={canvaRef} onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} className="w-full h-full bg-white" style={{ maxWidth: '900px', maxHeight: '600px' }}></canvas>}
    </div>
  )
}

export default Canvass
