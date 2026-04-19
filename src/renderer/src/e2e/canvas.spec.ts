import { test, expect } from '@playwright/test'
import { _electron as electron, ElectronApplication } from 'playwright'
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers'
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
  
  // Wait for the spatial command text to ensure app is loaded
  await window.waitForSelector('text=SpatialCommand')
  
  // The omnibar should not be visible initially
  const omnibarInput = window.locator('input[placeholder="Enter a URL or search..."]')
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

  // In an E2E test, we'd also check if the widget DOM element or webview appears here
})