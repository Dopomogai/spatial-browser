     1|import React, { useEffect, useState } from 'react';
     2|import { useEditor } from 'tldraw';
     3|import { useCanvasStore } from '../../store/useCanvasStore';
     4|
     5|export const Minimap: React.FC = () => {
     6|  const editor = useEditor();
     7|  const { widgets } = useCanvasStore();
     8|  const [viewportBounds, setViewportBounds] = useState({ minX: 0, minY: 0, maxX: 1000, maxY: 1000 });
     9|
    10|  useEffect(() => {
    11|    const updateViewport = () => {
    12|      setViewportBounds(editor.getViewportPageBounds());
    13|    };
    14|
    15|    updateViewport();
    16|
    17|    const unsubscribe = editor.store.listen(updateViewport, { source: 'user', scope: 'document' });
    18|    return () => unsubscribe();
    19|  }, [editor]);
    20|
    21|  // Calculate the overall bounds of all widgets
    22|  const widgetList = Object.values(widgets);
    23|  
    24|  if (widgetList.length === 0) return null;
    25|
    26|  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    27|    try {
    28|        const rect = e.currentTarget.getBoundingClientRect();
    29|        const clickX = e.clientX - rect.left;
    30|        const clickY = e.clientY - rect.top;
    31|
    32|        const cw = 160 // minimap width
    33|        const ch = 120 // minimap height
    34|        const pad = Math.min(cw, ch) * 0.1 
    35|
    36|        const mapW = viewportBounds.maxX - viewportBounds.minX || 1000
    37|        const mapH = viewportBounds.maxY - viewportBounds.minY || 1000
    38|
    39|        const scale = Math.min((cw - pad * 2) / mapW, (ch - pad * 2) / mapH)
    40|
    41|        const offX = (cw - mapW * scale) / 2
    42|        const offY = (ch - mapH * scale) / 2
    43|
    44|        const targetX = (clickX - offX) / scale + viewportBounds.minX
    45|        const targetY = (clickY - offY) / scale + viewportBounds.minY
    46|
    47|        // We center the camera on the target
    48|        const vBounds = editor.getViewportPageBounds()
    49|        editor.pan({ 
    50|            x: -targetX + vBounds.w / 2, 
    51|            y: -targetY + vBounds.h / 2 
    52|        }, { duration: 500 }) // animate pan 
    53|    } catch(e) {}
    54|  }
    55|
    56|  let minX = Infinity;
    57|  let minY = Infinity;
    58|  let maxX = -Infinity;
    59|  let maxY = -Infinity;
    60|
    61|  widgetList.forEach(w => {
    62|    if (w.x < minX) minX = w.x;
    63|    if (w.y < minY) minY = w.y;
    64|    if (w.x + w.w > maxX) maxX = w.x + w.w;
    65|    if (w.y + w.h > maxY) maxY = w.y + w.h;
    66|  });
    67|
    68|  // Expand bounds slightly to give some margin
    69|  const padding = 1000;
    70|  minX -= padding;
    71|  minY -= padding;
    72|  maxX += padding;
    73|  maxY += padding;
    74|
    75|  const totalWidth = maxX - minX;
    76|  const totalHeight = maxY - minY;
    77|
    78|  // Minimap dimensions
    79|  const minimapWidth = 200;
    80|  const minimapHeight = 150;
    81|
    82|  const scaleX = minimapWidth / totalWidth;
    83|  const scaleY = minimapHeight / totalHeight;
    84|  let scale = Math.min(scaleX, scaleY);
    85|  
    86|  if (scale === Infinity || isNaN(scale)) scale = 1;
    87|
    88|  const mapX = (x: number) => (x - minX) * scale;
    89|  const mapY = (y: number) => (y - minY) * scale;
    90|
    91|  return (
    92|    <div className="absolute top-4 right-4 w-[200px] h-[150px] bg-[#131315]/80 backdrop-blur-2xl rounded-2xl border border-outline-variant/20 shadow-[0_12px_32px_rgba(255,255,255,0.1)] overflow-hidden z-50 pointer-events-auto">
    93|      <div className="relative w-full h-full">
    94|        {/* Draw all widgets */}
    95|        {widgetList.map(widget => (
    96|          <div
    97|            key={widget.id}
    98|            className="absolute rounded-sm bg-primary/20 border border-primary/50"
    99|            style={{
   100|              left: `${mapX(widget.x)}px`,
   101|              top: `${mapY(widget.y)}px`,
   102|              width: `${widget.w * scale}px`,
   103|              height: `${widget.h * scale}px`,
   104|            }}
   105|          />
   106|        ))}
   107|
   108|        {/* Draw the viewport bounding box */}
   109|        <div
   110|          className="absolute border border-white"
   111|          style={{
   112|            left: `${mapX(viewportBounds.minX)}px`,
   113|            top: `${mapY(viewportBounds.minY)}px`,
   114|            width: `${(viewportBounds.maxX - viewportBounds.minX) * scale}px`,
   115|            height: `${(viewportBounds.maxY - viewportBounds.minY) * scale}px`,
   116|          }}
   117|        />
   118|      </div>
   119|    </div>
   120|  );
   121|};
   122|