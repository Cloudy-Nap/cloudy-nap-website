import { getCategoryPlaceholderImage } from './categoryPlaceholders';

export const ORDER_DETAIL_STEPS = [
  { id: 'placed', label: 'Order Placed' },
  { id: 'processing', label: 'Packaging' },
  { id: 'in_transit', label: 'On The Road' },
  { id: 'delivered', label: 'Delivered' },
];

export const ORDER_STATUS_FLOW = [
  { step: 'delivered', badge: 'Completed', tokens: ['completed', 'delivered'] },
  {
    step: 'in_transit',
    badge: 'Completed',
    tokens: ['in_transit', 'on_the_road', 'on the road', 'road', 'transit', 'ship', 'shipped', 'out_for_delivery'],
  },
  { step: 'processing', badge: 'Processing', tokens: ['processing', 'processed', 'pack', 'packaging', 'packed', 'in_progress'] },
  { step: 'placed', badge: 'In Progress', tokens: ['placed', 'pending', 'initiated', 'created', 'order_placed'] },
];

export const STEP_STATUS_LABELS = {
  placed: 'In Progress',
  processing: 'Processing',
  in_transit: 'Completed',
  delivered: 'Completed',
};

export const ORDER_ACTIVITY_TEXT = {
  placed: 'Your order has been placed successfully. Thank you for shopping with us!',
  processing: 'Our warehouse team is packaging your order carefully.',
  in_transit: 'Your order is on the way to you.',
  delivered: 'Your order has been delivered successfully.',
};

export const ACTIVITY_BADGE_STYLES = {
  'In Progress': 'border-blue-200 bg-blue-50 text-blue-600',
  Processing: 'border-amber-200 bg-amber-50 text-amber-600',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-600',
};

export const formatCurrency = (value) =>
  `PKR ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

export const formatOrderDate = (dateString, includeTime = true) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    hour: includeTime ? 'numeric' : undefined,
    minute: includeTime ? 'numeric' : undefined,
  });
};

const TRACKING_PREFIX = 'CN-';

/** Normalize tracking number for lookup (uppercase, CN- prefix). */
export const normalizeTrackingNumberInput = (value) => {
  const trimmed = String(value || '').trim().toUpperCase();
  if (!trimmed) return null;

  if (/^CN-[A-Z0-9]{6,14}$/.test(trimmed)) {
    return trimmed;
  }

  const alnum = trimmed.replace(/[^A-Z0-9]/g, '');
  if (alnum.length >= 6 && alnum.length <= 14) {
    return alnum.startsWith('CN') && alnum.length > 2
      ? `CN-${alnum.slice(2)}`
      : `${TRACKING_PREFIX}${alnum}`;
  }

  return null;
};

export const getOrderStatusMeta = (status) => {
  const normalized = status ? status.toString().toLowerCase() : '';
  for (const entry of ORDER_STATUS_FLOW) {
    if (entry.tokens.some((token) => normalized.includes(token))) {
      return entry;
    }
  }
  return ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.length - 1];
};

export const normalizeOrderDetailStatus = (status) => getOrderStatusMeta(status).step;

export const normalizeOrderDetailAddress = (address, fallbackName = '') => {
  if (!address) {
    return { name: fallbackName, lines: [], phone: '', email: '' };
  }

  if (typeof address === 'string') {
    try {
      const parsed = JSON.parse(address);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeOrderDetailAddress(parsed, fallbackName);
      }
    } catch {
      /* unstructured string */
    }
    const lines = address
      .split(/\r?\n|,/)
      .map((line) => line.trim())
      .filter(Boolean);
    return { name: fallbackName, lines, phone: '', email: '' };
  }

  const cityLine = [address.city, address.state, address.postal_code]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');

  const lines = [address.line1, address.line2, cityLine, address.country]
    .filter((line) => typeof line === 'string' && line.trim())
    .map((line) => line.trim());

  return {
    name: address.name || fallbackName,
    lines,
    phone: address.phone || '',
    email: address.email || '',
  };
};

const parseAmount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const sanitizeOrderDetailData = (raw) => {
  if (!raw) return null;
  const statusMeta = getOrderStatusMeta(raw.status || raw.order_status);
  const status = statusMeta.step;
  const items = Array.isArray(raw.order_items)
    ? raw.order_items.map((item) => {
        let metadata = item.metadata || {};
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch {
            metadata = {};
          }
        }
        const fallbackImage = getCategoryPlaceholderImage(
          metadata?.type,
          metadata?.category || item.category,
        );
        const quantity = parseAmount(item.quantity || 1) || 1;
        const price = parseAmount(item.price || 0);
        return {
          id: item.id,
          name: item.name || item.product_name || metadata.name || 'Product',
          description: item.description || metadata.description || '',
          price,
          quantity,
          subtotal: price * quantity,
          image: item.image || metadata.image || fallbackImage,
        };
      })
    : [];

  return {
    rawStatus: raw.status || raw.order_status || '',
    statusBadge: statusMeta.badge,
    id: raw.id,
    trackingNumber: raw.tracking_number || null,
    number: raw.tracking_number || raw.order_number || raw.id,
    status,
    placedAt: raw.created_at || raw.createdAt || null,
    expectedDelivery: raw.expected_delivery || raw.expectedDelivery || null,
    subtotal: parseAmount(raw.subtotal || raw.total || 0),
    tax: parseAmount(raw.tax),
    shippingCost: parseAmount(raw.shipping),
    total: parseAmount(raw.total || raw.totalamount || 0),
    notes: raw.notes || raw.order_notes || '',
    items,
    billing: normalizeOrderDetailAddress(
      raw.billing_address || raw.billingAddress || raw.billing,
      raw.customer_name || raw.user?.name || '',
    ),
    shipping: normalizeOrderDetailAddress(
      raw.shipping_address || raw.shippingAddress || raw.shipping,
      raw.customer_name || raw.user?.name || '',
    ),
    customer: raw.user || {
      name: raw.customer_name || '',
      email: raw.user_email || raw.email || '',
      phone: raw.user_phone || raw.phone || '',
    },
  };
};

export const buildOrderDetailTimeline = (status, stepIcons = {}) => {
  const normalized = normalizeOrderDetailStatus(status);
  const activeIndex = ORDER_DETAIL_STEPS.findIndex((step) => step.id === normalized);
  return ORDER_DETAIL_STEPS.map((step, index) => ({
    ...step,
    icon: stepIcons[step.id],
    completed: activeIndex >= 0 ? index <= activeIndex : index === 0,
    current: activeIndex >= 0 ? index === activeIndex : index === 0,
  }));
};

export const buildOrderDetailActivity = (order) => {
  if (!order) return [];
  const timeline = buildOrderDetailTimeline(order.status);
  const activeIndex = timeline.findIndex((step) => step.current);
  return timeline.map((step, index) => ({
    id: step.id,
    label: ORDER_ACTIVITY_TEXT[step.id] || step.label,
    timestamp: index === 0 ? order.placedAt : order.expectedDelivery,
    completed: index <= activeIndex,
    current: index === activeIndex,
    statusBadge: STEP_STATUS_LABELS[step.id] || 'In Progress',
  }));
};
