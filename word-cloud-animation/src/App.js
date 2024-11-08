import React, { useState } from 'react';
import WordCloud from './components/WordCloud';
import CSVLoader from './components/CSVLoader';

function App() {
  const [names, setNames] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleNamesLoaded = (loadedNames) => {
    setNames(loadedNames);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[725px]"> {/* Match WordCloud width */}
        <CSVLoader onNamesLoaded={handleNamesLoaded} />
        <WordCloud names={names} isPlaying={isPlaying} />
      </div>
    </div>
  );
}

export default App;