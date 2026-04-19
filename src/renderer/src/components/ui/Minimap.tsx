import React, { useEffect, useState } from 'react';
import { useEditor } from 'tldraw';
import { useCanvasStore } from '../../store/useCanvasStore';

export const Minimap: React.FC = () => {
  const editor = useEditor();
  const { widgets } = useCanvasStore();
  const [viewportBounds, setViewportBounds] = useState({ minX: 0, minY: 0, maxX: 1000, maxY: 1000 });

  useEffect(() => {
    const updateViewport = () => {
      setViewportBounds(editor.getViewportPageBounds());
    };

    updateViewport();

    const unsubscribe = editor.store.listen(updateViewport, { source: 'user', scope: 'document' });
    return () => unsubscribe();
  }, [editor]);

  // Calculate the overall bounds of all widgets
  const widgetList = Object.values(widgets);
  
  if (widgetList.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  widgetList.forEach(w => {
    if (w.x < minX) minX = w.x;
    if (w.y < minY) minY = w.y;
    if (w.x + w.w > maxX) maxX = w.x + w.w;
    if (w.y + w.h > maxY) maxY = w.y + w.h;
  });

  // Expand bounds slightly to give some margin
  const padding = 1000;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;

  // Minimap dimensions
  const minimapWidth = 200;
  const minimapHeight = 150;

  const scaleX = minimapWidth / totalWidth;
  const scaleY = minimapHeight / totalHeight;
  let scale = Math.min(scaleX, scaleY);
  
  if (scale === Infinity || isNaN(scale)) scale = 1;

  const mapX = (x: number) => (x - minX) * scale;
  const mapY = (y: number) => (y - minY) * scale;

  return (
    <div className="absolute top-4 right-4 w-[200px] h-[150px] bg-[#131315]/80 backdrop-blur-2xl rounded-2xl border border-outline-variant/20 shadow-[0_12px_32px_rgba(255,255,255,0.1)] overflow-hidden z-50 pointer-events-auto">
      <div className="relative w-full h-full">
        {/* Draw all widgets */}
        {widgetList.map(widget => (
          <div
            key={widget.id}
            className="absolute rounded-sm bg-primary/20 border border-primary/50"
            style={{
              left: `${mapX(widget.x)}px`,
              top: `${mapY(widget.y)}px`,
              width: `${widget.w * scale}px`,
              height: `${widget.h * scale}px`,
            }}
          />
        ))}

        {/* Draw the viewport bounding box */}
        <div
          className="absolute border border-white"
          style={{
            left: `${mapX(viewportBounds.minX)}px`,
            top: `${mapY(viewportBounds.minY)}px`,
            width: `${(viewportBounds.maxX - viewportBounds.minX) * scale}px`,
            height: `${(viewportBounds.maxY - viewportBounds.minY) * scale}px`,
          }}
        />
      </div>
    </div>
  );
};
