import { test, expect } from '@playwright/test'

test('sends a message and receives narrator response', async ({ page }) => {
  // Login first — adjust selectors if login page changes
  await page.goto('/auth/login')
  await page.fill('[data-testid="player-name-input"]', 'TestPlayer')
  await page.click('[data-testid="login-btn"]')

  await page.goto('/chat')

  await page.fill('[data-testid="chat-input"]', 'Olá, me fale sobre Candessah')
  await page.keyboard.press('Enter')

  // LLM can be slow in test env — 30s timeout
  await expect(page.locator('[data-testid="narrator-message"]').last()).toBeVisible({ timeout: 30000 })
})
