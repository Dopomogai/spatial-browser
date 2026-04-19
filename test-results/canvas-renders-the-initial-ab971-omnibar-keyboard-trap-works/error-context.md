# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: canvas.spec.ts >> renders the initial canvas and omnibar keyboard trap works
- Location: src/renderer/src/e2e/canvas.spec.ts:29:1

# Error details

```
Error: No build found in out directory
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { _electron as electron, ElectronApplication } from 'playwright'
  3  | import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers'
  4  | import { join, dirname } from 'path'
  5  | import { fileURLToPath } from 'url'
  6  | 
  7  | const __filename = fileURLToPath(import.meta.url)
  8  | const __dirname = dirname(__filename)
  9  | 
  10 | let electronApp: ElectronApplication
  11 | 
  12 | test.beforeAll(async () => {
  13 |   // Try to find the latest electron app build, fallback to starting dev
> 14 |   const latestBuild = findLatestBuild(join(__dirname, '../../../'))
     |                       ^ Error: No build found in out directory
  15 |   const appInfo = parseElectronApp(latestBuild)
  16 | 
  17 |   electronApp = await electron.launch({
  18 |     args: [appInfo.main],
  19 |     executablePath: appInfo.executable
  20 |   })
  21 | })
  22 | 
  23 | test.afterAll(async () => {
  24 |   if (electronApp) {
  25 |     await electronApp.close()
  26 |   }
  27 | })
  28 | 
  29 | test('renders the initial canvas and omnibar keyboard trap works', async () => {
  30 |   const window = await electronApp.firstWindow()
  31 |   
  32 |   // Wait for the spatial command text to ensure app is loaded
  33 |   await window.waitForSelector('text=SpatialCommand')
  34 |   
  35 |   // The omnibar should not be visible initially
  36 |   const omnibarInput = window.locator('input[placeholder="Enter a URL or search..."]')
  37 |   await expect(omnibarInput).not.toBeVisible()
  38 | 
  39 |   // Simulate Cmd+K
  40 |   await window.keyboard.press('Meta+k')
  41 |   
  42 |   // Now it should be visible
  43 |   await expect(omnibarInput).toBeVisible()
  44 | 
  45 |   // Try adding a widget
  46 |   await omnibarInput.fill('https://example.com')
  47 |   await window.keyboard.press('Enter')
  48 | 
  49 |   // The omnibar should close
  50 |   await expect(omnibarInput).not.toBeVisible()
  51 | 
  52 |   // In an E2E test, we'd also check if the widget DOM element or webview appears here
  53 | })
```