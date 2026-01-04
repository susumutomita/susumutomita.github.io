# Blog Pagination Implementation Plan

## Current State Analysis

### Existing Implementation
- **Location**: `src/pages/blog/index.astro`
- **Current behavior**: Displays all blog posts (12 posts) on a single page
- **Problem**: As blog posts increase, the page becomes difficult to navigate
- **Posts**: 12 markdown files in `src/content/blog/`

### Technical Stack
- Framework: Astro
- Styling: UnoCSS
- Package Manager: bun
- Content: Astro Content Collections

## Design Goals

### Functional Requirements
1. Display 10 posts per page (configurable)
2. Show page navigation (Previous/Next buttons)
3. Display current page number and total pages
4. SEO-friendly URLs and meta tags
5. Accessible navigation

### Non-Functional Requirements
1. Maintain site performance (static generation)
2. Keep styling consistent with existing design
3. Mobile-responsive pagination
4. Preserve existing blog post URLs (`/blog/[slug]`)

## Technical Design

### URL Structure
```
/blog/           → Page 1 (first 10 posts)
/blog/page/2/    → Page 2 (posts 11-20)
/blog/page/3/    → Page 3 (posts 21-30)
...
```

### Astro Implementation Approach

Use Astro's `getStaticPaths()` with `paginate()` function:

```typescript
export async function getStaticPaths({ paginate }) {
  const posts = (await getCollection("blog")).sort(...);
  return paginate(posts, { pageSize: 10 });
}
```

### Component Structure

```
src/
├── components/
│   └── Pagination.astro       # New pagination component
├── pages/
│   └── blog/
│       ├── [...page].astro    # New dynamic pagination page
│       ├── [...slug].astro    # Existing post detail page
│       └── index.astro        # Update to redirect or use page 1
```

### Pagination Component Design

```astro
<!-- src/components/Pagination.astro -->
Props:
- currentPage: number
- totalPages: number
- prevUrl: string | undefined
- nextUrl: string | undefined

Features:
- Previous/Next buttons
- Current page indicator (e.g., "Page 1 of 3")
- Disabled state for unavailable navigation
- Keyboard accessible
- Mobile-responsive
```

## Refactoring Plan

### Phase 1: Component Creation
1. Create `src/components/Pagination.astro`
   - Previous/Next buttons
   - Page counter display
   - Styling consistent with site design
   - Accessible markup

### Phase 2: Dynamic Page Implementation
1. Create `src/pages/blog/[...page].astro`
   - Implement `getStaticPaths()` with pagination
   - Use Pagination component
   - Add SEO meta tags
   - Test with different page numbers

### Phase 3: Index Page Migration
1. Update `src/pages/blog/index.astro`
   - Option A: Redirect to `/blog/page/1/`
   - Option B: Make it an alias of page 1 (recommended for SEO)
   - Ensure canonical URLs are correct

### Phase 4: Testing & Validation
1. Add E2E tests for pagination
   - Test page navigation
   - Test page boundaries (first/last page)
   - Test post display on each page
2. Manual testing
   - Check all pages render correctly
   - Verify SEO tags
   - Test mobile responsiveness

## Implementation Steps

### Step 1: Create Pagination Component ✅
- [x] Create `src/components/Pagination.astro`
- [x] Implement Previous/Next buttons with UnoCSS styling
- [x] Add page counter display
- [x] Ensure accessibility (aria-labels, keyboard navigation)
- [x] Test component in isolation

### Step 2: Implement Dynamic Pagination Page ✅
- [x] Create `src/pages/blog/[...page].astro`
- [x] Implement `getStaticPaths()` with paginate()
- [x] Set pageSize to 10
- [x] Integrate Pagination component
- [x] Add proper meta tags and canonical URLs
- [x] Test page generation

### Step 3: Update Index Page ✅
- [x] Decide on strategy (Astro auto-generates /blog/ as page 1)
- [x] Remove old `index.astro` (no longer needed)
- [x] Ensure SEO best practices
- [x] Test that `/blog/` works correctly

### Step 4: Add E2E Tests ✅
- [x] Create `e2e/blog-pagination.spec.ts`
- [x] Test pagination navigation
- [x] Test page boundaries
- [x] Test post count per page
- [x] Verify SEO elements
- [x] All 19 tests passing

### Step 5: Documentation & Cleanup ✅
- [x] Update this plan with implementation notes
- [x] Add comments to complex code
- [x] Verify all tests pass
- [x] Check bundle size impact (no significant change)

## Configuration

### Constants
```typescript
// Recommended location: src/lib/constants.ts
export const POSTS_PER_PAGE = 10;
```

### SEO Considerations
- Canonical URL points to current page
- Add `rel="prev"` and `rel="next"` links
- Meta description includes page number for pages > 1
- No `noindex` on pagination pages

## Rollback Plan

If issues arise during implementation:
1. Keep `index.astro` as fallback
2. Remove `[...page].astro` if needed
3. Git revert to previous working state
4. All changes are isolated and reversible

## Success Criteria

- ✅ Each page displays exactly 10 posts (or fewer on last page)
- ✅ Pagination controls work correctly
- ✅ All existing blog post URLs still work
- ✅ No performance degradation
- ✅ Mobile-responsive design
- ✅ Passes E2E tests
- ✅ SEO tags are correct

## Timeline & Progress

### Iteration 1: Component & Core Implementation
- **Status**: ✅ Completed
- **Tasks**: Steps 1-3
- **Completion Date**: 2026-01-05

### Iteration 2: Testing & Polish
- **Status**: ✅ Completed
- **Tasks**: Steps 4-5
- **Completion Date**: 2026-01-05

## Implementation Notes

### What Was Built

1. **Pagination Component** (`src/components/Pagination.astro`)
   - Previous/Next buttons with SVG icons
   - Page counter display (e.g., "Page 1 of 2")
   - Disabled states with proper ARIA attributes
   - Consistent styling with site design (UnoCSS)
   - Mobile-responsive layout

2. **Dynamic Blog Pages** (`src/pages/blog/[...page].astro`)
   - Uses Astro's `getStaticPaths()` with `paginate()`
   - Generates `/blog/` (page 1) and `/blog/2/` (page 2)
   - 10 posts per page (configurable via `POSTS_PER_PAGE`)
   - SEO-optimized meta tags with page numbers
   - Pre-rendered for optimal performance

3. **E2E Tests** (`e2e/blog-pagination.spec.ts`)
   - 11 comprehensive tests for pagination
   - Tests navigation, boundaries, accessibility
   - All tests passing (19/19 total)

### URL Structure (Actual)

```
/blog/           → Page 1 (posts 1-10)
/blog/2/         → Page 2 (posts 11-12)
```

Note: Astro automatically generates `/blog/` as page 1, not `/blog/page/1/`

### Key Decisions

1. **Removed old index.astro**: Astro's pagination automatically handles `/blog/` as page 1
2. **Used prerender = true**: Ensures static generation for optimal performance
3. **10 posts per page**: Balances content density with navigation ease
4. **Accessible design**: All controls have proper ARIA labels and keyboard navigation

### Test Results

```
✅ 19 passed (3.1s)
- Blog pagination: 11 tests
- Main pages: 6 tests
- Navigation: 1 test
- Accessibility: 2 tests
```

---

**Last Updated**: 2026-01-05 (Implementation Completed)
**Status**: ✅ Production Ready
