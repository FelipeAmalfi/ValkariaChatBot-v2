import { test, expect } from '@playwright/test'

test('completes 4-step registration', async ({ page }) => {
  await page.goto('/auth/register')

  // Step 1: name, class, race
  await page.fill('[data-testid="name-input"]', 'E2eTestPlayer')
  await page.selectOption('[data-testid="class-select"]', 'Guerreiro')
  await page.selectOption('[data-testid="race-select"]', 'Humano')
  await page.click('[data-testid="next-btn"]')

  // Step 2: background
  await page.fill('[data-testid="background-input"]', 'Um guerreiro experiente que viajou por toda Valkária buscando batalhas e glória.')
  await page.click('[data-testid="next-btn"]')

  // Step 3: personality
  await page.fill('[data-testid="personality-input"]', 'Direto e honrado, nunca foge de um desafio.')
  await page.click('[data-testid="next-btn"]')

  // Step 4: interests → submit
  await page.fill('[data-testid="interests-input"]', 'combate, honra, armas antigas')
  await page.click('[data-testid="submit-btn"]')

  await expect(page).toHaveURL(/\/auth\/login/)
})
