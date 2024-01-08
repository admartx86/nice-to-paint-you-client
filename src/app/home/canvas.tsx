'use client';

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

const Canvas = () => {
  const canvasRef = useRef(null);
  const canvasInstance = useRef(null);

  useEffect(() => {
    canvasInstance.current = new fabric.Canvas(canvasRef.current, {});
    canvasInstance.current.isDrawingMode = true;
    canvasInstance.current.freeDrawingBrush.width = 10;
  }, []);

  return (
    <div className="pt-10 pb-10 flex justify-center items-center">
    
      <canvas
        ref={canvasRef}
        className="border-solid border-4 border-gray-300"
        width="480"
        height="480"
      />
    </div>
  );
};

export default Canvas;