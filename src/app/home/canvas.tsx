'use client';

import React, { useRef, useState, useEffect } from 'react';

const Canvas = () => {

  const [zoomLevel, setZoomLevel] = useState(1);
  const drawingActions = useRef([]); // Store drawing actions
  const minZoom = 0.5;
  const maxZoom = 3;

  const applyZoom = (newZoomLevel) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(newZoomLevel, newZoomLevel);

    // Redraw the last saved state from history at the new scale
    if (history.length > 0) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width * newZoomLevel, canvas.height * newZoomLevel);
      };
      image.src = history[history.length - 1];
    }

    ctx.restore();
  };

  const handleZoom = (e) => {
    if (e.ctrlKey) {
      e.preventDefault(); // This prevents the browser's default zoom
  
      let newZoomLevel = zoomLevel;
  
      if ((e.key === '+' && e.type === 'keydown') || (e.type === 'wheel' && e.deltaY < 0)) {
        // Zoom in
        newZoomLevel = Math.min(zoomLevel * 1.1, maxZoom);
      } else if ((e.key === '-' && e.type === 'keydown') || (e.type === 'wheel' && e.deltaY > 0)) {
        // Zoom out
        newZoomLevel = Math.max(zoomLevel / 1.1, minZoom);
      }
  
      setZoomLevel(newZoomLevel);
      applyZoom(newZoomLevel);
    }
  };
  
  useEffect(() => {
    window.addEventListener('keydown', handleZoom);
    window.addEventListener('wheel', handleZoom, { passive: false });
  
    return () => {
      window.removeEventListener('keydown', handleZoom);
      window.removeEventListener('wheel', handleZoom);
    };
  }, [zoomLevel]);
  

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

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent default behavior for touch events
  
    let offsetX, offsetY;
    if (e.touches) {
      // Handle touch events
      offsetX = e.touches[0].clientX - canvasRef.current.getBoundingClientRect().left;
      offsetY = e.touches[0].clientY - canvasRef.current.getBoundingClientRect().top;
    } else {
      // Handle mouse events
      offsetX = e.nativeEvent.offsetX;
      offsetY = e.nativeEvent.offsetY;
    }
  
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
  };
  
  // const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
  //   const { offsetX, offsetY } = e.nativeEvent;
  //   setIsDrawing(true);

  //   const ctx = canvasRef.current.getContext('2d');
  //   if (ctx) {
  //     ctx.beginPath();
  //     ctx.moveTo(offsetX, offsetY); // Start the path at the current mouse position
  //     ctx.lineTo(offsetX, offsetY); // Draw a tiny line segment at the same point
  //     ctx.stroke(); // Render the stroke, which will appear as a dot
  //   }
  // };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Adjust mouse coordinates for zoom level
    const x = (e.clientX - rect.left) * scaleX / zoomLevel;
    const y = (e.clientY - rect.top) * scaleY / zoomLevel;

    ctx.lineWidth = 10 / zoomLevel; // Adjust line width based on zoom level
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
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
    <div>
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onMouseMove={draw}
      style={{ border: '2px solid black', width: '100%', height: '500px' }}
    />
    "zoomLevel"={zoomLevel}
    Canvas width ={canvasRef.current?.width}
    Canvas height ={canvasRef.current?.height}
    </div>
  );
};

export default Canvas;
