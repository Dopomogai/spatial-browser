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

test('Top Bar Navigation Assertions', async () => {
  const window = await electronApp.firstWindow()
  
  // Wait for the minimal canvas load
  await window.waitForSelector('.react-flow__pane')
  
  // Top bar should exist
  const topBar = window.locator('.absolute.top-4.right-4')
  await expect(topBar).toBeVisible()

  // Find the minimal toggle chevron by checking the title attribute (Expand Top Bar or Minimize Top Bar)
  const toggleBtn = window.locator('button[title="Minimize Top Bar"], button[title="Expand Top Bar"]').first()
  await expect(toggleBtn).toBeVisible()

  // Get current class to check if minimal header is active
  let topBarClass = await topBar.getAttribute('class')
  const isMinimalInitially = topBarClass?.includes('w-12 h-12')
  
  // Click it
  await toggleBtn.click()

  // Assert the DOM structure changes to the minimal header layout (or vice-versa)
  topBarClass = await topBar.getAttribute('class')
  if (isMinimalInitially) {
    expect(topBarClass).not.toContain('w-12 h-12 justify-center px-0')
  } else {
    expect(topBarClass).toContain('w-12 h-12 justify-center px-0')
  }

  // Restore state to non-minimal so we can find settings button
  if (!isMinimalInitially) {
    await toggleBtn.click()
  }

  // Click the Settings button
  const settingsBtn = window.locator('button[title="Settings"]')
  await settingsBtn.click()

  // Assert settings widget mounts and is visible
  // Need to verify the exact ID or text for settings widget
  // Wait for element containing Settings text
  const settingsWidget = window.locator('text=Settings').first()
  await expect(settingsWidget).toBeVisible()
})

test('Settings Application Integrity (Theme and Grid)', async () => {
    const window = await electronApp.firstWindow()
    
    // Ensure settings is open
    await window.evaluate(() => {
        window.dispatchEvent(new CustomEvent('spawn-settings-widget'))
    })
    
    // Give it time to mount
    await window.waitForTimeout(500)
    
    // Find the current theme
    const htmlElement = window.locator('html')
    const initialTheme = await htmlElement.getAttribute('data-theme') || 'dark'
    
    // Find the Theme toggle switch
    // The text on the page says "Warm Light Theme" and right below it is the switch
    // Or we can find it structurally or by clicking on the parent of the ball
    let themeLabel = window.locator('text=Warm Light Theme')
    await expect(themeLabel).toBeVisible()
    
    // Click the toggle - it's a div next to or near the label. We know from source it has class w-10 h-5 rounded-full
    const themeToggle = window.locator('div.w-10.h-5.rounded-full').first()
    await themeToggle.click()
    
    // Assert the theme changed
    const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark'
    await expect(htmlElement).toHaveAttribute('data-theme', expectedTheme)
    
    // Revert the theme back for subsequent tests
    await themeToggle.click()
    
    // Now test the Canvas Grid
    // Check if Canvas Grid toggle is visible
    const gridLabel = window.locator('text=Show Canvas Grid')
    await expect(gridLabel).toBeVisible()
    
    // Check background component
    // Assuming Background components will have a specific SVG pattern class or ID from React Flow
    const reactFlowBackground = window.locator('.react-flow__background')
    
    // Determine the state right now
    const bgAttachedInitially = await reactFlowBackground.count() > 0
    
    // Find the grid toggle. We know there's another toggle after the theme one
    const gridToggle = window.locator('div.w-10.h-5.rounded-full').nth(1)
    await gridToggle.click()
    
    // Need a bit of time for animation/react updates
    await window.waitForTimeout(500)
    
    // Verify background mounted/unmounted
    if (bgAttachedInitially) {
        await expect(reactFlowBackground).toHaveCount(0)
    } else {
        await expect(reactFlowBackground).toBeVisible()
    }
})

test('Context Menu Trap Verification', async () => {
  const window = await electronApp.firstWindow()
  
  // Wait for the minimal canvas load
  await window.waitForSelector('.react-flow__pane')
  
  // Right-click the canvas to open the context menu via SpatialCanvas logic
  const pane = window.locator('.react-flow__pane')
  await pane.click({ button: 'right' })

  // Assuming context menu renders some distinct elements, we check for a known context menu item.
  // Using Text node context menu option or spawn tab as hook.
  const contextMenu = window.locator('text=Spawn Tab Here, text=Add Text Element').first()
  await expect(contextMenu).toBeVisible()

  // Click inside the boundaries of the canvas again (left click) or spawn a widget to click on
  // Let's spawn a tab and click it
  await window.evaluate(() => {
    window.dispatchEvent(new CustomEvent('spawn-tab-center'))
  })
  
  // Wait for tab mounting
  const webview = window.locator('webview').first()
  await expect(webview).toBeVisible()

  // Clicking on the Webview should close the Context menu via window pointer down trapped locally
  await webview.click()

  // Assert the popup menu successfully unmounts/hides due to the global dismissal trap
  await expect(contextMenu).not.toBeVisible()
})
