import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const WordCloud = ({ names = [], isPlaying = false }) => {
  const ANIMATION_INTERVAL = 250;
  const MIN_FONT_SIZE = 8;
  const MAX_FONT_SIZE = 24;
  const PADDING = 4;
  const CORNER_MARGIN = 20;
  const GRID_COLS = 6;
  const GRID_ROWS = 4;
  const HEIGHT_PX = 140; // 1.4" × 100px/inch
  const WIDTH_PX = 725; // 7.25" × 100px/inch
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEEAD', '#D4A5A5', '#9B786F', '#A8E6CF'
  ];

  const containerRef = useRef(null);
  const [displayedNames, setDisplayedNames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [started, setStarted] = useState(false);
  const [gridDensity, setGridDensity] = useState(Array(GRID_COLS * GRID_ROWS).fill(0));

  useEffect(() => {
    if (isPlaying) {
      setCountdown(10);
      setStarted(false);
      setDisplayedNames([]);
      setCurrentIndex(0);
      setGridDensity(Array(GRID_COLS * GRID_ROWS).fill(0));
    }
  }, [isPlaying]);

  useEffect(() => {
    let timer;
    if (isPlaying && !started && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !started) {
      setStarted(true);
    }
    return () => timer && clearTimeout(timer);
  }, [countdown, isPlaying, started]);

  const updateGridDensity = (x, y, width, height) => {
    const sectionWidth = WIDTH_PX / GRID_COLS;
    const sectionHeight = HEIGHT_PX / GRID_ROWS;
    
    const startGridX = Math.floor(x / sectionWidth);
    const endGridX = Math.floor((x + width) / sectionWidth);
    const startGridY = Math.floor(y / sectionHeight);
    const endGridY = Math.floor((y + height) / sectionHeight);
    
    setGridDensity(prev => {
      const newDensity = [...prev];
      for (let gridY = startGridY; gridY <= endGridY; gridY++) {
        for (let gridX = startGridX; gridX <= endGridX; gridX++) {
          if (gridY >= 0 && gridY < GRID_ROWS && gridX >= 0 && gridX < GRID_COLS) {
            const index = gridY * GRID_COLS + gridX;
            newDensity[index]++;
          }
        }
      }
      return newDensity;
    });
  };

  const findBestPosition = (width, height) => {
    const positions = [];
    const steps = 20;
    const stepX = (WIDTH_PX - width - CORNER_MARGIN * 2) / steps;
    const stepY = (HEIGHT_PX - height - CORNER_MARGIN * 2) / steps;

    // Generate possible positions in a grid pattern
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; j <= steps; j++) {
        const x = CORNER_MARGIN + i * stepX;
        const y = CORNER_MARGIN + j * stepY;
        
        const pos = { x, y, width, height };
        if (isPositionValid(pos, displayedNames)) {
          const score = getPositionScore(x, y);
          positions.push({ x, y, score });
        }
      }
    }

    // If no valid positions found, try with reduced constraints
    if (positions.length === 0) {
      return {
        x: Math.random() * (WIDTH_PX - width),
        y: Math.random() * (HEIGHT_PX - height)
      };
    }

    // Sort by score and return the best position
    positions.sort((a, b) => b.score - a.score);
    return positions[0];
  };

  const getPositionScore = (x, y) => {
    const gridX = Math.floor((x / WIDTH_PX) * GRID_COLS);
    const gridY = Math.floor((y / HEIGHT_PX) * GRID_ROWS);
    const index = gridY * GRID_COLS + gridX;
    
    // Prefer areas with lower density
    const densityScore = 1 / (1 + gridDensity[index]);
    
    // Prefer positions away from edges
    const centerDistX = Math.abs(x - WIDTH_PX / 2) / (WIDTH_PX / 2);
    const centerDistY = Math.abs(y - HEIGHT_PX / 2) / (HEIGHT_PX / 2);
    const centerScore = 1 - (centerDistX + centerDistY) / 2;
    
    return densityScore * 0.7 + centerScore * 0.3;
  };

  const isPositionValid = (newPos, existingPositions) => {
    const newRect = {
      left: newPos.x - PADDING,
      right: newPos.x + newPos.width + PADDING,
      top: newPos.y - PADDING,
      bottom: newPos.y + newPos.height + PADDING,
    };

    return !existingPositions.some(pos => {
      const existingRect = {
        left: pos.x - PADDING,
        right: pos.x + pos.width + PADDING,
        top: pos.y - PADDING,
        bottom: pos.y + pos.height + PADDING,
      };

      return !(newRect.left > existingRect.right ||
               newRect.right < existingRect.left ||
               newRect.top > existingRect.bottom ||
               newRect.bottom < existingRect.top);
    });
  };

  useEffect(() => {
    if (!started || currentIndex >= names.length) return;

    const timer = setInterval(() => {
      if (currentIndex < names.length) {
        const newName = names[currentIndex];
        
        const fontSize = MIN_FONT_SIZE + Math.random() * (MAX_FONT_SIZE - MIN_FONT_SIZE);
        const tempEl = document.createElement('div');
        tempEl.style.fontSize = `${fontSize}px`;
        tempEl.style.position = 'absolute';
        tempEl.style.visibility = 'hidden';
        tempEl.innerText = newName;
        document.body.appendChild(tempEl);
        
        const textWidth = tempEl.offsetWidth;
        const textHeight = tempEl.offsetHeight;
        document.body.removeChild(tempEl);

        const position = findBestPosition(textWidth, textHeight);

        const newNameObj = {
          text: newName,
          x: position.x,
          y: position.y,
          width: textWidth,
          height: textHeight,
          size: fontSize,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 20 - 10
        };

        updateGridDensity(position.x, position.y, textWidth, textHeight);
        setDisplayedNames(prev => [...prev, newNameObj]);
        setCurrentIndex(prev => prev + 1);
      }
    }, ANIMATION_INTERVAL);

    return () => clearInterval(timer);
  }, [currentIndex, names, started]);

  return (
    <div 
      className="relative bg-gray-900 overflow-hidden" 
      style={{
        width: WIDTH_PX,
        height: HEIGHT_PX,
        margin: '0 auto'
      }} 
      ref={containerRef}
    >
      {isPlaying && !started && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white text-3xl font-bold">
            Starting in {countdown}...
          </div>
        </div>
      )}

      {displayedNames.map((name, index) => (
        <motion.div
          key={`${name.text}-${index}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: name.x,
            y: name.y,
            rotate: name.rotation
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
            duration: 0.3
          }}
          style={{
            position: 'absolute',
            fontSize: `${name.size}px`,
            color: name.color,
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
          }}
        >
          {name.text}
        </motion.div>
      ))}
      
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-white text-xs">
        {currentIndex}/{names.length}
      </div>
    </div>
  );
};

export default WordCloud;