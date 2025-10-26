import React, { useState } from 'react';
import './App.css';

function App() {
  const [mood, setMood] = useState('');
  const [showMood, setShowMood] = useState('');

  const handleGetMood = () => {
    // TODO: Connect to smart contract to get mood
    console.log('Getting mood from contract...');
    // Placeholder: show the current input value
    setShowMood(mood || 'No mood set yet');
  };

  const handleSetMood = () => {
    // TODO: Connect to smart contract to set mood
    console.log('Setting mood:', mood);
    setShowMood(`Mood set to: ${mood}`);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>This is my dApp!</h1>
        <p>Here we can set or get the mood:</p>
        <label htmlFor="mood">Input Mood:</label>
        <br />
        <input
          type="text"
          id="mood"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        />

        <button onClick={handleGetMood}>Get Mood</button>
        <button onClick={handleSetMood}>Set Mood</button>
        <p id="showMood">{showMood}</p>
      </div>
    </div>
  );
}

export default App;
