import React from 'react'
import {Route,Routes} from 'react-router-dom'
import Home from './pages/Home'
import PlayGround from './pages/Ground'
import Hero from "./components/Hero"
import {Toaster} from "react-hot-toast"

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/ground" element={<PlayGround/>}/>
      <Route path="/join/:roomId" element={<Hero/>}/>
    </Routes>
    <Toaster/>
    </>
  )
}


export default App
