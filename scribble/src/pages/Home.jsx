import React, { useEffect } from 'react'
import Hero from '../components/Hero'
import { useSelector } from 'react-redux'
import CreateRoom from '../components/CreateRoom'


const Home = () => {
  const isCreatingRoom=useSelector(state=>state?.roomCreating)
  
  console.log(isCreatingRoom)
  return (
    <div className="w-screen h-screen">
        {isCreatingRoom?<CreateRoom/>:<Hero/>}
    </div>
  )
}

export default Home
