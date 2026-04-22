import { test, expect } from '@playwright/test'
import { _electron as electron, ElectronApplication } from 'playwright'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let electronApp: ElectronApplication

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [join(__dirname, '../../../../out/main/index.js')]
  })
})

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close()
  }
})

test('renders the initial canvas and omnibar keyboard trap works', async () => {
  const window = await electronApp.firstWindow()
  
  // Wait for the minimal canvas load (just search for a distinct background/element)
  await window.waitForSelector('.react-flow__pane')
  
  // The omnibar should not be visible initially
  const omnibarInput = window.locator('input[placeholder="Search or enter URL, then hit Enter"]')
  await expect(omnibarInput).not.toBeVisible()

  // Simulate Cmd+K
  await window.keyboard.press('Meta+k')
  
  // Now it should be visible
  await expect(omnibarInput).toBeVisible()

  // Try adding a widget
  await omnibarInput.fill('https://example.com')
  await window.keyboard.press('Enter')

  // The omnibar should close
  await expect(omnibarInput).not.toBeVisible()
})

test('spatial engine render culling (webview to image swap)', async () => {
  const window = await electronApp.firstWindow()

  // Reload/Reset canvas
  await window.evaluate(() => {
    localStorage.clear()
    window.location.reload()
  })
  
  await window.waitForSelector('.react-flow__pane')
  await window.waitForTimeout(1000) // Let React Flow init

  // Spawn a tab via JS dispatch
  await window.evaluate(() => {
    window.dispatchEvent(new CustomEvent('spawn-tab-center'))
  })
  
  // Tab should spawn
  const webview = window.locator('webview')
  await expect(webview).toBeVisible()
  
  // Simulate heavy zoom out locally via evaluating ReactFlow zoom 
  await window.evaluate(() => {
    // Zoom out deeply to trigger sleeping tab distance threshold or scale constraints
    // (Our implementation uses viewport bounds logic in SpatialCanvas.tsx)
    const event = new WheelEvent('wheel', { deltaY: 2000, clientX: 500, clientY: 500 })
    document.querySelector('.react-flow__pane')?.dispatchEvent(event)
  })

  // We wait for the image (screenshot) or warmup fallback container to appear
  const fallbackImg = window.locator('img[alt="site"]')
  const warmupText = window.locator('text=Warming up...')
  
  // the webview should become hidden or detached
  await expect(webview).not.toBeAttached()
  
  // Either an image or the warmup spans should show up based on culling state
  await expect(
    fallbackImg.or(warmupText).or(window.locator('text=Wake Tab'))
  ).toBeAttached({ timeout: 10000 })
})

test('fullscreen portal escape mechanics', async () => {
    const window = await electronApp.firstWindow()

    // Reload/Reset canvas
    await window.evaluate(() => {
        localStorage.clear()
        window.location.reload()
    })
    
    await window.waitForSelector('.react-flow__pane')
    
    await window.evaluate(() => {
        window.dispatchEvent(new CustomEvent('spawn-tab-center'))
    })
    
    // Check node is present in ReactFlow layer
    const reactFlowNode = window.locator('.react-flow__nodes webview')
    await expect(reactFlowNode).toBeAttached()
    
    // Find fullscreen button (green maximize button in header)
    const fullscreenButton = window.locator('button.bg-\\[\\#34c759\\]').first()
    
    // It's hidden unless hovered or active, force click via JS bypass
    await window.evaluate(() => {
        const btn = document.querySelector('button.bg-\\[\\#34c759\\]') as HTMLButtonElement
        if(btn) btn.click()
    })

    // Now assess portal escape directly
    // Wait for the app-maximized state which moves webview to fixed div
    const fixedWebview = window.locator('div[style*="position: fixed"] webview')
    await expect(fixedWebview).toBeAttached()

    // Escaping back
    await window.evaluate(() => {
        const btn = document.querySelector('button.bg-\\[\\#34c759\\]') as HTMLButtonElement
        if (btn) btn.click()
    })
    
    await expect(fixedWebview).not.toBeAttached()
})