import { test, expect } from '@playwright/test';

test.describe('Main pages', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Susumu Tomita/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('projects page loads correctly', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveTitle(/Projects/);
    await expect(page.locator('h1')).toContainText(/Projects/i);
  });

  test('about page loads correctly', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About/);
    await expect(page.locator('h1')).toContainText(/Susumu Tomita/i);
  });

  test('resume page loads correctly', async ({ page }) => {
    await page.goto('/resume');
    await expect(page).toHaveTitle(/Resume/);
  });

  test('privacy page loads correctly', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveTitle(/Privacy/);
    await expect(page.locator('h1')).toContainText(/Privacy Policy/i);
  });

  test('blog page loads correctly', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/Blog/);
  });
});

test.describe('Navigation', () => {
  test('header navigation works', async ({ page }) => {
    await page.goto('/');

    // Navigate to Projects
    await page.getByRole('link', { name: /projects/i }).first().click();
    await expect(page).toHaveURL(/\/projects/);

    // Navigate to About
    await page.getByRole('link', { name: /about/i }).first().click();
    await expect(page).toHaveURL(/\/about/);

    // Navigate back to Home
    await page.getByRole('link', { name: /home/i }).first().click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Accessibility', () => {
  test('pages have proper heading structure', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/about');
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
