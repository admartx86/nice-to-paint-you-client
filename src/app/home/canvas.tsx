'use client';

import React, { useRef, useState, useEffect } from 'react';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);

  const saveState = () => {
    if (canvasRef.current) {
      const canvasState = canvasRef.current.toDataURL();
      setHistory((prevHistory) => [...prevHistory, canvasState]);
      setRedoHistory([]);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      saveState();
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY); // Start the path at the current mouse position
      ctx.lineTo(offsetX, offsetY); // Draw a tiny line segment at the same point
      ctx.stroke(); // Render the stroke, which will appear as a dot
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = e.nativeEvent;

    ctx.lineWidth = 10; // Width of the line (also the diameter of the circle)
    ctx.lineCap = 'round'; // Creates a rounded end of the line
    ctx.strokeStyle = 'black'; // Set the stroke color

    ctx.lineTo(offsetX, offsetY); // Draw a line to the current point
    ctx.stroke(); // Apply the stroke

    ctx.beginPath(); // Begin a new path for the next segment
    ctx.moveTo(offsetX, offsetY); // Move the path to the current point without creating a line
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
      setIsDrawing(false);
      saveState();
    }
  };

  const undoLast = () => {
    if (history.length <= 1) return;
    setRedoHistory((redoHistory) => [...redoHistory, history[history.length - 1]]);
    setHistory((history) => history.slice(0, -1));
    applyState(history[history.length - 2]);
  };

  const redoLast = () => {
    if (redoHistory.length === 0) return;
    const nextState = redoHistory[redoHistory.length - 1];
    setHistory((history) => [...history, nextState]);
    setRedoHistory((redoHistory) => redoHistory.slice(0, -1));
    applyState(nextState);
  };

  const applyState = (state: string) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(image, 0, 0);
      };
      image.src = state;
    }
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        undoLast();
      } else if (e.ctrlKey && e.key === 'y') {
        redoLast();
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [history, redoHistory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onMouseMove={draw}
      style={{ border: '2px solid black', width: '100%', height: '500px' }}
    />
  );
};

export default Canvas;
