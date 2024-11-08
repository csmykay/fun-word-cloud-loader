import React, { useCallback, useState } from 'react';

const CSVLoader = ({ onNamesLoaded }) => {
  const [loadedNames, setLoadedNames] = useState([]);
  const [fileName, setFileName] = useState('');
  
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const names = text.split('\n')
          .map(name => name.trim())
          .filter(name => name.length > 0);
        setLoadedNames(names);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleStart = () => {
    if (loadedNames.length > 0) {
      onNamesLoaded(loadedNames);
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex gap-4 items-center">
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="p-2 border rounded"
        />
        {fileName && (
          <span className="text-gray-600">
            Loaded: {fileName} ({loadedNames.length} names)
          </span>
        )}
      </div>
      {loadedNames.length > 0 && (
        <button
          onClick={handleStart}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Start Word Cloud Build
        </button>
      )}
    </div>
  );
};

export default CSVLoader;