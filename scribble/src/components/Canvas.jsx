import React, { useCallback, useLayoutEffect,useState,useRef,useEffect} from 'react'
import WordGuess from "../components/WordGuess.jsx"
import Start from '../components/Start'
import {useRoom} from '../store/roomStore'
import {startOnBoard,drawOnBoard,stopOnBoard} from "../services/board.socket.services.js"
import socket from "../utilities/socket.js"
const Canvass = () => {
const canvaRef=useRef(null)
const [pencilStrok,setPencilStrok]=useState(3)
const [eraserStrok,setEraserStrok]=useState(30)
const [clr,setClr]=useState("black")
const [pencilClr,setPencilClr]=useState("black")
const [isDrawing,setIsDrawing]=useState(false)
const [tool,setTool]=useState("pencil")
const [showPencilStroke,setShowPencilStroke]=useState(false)
const [showEraserStroke,setShowEraserStroke]=useState(false)
const localDrawingRef = useRef(false)
const remoteDrawingRef = useRef(false)

const room=useRoom()
const isHost = room?.hostId === room?.sktId
const isDrawer = room?.drawerId === room?.sktId
const canDraw = room?.isPlaying && !room?.isChoosing && isDrawer
const showCanvasBoard = room?.isPlaying && !room?.isChoosing
const currentDrawer = room?.players?.find((player) => player.socketId === room?.drawerId)
const drawerName = currentDrawer?.name || 'A player'



useLayoutEffect(() => {
  if (!showCanvasBoard) return;

  const canvas = canvaRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const snapshotCtx = snapshot.getContext('2d');
    if (canvas.width > 0 && canvas.height > 0) {
      snapshotCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#111827';
    ctx.globalAlpha = 1;

    if (snapshot.width > 0 && snapshot.height > 0) {
      ctx.drawImage(snapshot, 0, 0, snapshot.width / dpr, snapshot.height / dpr);
    }
  }

  const frameId = window.requestAnimationFrame(resize);
  window.addEventListener('resize', resize);
  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => resize())
    : null;

  resizeObserver?.observe(canvas);
  if (canvas.parentElement) {
    resizeObserver?.observe(canvas.parentElement);
  }

  return () => {
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    resizeObserver?.disconnect();
  };
}, [showCanvasBoard]);

const getPosFromEvent = (nativeEvent) => {
  const rect = canvaRef.current.getBoundingClientRect();
  return { x: nativeEvent.clientX - rect.left, y: nativeEvent.clientY - rect.top };
};

const getRatioFromPoint = (x, y) => {
  const rect = canvaRef.current?.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) {
    return { xRatio: 0, yRatio: 0 };
  }

  return {
    xRatio: x / rect.width,
    yRatio: y / rect.height,
  };
};

const getPointFromRatio = useCallback((xRatio, yRatio) => {
  const rect = canvaRef.current?.getBoundingClientRect();
  if (!rect) {
    return { x: 0, y: 0 };
  }

  return {
    x: xRatio * rect.width,
    y: yRatio * rect.height,
  };
}, []);

const stopDrawing = (e) => {
  const canvas = canvaRef.current;
  if (!canvas) return;

  if (e && e.nativeEvent && e.nativeEvent.pointerId !== undefined) {
    canvas.releasePointerCapture?.(e.nativeEvent.pointerId);
  }

  if (localDrawingRef.current) {
    stopOnBoard(room?.roomId)
  }

  localDrawingRef.current = false
  setIsDrawing(false);
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
}

const handleStopBoard = useCallback(() => {
  const canvas = canvaRef.current;
  if (!canvas) return;
  remoteDrawingRef.current = false
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
}, []);

const handleStartBoard = useCallback(({xRatio,yRatio}) => {
  const canvas = canvaRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { x, y } = getPointFromRatio(xRatio, yRatio);
  remoteDrawingRef.current = true
  ctx.beginPath();
  ctx.moveTo(x, y);
}, [getPointFromRatio]);


const handleDrawBoard = useCallback(({xRatio,yRatio,tool,pencilStrokk,eraserStrokk,pencilClrr}) => {
  const canvas = canvaRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { x, y } = getPointFromRatio(xRatio, yRatio);

  // If start event arrives late/out-of-order, prevent connecting from stale path.
  if (!remoteDrawingRef.current) {
    remoteDrawingRef.current = true
    ctx.beginPath();
    ctx.moveTo(x, y);
    return;
  }

  ctx.lineWidth = tool==="pencil" ? pencilStrokk : eraserStrokk;
  tool==="pencil"?ctx.strokeStyle = pencilClrr:ctx.strokeStyle = "white";
  ctx.lineTo(x,y);
  ctx.stroke();
}, [getPointFromRatio]);

useEffect(()=>{
  socket.on("start-draw",handleStartBoard)
  socket.on("draw-draw",handleDrawBoard)
  socket.on("stop-draw",handleStopBoard)
  return ()=>{
    socket.off("start-draw",handleStartBoard)
    socket.off("draw-draw",handleDrawBoard)
    socket.off("stop-draw",handleStopBoard)
  }
},[handleDrawBoard, handleStartBoard, handleStopBoard])

const startDrawing = (e) => {
  const native = e.nativeEvent;
  const { x, y } = getPosFromEvent(native);
  const { xRatio, yRatio } = getRatioFromPoint(x, y);
  const canvas = canvaRef.current;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(x, y);
  localDrawingRef.current = true
  setIsDrawing(true);
  canvas.setPointerCapture?.(native.pointerId);
  native.preventDefault();
  startOnBoard(xRatio,yRatio,room?.roomId)
};

