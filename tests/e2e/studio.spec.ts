import { test, expect, Page } from '@playwright/test';

const gotoStudio = async (page: Page) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible();
};

test.describe('Studio interactions', () => {
  test('adds intervention from palette and opens inspector', async ({ page }) => {
    await gotoStudio(page);

    const foodCard = page.locator('.pill', { hasText: 'Food' }).first();
    await expect(foodCard).toBeVisible();
    await foodCard.click();

    const visItem = page.locator('.timeline-vis .vis-item');
    await expect(visItem).toHaveCount(1);

    await visItem.click();
    await expect(page.locator('.inspector h3')).toHaveText('Food');

    const intensitySlider = page.locator('.intensity input[type="range"]');
    await intensitySlider.fill('0.5');
    await expect(page.getByText('Intensity 50%')).toBeVisible();
  });

  test('playhead slider updates label and selection', async ({ page }) => {
    await gotoStudio(page);
    const playheadSlider = page.locator('.playhead input[type="range"]').first();
    await playheadSlider.fill('120');
    const timeLabel = page.locator('.playhead span').last();
    await expect(timeLabel).toHaveText('02:00');
  });
});

test.describe('Scenario management', () => {
  test('saves a snapshot and lists it in table', async ({ page }) => {
    await page.goto('/scenarios');
    const nameInput = page.getByPlaceholder('Scenario name');
    await nameInput.fill('Morning Baseline');
    await page.getByRole('button', { name: 'Save snapshot' }).click();
    await expect(page.getByRole('cell', { name: 'Morning Baseline' })).toBeVisible();
  });
});
