'use client';

import React, { useRef, useState, useEffect } from 'react';

const Canvas = () => {
  const mouseIsDown = useRef(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false)

  const [history, setHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const [zoomLevel, setZoomLevel] = useState(1);
  const minZoom = 0.5;
  const maxZoom = 3;

  const [currentColor, setCurrentColor] = useState('#000000');

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (history.length > 1) {
      applyZoom(zoomLevel);
    }
  }, [zoomLevel]);

  useEffect(() => {
    redrawCanvas();
  }, [panOffset]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        isPanning.current = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        isPanning.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleZoom);
    return () => {
      window.removeEventListener('keydown', handleZoom);
    };
  }, [zoomLevel]);


  const onMouseDown = (e) => {
    mouseIsDown.current = true;
    if (isPanning.current) {
      startPan(e);
    } else {
      startDrawing(e);
    }
  };

  const onMouseUp = () => {
    mouseIsDown.current = false;
    stopDrawing();
    stopPan();
  };

  const onMouseMove = (e) => {
    if (mouseIsDown.current) {
      if (isPanning.current) {
        pan(e);
      } else {
        draw(e);
      }
    }
  };

  const startPan = (e) => {
    isPanning.current = true;
    lastMousePosition.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleZoom = (e) => {
    if (e.ctrlKey && (e.key === '+' || e.key === '-')) {
      e.preventDefault();
      let newZoomLevel = zoomLevel;
      if (e.key === '+' && e.type === 'keydown') {
        newZoomLevel = Math.min(zoomLevel * 1.1, maxZoom);
      } else if (e.key === '-' && e.type === 'keydown') {
        newZoomLevel = Math.max(zoomLevel / 1.1, minZoom);
      }
      setZoomLevel(newZoomLevel);
      applyZoom(newZoomLevel);
    }
  };

  const saveState = () => {
    if (canvasRef.current) {
      const canvasState = canvasRef.current.toDataURL();
      setHistory((prevHistory) => [...prevHistory, canvasState]);
      setRedoHistory([]);
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let offsetX, offsetY;
    if (e.touches) {
      offsetX = (e.touches[0].clientX - rect.left) * scaleX - panOffset.x / zoomLevel;
      offsetY = (e.touches[0].clientY - rect.top) * scaleY - panOffset.y / zoomLevel;
    } else {
      offsetX = (e.nativeEvent.offsetX * scaleX - panOffset.x) / zoomLevel;
      offsetY = (e.nativeEvent.offsetY * scaleY - panOffset.y) / zoomLevel;
    }

    setIsDrawing(true);

    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = ((e.clientX - rect.left) * scaleX - panOffset.x) / zoomLevel;
    const y = ((e.clientY - rect.top) * scaleY - panOffset.y) / zoomLevel;

    ctx.lineWidth = 10 / zoomLevel;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  //when do we stop?
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
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
    ctx.save();

    if (history.length > 0) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0);
      };
      image.src = history[history.length - 1];
    }

    ctx.scale(zoomLevel, zoomLevel);

    ctx.translate(panOffset.x, panOffset.y);
  };

  const pan = (e) => {
    if (!isPanning.current) return;

    const dx = e.clientX - lastMousePosition.current.x;
    const dy = e.clientY - lastMousePosition.current.y;

    setPanOffset((prevOffset) => ({
      x: prevOffset.x + dx,
      y: prevOffset.y + dy
    }));

    lastMousePosition.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const stopPan = () => {
    isPanning.current = false;
  };

  const applyZoom = (newZoomLevel) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear the canvas and apply transformations
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); // Save the context state before transformations
    ctx.scale(newZoomLevel, newZoomLevel);
    ctx.translate(panOffset.x, panOffset.y);

    // Only proceed if there's history
    if (history.length > 0) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width * newZoomLevel, canvas.height * newZoomLevel);
      };
      image.src = history[history.length - 1];
      console.log('history length', history.length);
    } else {
      // No history: just restore the context

      console.log('no history');
    }
    ctx.restore();
  };

  const handleColorChange = (e) => {
    setCurrentColor(e.target.value);
  };

  return (
    <div>
      <input type="color" value={currentColor} onChange={handleColorChange} />
      <p>X: {mousePosition.x}</p>
      <p>Y: {mousePosition.y}</p>
      <p>Client X={lastMousePosition.current.x}</p>
      <p>Client Y={lastMousePosition.current.y}</p>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseOut={onMouseUp}
        onMouseMove={onMouseMove}
        style={{ border: '2px solid black', width: '100%', height: '500px' }}
      />
      <p>"zoomLevel"={zoomLevel}</p>
      <p>Canvas width ={canvasRef.current?.width}</p>
      <p>Canvas height ={canvasRef.current?.height}</p>
      <p>isPanning {isPanning.current.toString()}</p>
      <p>panOffset x={panOffset.x}</p>
      <p>panOffset y={panOffset.y}</p>
      <p>history length ={history.length}</p>
      <p>mouseIsDown ={mouseIsDown.current} </p>
    </div>
  );
};

export default Canvas;
