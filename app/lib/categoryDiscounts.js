/**
 * Client helpers for category batch discounts (matches GET /api/discounts).
 */

export function discountsArrayToMap(discounts) {
  const map = {};
  if (!Array.isArray(discounts)) return map;
  for (const d of discounts) {
    if (d?.category) {
      map[d.category] = { discount_percent: Number(d.discount_percent) };
    }
  }
  return map;
}

export function parsePriceForDiscount(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'bigint') {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (typeof value === 'string') {
    const digits = value.replace(/[^0-9.-]/g, '');
    const n = Number(digits);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

/**
 * @param {string} catalogType - bed | accessory | furniture | sofacumbed
 * @param {number|string} rawPrice - product list price
 * @param {Record<string, { discount_percent: number }>} discountMap
 */
export function applyCategoryDiscount(catalogType, rawPrice, discountMap) {
  const rule = discountMap?.[catalogType];
  if (!rule) return null;
  const pct = Number(rule.discount_percent);
  if (!Number.isFinite(pct) || pct <= 0) return null;

  const base = parsePriceForDiscount(rawPrice);
  if (base === null) {
    return {
      badgeText: `${Math.round(pct)}% OFF!`,
      badgeOnly: true,
      discounted: null,
      original: null,
    };
  }

  const discounted = Math.max(0, Math.round(base * (1 - pct / 100)));
  return {
    badgeText: `${Math.round(pct)}% OFF!`,
    badgeOnly: false,
    original: base,
    discounted,
  };
}

/**
 * Apply active category discount to list/carousel products that use numeric `price`
 * and optionally string `priceDisplay` (accessories / sofa cum bed sections).
 */
export function mergeListProductDiscount(product, discountMap) {
  if (!product) return product;
  const type = String(product.type || 'bed').toLowerCase();
  const d = applyCategoryDiscount(type, product.price, discountMap);
  if (!d) return product;
  const discountLabel = { text: d.badgeText, color: 'bg-red-600' };
  if (d.badgeOnly) {
    return { ...product, label: discountLabel };
  }
  const merged = {
    ...product,
    price: d.discounted,
    label: discountLabel,
    oldPriceNumeric: d.original,
  };
  if (Object.prototype.hasOwnProperty.call(product, 'priceDisplay')) {
    merged.priceDisplay = d.discounted.toLocaleString('en-PK');
    merged.oldPriceDisplay = d.original.toLocaleString('en-PK');
  }
  return merged;
}
