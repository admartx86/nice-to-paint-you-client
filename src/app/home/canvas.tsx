'use client';

import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';

const Canvas = () => {
  const [isDrawingMode, setIsDrawingMode] = useState(true);

  useEffect(() => {
    const canvas = new fabric.Canvas('canvas', {});
    canvas.isDrawingMode = isDrawingMode;
    canvas.freeDrawingBrush.width = 10;
    return () => canvas.dispose();
  }, [isDrawingMode]);

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
  };

  return (
    <div className="pt-10 pb-10 flex justify-center items-center">
      <button onClick={toggleDrawingMode}>Toggle Drawing Mode</button>
      <canvas
        id="canvas"
        className="border-solid border-4 border-gray-300"
        width="480"
        height="480"
      />
    </div>
  );
};

export default Canvas;