import re

with open("/root/Documents/GitHub/spatial-browser/src/renderer/src/components/shapes/BrowserWidget/BrowserWidgetNode.tsx", "r") as f:
    content = f.read()

old_block = """        <div className="flex gap-2 mr-4 text-on-surface-variant flex-shrink-0 border-r border-white/5 pr-4 justify-end">
          <button type="button" onClick={() => {
              const viewport = window.electron ? null : null; // Hack to fix lint if needed, actually we just need store
              const id = `browser_${Date.now()}`
              const newNode = {
                  id,
                  type: 'browser_widget', 
                  position: { x: positionX + 50, y: positionY + 50 },
                  data: {
                    ...widget,
                    id: undefined,
                    interactionState: 'active',
                    lastActive: Date.now()
                  }
              }
              const store = useCanvasStore.getState()
              store.addNode(newNode)
            }} className="hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10" title="Duplicate Tab">
            <Copy size={14} />
          </button>
        </div>"""

new_block = """        <div className="flex gap-2 mr-4 text-on-surface-variant flex-shrink-0 border-r border-white/5 pr-4 justify-end">
          <button type="button" onClick={() => {
              const id = `browser_${Date.now()}`
              const newNode = {
                  id,
                  type: 'browser_widget', 
                  position: { x: (positionX || widget.w || 0) + 50, y: (positionY || widget.h || 0) + 50 },
                  data: {
                    ...widget,
                    id: undefined,
                    interactionState: 'active',
                    lastActive: Date.now()
                  }
              }
              const store = useCanvasStore.getState()
              store.addNode(newNode)
            }} className="hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10" title="Duplicate Tab">
            <Copy size={14} />
          </button>
        </div>"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open("/root/Documents/GitHub/spatial-browser/src/renderer/src/components/shapes/BrowserWidget/BrowserWidgetNode.tsx", "w") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Could not find old block")
