/**
 * Public (/) paths used when a catalog row has no image URLs.
 * Matches Cloudynap tables: beds, accessories, furniture, sofacumbed.
 */

export const CATEGORY_PLACEHOLDER_IMAGES = Object.freeze({
  bed: '/matt.png',
  accessory: '/pillow.png',
  furniture: '/furniture.png',
  sofacumbed: '/sofa-cum-bed.png',
});

/** Deals and legacy / unknown SKUs */
export const GENERIC_PRODUCT_PLACEHOLDER = '/furniture.png';

const CATALOG_KEYS = new Set(Object.keys(CATEGORY_PLACEHOLDER_IMAGES));

function normalizeCatalogType(raw) {
  if (raw == null || raw === '') return null;
  const t = String(raw).toLowerCase().trim();
  if (CATALOG_KEYS.has(t)) return t;
  if (t === 'mattress' || t === 'matteress' || t === 'mattresses' || t === 'beds') return 'bed';
  if (t === 'accessories' || t === 'pillows' || t === 'pillow') return 'accessory';
  if (t.includes('sofa')) return 'sofacumbed';
  if (t === 'furniture') return 'furniture';
  return null;
}

function placeholderFromCategoryText(text) {
  const c = String(text || '').toLowerCase();
  if (c.includes('sofa')) return CATEGORY_PLACEHOLDER_IMAGES.sofacumbed;
  if (c.includes('accessory') || c.includes('pillow')) return CATEGORY_PLACEHOLDER_IMAGES.accessory;
  if (c.includes('furniture')) return CATEGORY_PLACEHOLDER_IMAGES.furniture;
  if (c.includes('matteress') || c.includes('mattress') || c.includes('bed')) return CATEGORY_PLACEHOLDER_IMAGES.bed;
  return null;
}

/**
 * @param {string} [type] product.type (bed, accessory, furniture, sofacumbed, deal, …)
 * @param {string} [categoryHint] e.g. order metadata category label
 * @returns {string}
 */
export function getCategoryPlaceholderImage(type, categoryHint = '') {
  const normalized = normalizeCatalogType(type);
  if (normalized) return CATEGORY_PLACEHOLDER_IMAGES[normalized];
  const t = String(type || '').toLowerCase().trim();
  if (t === 'deal' || t === 'deals') return GENERIC_PRODUCT_PLACEHOLDER;
  const fromHint = placeholderFromCategoryText(categoryHint);
  if (fromHint) return fromHint;
  return GENERIC_PRODUCT_PLACEHOLDER;
}
