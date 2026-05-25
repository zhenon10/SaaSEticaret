import type { Category } from '@saas/api-client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function findCategoryByIdOrSlug(
  categories: Category[],
  param?: string,
): Category | undefined {
  if (!param) return undefined;

  const queue = [...categories];
  while (queue.length > 0) {
    const cat = queue.shift()!;
    if (cat.id === param || cat.slug === param) return cat;
    queue.push(...(cat.children ?? []));
  }
}

export function resolveCategoryId(
  categories: Category[],
  param?: string,
): string | undefined {
  return findCategoryByIdOrSlug(categories, param)?.id;
}

export function resolveCategorySlug(
  categories: Category[],
  param?: string,
): string | undefined {
  return findCategoryByIdOrSlug(categories, param)?.slug;
}

export function categoryProductsHref(slug: string): string {
  return `/products?category=${encodeURIComponent(slug)}`;
}

/** nav.links / footer: UUID veya slug → her zaman slug */
export function resolveCategoryHref(
  href: string,
  categories: Category[],
): string {
  if (!href.startsWith('/products')) return href;

  const qIndex = href.indexOf('?');
  if (qIndex === -1) return href;

  const params = new URLSearchParams(href.slice(qIndex + 1));
  const cat = params.get('category');
  if (!cat) return href;

  const slug = resolveCategorySlug(categories, cat);
  if (!slug || slug === cat) return href;

  params.set('category', slug);
  return `${href.slice(0, qIndex)}?${params.toString()}`;
}

export function isCategoryUuid(param?: string): boolean {
  return !!param && UUID_RE.test(param);
}
