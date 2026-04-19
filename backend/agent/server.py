from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio
import json
import logging
from playwright.async_api import async_playwright

# In a real app we'd import browser-use here, e.g.:
# from browser_use import Agent as BrowserUseAgent
# from langchain_openai import ChatOpenAI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GhostCursorProxy")

app = FastAPI()

# Store active websocket connections to the generic UI
active_connections = []

@app.websocket("/ws/spatial")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    logger.info("React Frontend Connected to Spatial WS")
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # If react tells us the user moved their mouse, we halt active agents
            if payload.get("action") == "override":
                logger.warning("HUMAN OVERRIDE DETECTED. Halting active agent operations.")
                # We would trip a global cancellation token here for browser-use
                
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("React Frontend Disconnected")

class AgentTaskRequest(BaseModel):
    tab_id: str
    cdp_url: str  # e.g. "http://localhost:9222"
    prompt: str
    
async def broadcast_cursor_move(x: int, y: int, agent_name: str = "Librarian"):
    if not active_connections:
        return
        
    msg = json.dumps({
        "type": "GHOST_MOVE",
        "agent": agent_name,
        "x": x,
        "y": y
    })
    
    # Broadcast to all connected spatial canvases
    for conn in active_connections:
        try:
            await conn.send_text(msg)
        except:
            pass

@app.post("/api/v1/agent/run")
async def run_agent_on_tab(req: AgentTaskRequest):
    """
    This is the core entrypoint for V2. 
    React calls this when a user types a command into a specific widget's omnibar.
    """
    logger.info(f"Starting agent on tab {req.tab_id} via {req.cdp_url}")
    
    # We will spin this off into a background task so the API returns immediately
    asyncio.create_task(execute_browser_use_cycle(req))
    
    return {"status": "Agent dispatched", "target": req.tab_id}

async def execute_browser_use_cycle(req: AgentTaskRequest):
    """
    The actual browser-use wrapper loop.
    """
    try:
        async with async_playwright() as p:
            # 1. CONNECT to the existing Electron Webview
            logger.info("Connecting to Electron CDP...")
            browser = await p.chromium.connect_over_cdp(req.cdp_url)
            
            # Since Electron might have many webviews, we find the one matching our tab
            # (In production, we map req.tab_id to the specific playwright context/page)
            contexts = browser.contexts
            if not contexts:
                logger.error("No browser contexts found on CDP port.")
                return
                
            page = contexts[0].pages[0]
            logger.info(f"Attached to page: {await page.title()}")
            
            # 2. Simulate what `browser-use` does under the hood, but inject our cursor
            # (Mocking an LLM deciding to click a button for demonstration)
            
            logger.info("Agent deciding next action...")
            await asyncio.sleep(2) # LLM thinking...
            
            # Action: Move to search bar and click (Simulated coordinates)
            target_x = 450
            target_y = 200
            
            # --- The Gamification Handoff ---
            # Before we let playwright click, we animate the Ghost Cursor on the canvas
            logger.info(f"Emitting Ghost Cursor move to {target_x}, {target_y}")
            await broadcast_cursor_move(target_x, target_y)
            
            # Wait for animation to visually complete on React side
            await asyncio.sleep(0.8) 
            
            # Now execute the actual CDP click
            await page.mouse.click(target_x, target_y)
            logger.info("Physical CDP click executed.")
            
            await browser.close()
            
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