const draw = (e) => {
  if (!isDrawing) return;
  if (e.nativeEvent.buttons !== 1) { stopDrawing(e); return; }
  const native = e.nativeEvent;
  const { x, y } = getPosFromEvent(native);
  const { xRatio, yRatio } = getRatioFromPoint(x, y);
  const ctx = canvaRef.current.getContext('2d');
  ctx.lineWidth = tool==="pencil" ? pencilStrok : eraserStrok;
  tool==="pencil"?ctx.strokeStyle = pencilClr:ctx.strokeStyle = "white";
  ctx.lineTo(x, y);
  ctx.stroke();
  drawOnBoard(xRatio,yRatio,tool,room?.roomId,pencilStrok,eraserStrok,pencilClr)
};

const handleEraser=()=>{
  setTool("eraser")
  setClr("white")
}

const handlePencil=()=>{
  setTool("pencil")
  setClr(pencilClr)
}


const renderStatusCard = (title, subtitle) => (
  <div className="flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border-4 border-gray-300 bg-white px-8 py-12 text-center shadow-xl">
    <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Scribble</p>
    <h2 className="mt-4 text-3xl font-black text-gray-800 md:text-4xl">{title}</h2>
    <p className="mt-3 text-base font-semibold text-gray-600 md:text-lg">{subtitle}</p>
  </div>
)


  return (
    <div className="h-full w-full">
      <div className="w-full h-full flex items-center justify-center" style={{ maxWidth: '100%', maxHeight: '100%' }}>
        {!room?.isPlaying
          ? (isHost
              ? <Start/>
              : renderStatusCard('Wait', 'Waiting for the host to start the game'))
          : room?.isChoosing
            ? (isDrawer
                ? <WordGuess/>
                : renderStatusCard('Get Ready', `${drawerName} is choosing the word`))
            : <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-full max-w-[900px] h-[600px] rounded-2xl border-4 border-gray-300 bg-white shadow-xl overflow-hidden">
                  <canvas ref={canvaRef} onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} onMouseLeave={stopDrawing} className="w-full h-full bg-white" />
                </div>

                <div className="w-full max-w-[900px] rounded-2xl border-4 border-gray-300 bg-white p-3 shadow-lg">
                  <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                    {/* Pencil + stroke dropdown */}
                    <div className="relative flex">
                      <button
                        type="button"
                        onClick={() => handlePencil()}
                        className={`flex items-center gap-2 rounded-l-xl border-2 border-r-0 px-3 py-2 font-bold transition-colors ${tool === "pencil" ? "border-blue-600 bg-blue-100 text-blue-800" : "border-gray-300 bg-gray-50 text-gray-700"}`}
                      >
                        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        <span>Pencil</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowPencilStroke(!showPencilStroke); setShowEraserStroke(false); }}
                        className={`flex items-center justify-center rounded-r-xl border-2 border-l px-2 py-2 transition-colors ${tool === "pencil" ? "border-blue-600 border-l-blue-300 bg-blue-100 text-blue-800" : "border-gray-300 border-l-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                        title="Pencil stroke width"
                      >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      {showPencilStroke && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border-2 border-gray-300 rounded-xl shadow-lg z-20 min-w-[100px]">
                          {[
                            { value: 2, label: 'Thin' },
                            { value: 4, label: 'Medium' },
                            { value: 6, label: 'Bold' },
                            { value: 10, label: 'Heavy' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => { setPencilStrok(option.value); setShowPencilStroke(false); }}
                              className={`block w-full px-4 py-2 text-left text-sm font-semibold transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                pencilStrok === option.value ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Eraser + stroke dropdown */}
                    <div className="relative flex">
                      <button
                        type="button"
                        onClick={() => handleEraser()}
                        className={`flex items-center gap-2 rounded-l-xl border-2 border-r-0 px-3 py-2 font-bold transition-colors ${tool === "eraser" ? "border-red-600 bg-red-100 text-red-800" : "border-gray-300 bg-gray-50 text-gray-700"}`}
                      >
                        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m7 21 10-10" />
                          <path d="M5 11 13 3a2.8 2.8 0 0 1 4 0l4 4a2.8 2.8 0 0 1 0 4l-8 8" />
                          <path d="M16 21H7" />
                        </svg>
                        <span>Eraser</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowEraserStroke(!showEraserStroke); setShowPencilStroke(false); }}
                        className={`flex items-center justify-center rounded-r-xl border-2 border-l px-2 py-2 transition-colors ${tool === "eraser" ? "border-red-600 border-l-red-300 bg-red-100 text-red-800" : "border-gray-300 border-l-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                        title="Eraser stroke width"
                      >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      {showEraserStroke && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border-2 border-gray-300 rounded-xl shadow-lg z-20 min-w-[100px]">
                          {[
                            { value: 6, label: 'Small' },
                            { value: 20, label: 'Medium' },
                            { value: 30, label: 'Large' },
                            { value: 40, label: 'XLarge' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => { setEraserStrok(option.value); setShowEraserStroke(false); }}
                              className={`block w-full px-4 py-2 text-left text-sm font-semibold transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                eraserStrok === option.value ? 'bg-red-100 text-red-800' : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-700">
                      <span>Color</span>
                      <input
                        type="color"
                        value={pencilClr === "#ffffff" ? "#111827" : clr}
                        onChange={(e) => setPencilClr(e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border border-gray-300 bg-white"
                      />
                    </label>

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-100 px-3 py-2 font-bold text-emerald-800 transition-colors hover:bg-emerald-200"
                    >
                      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                      <span>Add</span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-xl border-2 border-gray-500 bg-gray-100 px-3 py-2 font-bold text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>}
              
      </div>
    </div>
  )
}

export default Canvass
