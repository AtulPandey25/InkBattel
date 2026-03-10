import React, { useState } from 'react';
import {useRoom} from "../store/roomStore.jsx"
import {drawWord,manageTimer} from "../services/socket.services.js"
import toast from "react-hot-toast"
const words = ['apple', 'mango', 'banana'];

const WordGuess = () => {

  const room =useRoom();
  const [selectedWord, setSelectedWord] = useState('');
  
  const Worddraw=(roomId,word)=>{
    try{
        if(selectedWord.trim()===""){
          return toast.error("Please Select the Word")
       }
       drawWord(roomId,word)
       manageTimer(roomId)
       room?.setIsChoosing(false)

    }catch(error){
        console.log(error)
        toast.error("Internal Server Error")
    }
  }
  return (
    <section className="word-guess-shell" aria-label="Word selection panel">
      <div className="paper-card word-guess-card">
        <p className="word-guess-kicker">Your turn to draw</p>
        <h2 className="word-guess-title">Choose A Word</h2>
        <p className="word-guess-subtitle">
          {/* Pick one option. Other players will start guessing once you begin sketching. */}
        </p>

        <div className="word-guess-grid" role="listbox" aria-label="Word choices">
          {room?.words.map((word, index) => {
            const isSelected = selectedWord === word;

            return (
              <button
                key={word}
                type="button"
                id={`word-option-${index}`}
                className={`word-option ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedWord(word)}
                aria-selected={isSelected}
              >
                {word}
              </button>
            );
          })}
        </div>

        <div className="word-guess-footer">
          <span className="word-guess-picked">
            {selectedWord ? `Selected: ${selectedWord}` : 'Select one word to continue'}
          </span>
          <button onClick={()=>Worddraw(room?.roomId,selectedWord)} type="button" className="draw-btn word-guess-confirm" disabled={!selectedWord}>
            Lock In
          </button>
        </div>
      </div>
    </section>
  );
};

export default WordGuess;
