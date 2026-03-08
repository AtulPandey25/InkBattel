import React from 'react'

const Rooms = () => {
  return (
    <div className="container-lg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="paper-card" style={{ textAlign: 'center', width:"500px"}}>
        <h2 style={{ fontFamily: 'Gochi Hand, cursive', marginBottom: '1.5rem', color: '#333' }}>Paper Style Card</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
          <button className="pop-btn">Create Room</button>
          <button className="pop-btn">Join Room</button>
          <button className="pop-btn">Play Now!</button>
        </div>
      </div>
    </div>
  );
}

export default Rooms;
