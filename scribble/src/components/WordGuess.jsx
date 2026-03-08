import React, { useState } from 'react';

const words = ['apple', 'mango', 'Banana'];

const WordGuess = () => {
  const [selectedWord, setSelectedWord] = useState('');
  
  return (
    <section className="word-guess-shell" aria-label="Word selection panel">
      <div className="paper-card word-guess-card">
        <p className="word-guess-kicker">Your turn to draw</p>
        <h2 className="word-guess-title">Choose A Word</h2>
        <p className="word-guess-subtitle">
          {/* Pick one option. Other players will start guessing once you begin sketching. */}
        </p>

        <div className="word-guess-grid" role="listbox" aria-label="Word choices">
          {words.map((word, index) => {
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
          <button type="button" className="draw-btn word-guess-confirm" disabled={!selectedWord}>
            Lock In
          </button>
        </div>
      </div>
    </section>
  );
};

export default WordGuess;
