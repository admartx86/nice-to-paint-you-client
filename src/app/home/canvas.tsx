// components/Canvas.tsx
"use client";

import React, { useRef, useState, useEffect } from 'react';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]); //new

  const saveState = () => {
    if (canvasRef.current) {
      const canvasState = canvasRef.current.toDataURL();
      setHistory(prevHistory => [...prevHistory, canvasState]);
    }
  };

  useEffect(() => {
    // Save the initial blank state of the canvas
    if (canvasRef.current) {
      saveState();
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
      setIsDrawing(false);
      saveState(); // Save the state when the drawing stops
    }
  };

  const undoLast = () => {
    if (history.length <= 1) return; 
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const lastState = history[history.length - 2]; // Get the second last state
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(image, 0, 0);
      };
      image.src = lastState;
      setHistory(history.slice(0, -1)); // Remove the last state
    }
  };

  useEffect(() => {
    const handleUndo = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        undoLast();
      }
    };

    window.addEventListener('keydown', handleUndo);

    return () => {
      window.removeEventListener('keydown', handleUndo);
    };
  }, [history]);


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