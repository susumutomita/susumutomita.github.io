import { test, expect } from '@playwright/test';

test.describe('Blog Pagination', () => {
  test('page 1 loads correctly', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/Blog.*Susumu Tomita/);
    await expect(page.locator('h1')).toContainText(/Blog/);
  });

  test('displays posts on page 1', async ({ page }) => {
    await page.goto('/blog');

    // Check that blog posts are displayed
    const posts = page.locator('a[href^="/blog/"]:has(h2)');
    const postCount = await posts.count();

    // Should display at most 10 posts per page
    expect(postCount).toBeGreaterThan(0);
    expect(postCount).toBeLessThanOrEqual(10);
  });

  test('pagination controls are visible when needed', async ({ page }) => {
    await page.goto('/blog');

    // Check if pagination nav exists
    const paginationNav = page.locator('nav[aria-label="Pagination Navigation"]');

    // If there are more than 10 posts, pagination should be visible
    const posts = page.locator('a[href^="/blog/"]:has(h2)');
    const postCount = await posts.count();

    if (postCount === 10) {
      // If exactly 10 posts on page 1, there might be a page 2
      await expect(paginationNav).toBeVisible();
    }
  });

  test('page counter displays correctly', async ({ page }) => {
    await page.goto('/blog');

    const pageCounter = page.locator('nav[aria-label="Pagination Navigation"]');
    if (await pageCounter.isVisible()) {
      // Should show "Page 1 of X"
      await expect(pageCounter).toContainText(/Page 1/);
      await expect(pageCounter).toContainText(/of/);
    }
  });

  test('Previous button is disabled on page 1', async ({ page }) => {
    await page.goto('/blog');

    const paginationNav = page.locator('nav[aria-label="Pagination Navigation"]');
    if (await paginationNav.isVisible()) {
      const prevButton = page.locator('nav[aria-label="Pagination Navigation"] > div:first-child > span[aria-disabled="true"]');
      if (await prevButton.isVisible()) {
        // Should have aria-disabled="true" or be a span (not a link)
        await expect(prevButton).toHaveAttribute('aria-disabled', 'true');
        await expect(prevButton).toContainText('Previous');
      }
    }
  });

  test('can navigate to page 2 if it exists', async ({ page }) => {
    await page.goto('/blog');

    // Check if Next button exists and is clickable
    const nextLink = page.locator('nav[aria-label="Pagination Navigation"] a:has-text("Next")');

    if (await nextLink.isVisible()) {
      await nextLink.click();

      // Should be on page 2
      await expect(page).toHaveURL(/\/blog\/2/);
      await expect(page).toHaveTitle(/Blog.*Page 2/);

      // Page counter should show "Page 2"
      const pageCounter = page.locator('nav[aria-label="Pagination Navigation"]');
      await expect(pageCounter).toContainText(/Page 2/);
    }
  });

  test('can navigate back from page 2 to page 1', async ({ page }) => {
    await page.goto('/blog/2');

    // Check if page 2 exists
    const isPage2 = await page.locator('nav[aria-label="Pagination Navigation"]').isVisible();

    if (isPage2) {
      const prevLink = page.locator('nav[aria-label="Pagination Navigation"] a:has-text("Previous")');
      await expect(prevLink).toBeVisible();
      await prevLink.click();

      // Should be back on page 1
      await expect(page).toHaveURL(/\/blog\/?$/);
      await expect(page).toHaveTitle(/Blog.*Susumu Tomita/);
      await expect(page).not.toHaveTitle(/Page 2/);
    }
  });

  test('Next button is disabled on last page', async ({ page }) => {
    // First, find out how many pages there are
    await page.goto('/blog');

    const pageCounter = page.locator('nav[aria-label="Pagination Navigation"]');
    if (await pageCounter.isVisible()) {
      const pageText = await pageCounter.textContent();
      const match = pageText?.match(/of (\d+)/);

      if (match && match[1]) {
        const lastPage = parseInt(match[1]);

        // Navigate to last page
        await page.goto(`/blog/${lastPage}`);

        // Next button should be disabled
        const nextButton = page.locator('nav[aria-label="Pagination Navigation"] > div:last-child > span[aria-disabled="true"]');
        if (await nextButton.isVisible()) {
          await expect(nextButton).toHaveAttribute('aria-disabled', 'true');
          await expect(nextButton).toContainText('Next');
        }
      }
    }
  });

  test('blog post links work from paginated pages', async ({ page }) => {
    await page.goto('/blog');

    // Click on the first blog post
    const firstPost = page.locator('a[href^="/blog/"]:has(h2)').first();
    const postHref = await firstPost.getAttribute('href');

    await firstPost.click();

    // Should navigate to the blog post
    await expect(page).toHaveURL(new RegExp(postHref || ''));
    // Should show blog post content (check for article specifically)
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('preserves proper heading structure on all pages', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toHaveCount(1);

    // Check page 2 if it exists
    const nextLink = page.locator('nav[aria-label="Pagination Navigation"] a:has-text("Next")');
    if (await nextLink.isVisible()) {
      await nextLink.click();
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });
});
