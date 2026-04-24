'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CiShoppingCart, CiHeart } from 'react-icons/ci';
import { FaRegEye } from "react-icons/fa6";
import { FiArrowRight } from 'react-icons/fi';
import { openSans } from '../Font/font';
import ProductModal from '../Components/ProductModal';
import { useCart } from '../Providers/CartProvider';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { API_BASE } from '../../lib/apiBase';
import { applyCategoryDiscount, discountsArrayToMap } from '../../lib/categoryDiscounts';

/** Single placeholder until `image` / `image_urls` exist in Supabase */
const PLACEHOLDER_IMAGE = '/laptop-category.jpg';

const placeholderImage = {
  laptop: PLACEHOLDER_IMAGE,
  printer: '/printer-category.png',
  bed: PLACEHOLDER_IMAGE,
  accessory: PLACEHOLDER_IMAGE,
  furniture: PLACEHOLDER_IMAGE,
  sofacumbed: PLACEHOLDER_IMAGE,
};

function shuffleInPlace(array) {
  const a = array;
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parsePrice(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const digits = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(digits);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/** `image_urls` jsonb: array, or JSON string; matches Cloudynap Supabase DDL. */
function normalizeImageUrlList(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((u) => (typeof u === 'string' ? u.trim() : typeof u === 'number' ? String(u) : ''))
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return normalizeImageUrlList(parsed);
    } catch {
      /* single URL */
    }
    return [t];
  }
  return [];
}

function normalizeFeaturedProduct(item) {
  if (!item) return null;
  const type = String(item.type || 'bed').toLowerCase();
  const rawId = item.id != null ? String(item.id) : '';
  const fromImageUrls = normalizeImageUrlList(item.image_urls);
  const imageArray =
    fromImageUrls.length > 0 ? fromImageUrls : normalizeImageUrlList(item.imageUrls);
  const image =
    imageArray[0] ||
    (typeof item.image === 'string' && item.image.trim() ? item.image.trim() : null) ||
    placeholderImage[type] ||
    PLACEHOLDER_IMAGE;
  const priceValue = parsePrice(item.price);
  const oldPriceValue = parsePrice(item.old_price);
  const rawDesc = typeof item.description === 'string' ? item.description.trim() : '';
  const desc =
    rawDesc ||
    [item.features, item.series, item.fabric].filter(Boolean).join(' • ') ||
    'View product details';

  const priceDisplay =
    typeof item.price === 'string' && item.price.trim()
      ? item.price.trim()
      : priceValue > 0
        ? priceValue.toLocaleString('en-PK')
        : '—';

  return {
    id: item.id,
    name: item.name || 'Product',
    desc,
    price: priceDisplay,
    oldPrice: oldPriceValue ? oldPriceValue.toLocaleString('en-PK') : null,
    rating: Number(item.rating) || 4.5,
    reviews: Number(item.reviews) || 0,
    image,
    imageUrls: imageArray.length ? imageArray : [image],
    rawPrice: priceValue,
    type,
    cartId: rawId ? `${type}-${rawId}` : `${type}-${item.name || 'product'}`,
  };
}

function applyBatchDiscount(norm, discountMap) {
  const d = applyCategoryDiscount(norm.type, norm.rawPrice, discountMap);
  if (!d) return norm;
  if (d.badgeOnly) {
    return {
      ...norm,
      label: { text: d.badgeText, color: 'bg-red-600' },
    };
  }
  return {
    ...norm,
    oldPrice: norm.rawPrice.toLocaleString('en-PK'),
    price: d.discounted.toLocaleString('en-PK'),
    rawPrice: d.discounted,
    label: { text: d.badgeText, color: 'bg-red-600' },
  };
}

const renderStars = (rating) => {
  const safeRating = typeof rating === 'number' ? rating : 4.5;
  const stars = [];
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<span key={`full-${i}`}>★</span>);
  }
  if (hasHalfStar) {
    stars.push(<span key="half">☆</span>);
  }
  for (let i = stars.length; i < 5; i++) {
    stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
  }
  return stars;
};

const FeaturedProductCard = ({ product, onPreview, onAddToCart }) => {
  const productType = (product.type || 'laptop').toLowerCase();
  const productId = product.id ? encodeURIComponent(product.id) : '';
  const href = productId
    ? `/product/${productId}?type=${encodeURIComponent(productType)}`
    : '/all-products';
  const images = Array.isArray(product.imageUrls) && product.imageUrls.length
    ? product.imageUrls
    : [product.image || placeholderImage[productType] || PLACEHOLDER_IMAGE];
  useImagePreloader(images);
  const [activeImage, setActiveImage] = useState(0);

  const handlePrev = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  const handleDotSelect = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage(index);
  };

  return (
    <Link
      href={href}
      className="relative bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer flex flex-col"
    >
      {product.label && (
        <div className={`absolute top-2 left-2 ${product.label.color} text-white text-xs font-bold px-2 py-1 rounded z-10`}>
          {product.label.text}
        </div>
      )}

      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-white rounded-full p-2 hover:bg-gray-100">
          <CiHeart className="text-lg" />
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onAddToCart?.(product);
          }}
          className="bg-white rounded-full p-2 hover:bg-gray-100"
        >
          <CiShoppingCart className="text-lg" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onPreview?.(product);
          }}
          className="bg-white rounded-full p-2 hover:bg-gray-100"
        >
          <FaRegEye className="text-lg" />
        </button>
      </div>

      <div className="relative w-full h-40 flex items-center justify-center p-4 bg-white">
        <Image
          src={images[activeImage] || placeholderImage[productType] || PLACEHOLDER_IMAGE}
          alt={product.name}
          width={160}
          height={160}
          className="object-contain max-h-full max-w-full"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 hover:bg-white"
              aria-label="Previous product image"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 hover:bg-white"
              aria-label="Next product image"
            >
              <FaChevronRight className="text-xs" />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/80 rounded-full px-2 py-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(event) => handleDotSelect(event, index)}
                  className={`w-2 h-2 rounded-full transition ${
                    index === activeImage ? 'bg-[#00aeef]' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Show image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-yellow-400 mb-2 text-sm">
          {renderStars(product.rating)}
          <span className="text-gray-600 text-xs ml-1">({product.reviews})</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">{product.desc}</p>
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-gray-900">
            {String(product.price).trim().toLowerCase().startsWith('rs') ? product.price : `Rs. ${product.price}`}
          </span>
          {product.oldPrice && (
            <span className="text-sm text-gray-400 line-through">Rs. {product.oldPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

const FeaturedProducts = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    let cancelled = false;

    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const [res, discRes] = await Promise.all([
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/discounts`),
        ]);
        if (!res.ok) throw new Error('Failed to load products');
        const payload = await res.json();
        const discPayload = discRes.ok ? await discRes.json().catch(() => ({})) : {};
        const discountMap = discountsArrayToMap(discPayload.discounts);
        if (cancelled) return;
        const rows = Array.isArray(payload) ? payload : [];
        const normalized = rows
          .map(normalizeFeaturedProduct)
          .filter(Boolean)
          .map((n) => applyBatchDiscount(n, discountMap));
        shuffleInPlace(normalized);
        setFeatured(normalized.slice(0, 8));
      } catch (error) {
        console.error('Featured products fetch error:', error);
        if (!cancelled) setFeatured([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`w-full py-8 lg:py-12 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Banner */}
          <div className="lg:col-span-1">
            <div className="bg-linear-to-b from-blue-900 to-black rounded-lg overflow-hidden h-full">
              <div className="p-6 text-white">
                <p className="text-xs uppercase tracking-wide mb-2">Cloudy Nap</p>
                <h2 className="text-3xl font-bold mb-2">Featured picks</h2>
                <p className="text-lg mb-4">From our catalog</p>
                
                <div className="bg-gray-800 p-3 rounded mb-4">
                  <p className="text-xs text-center">Offers ends in: DD : HH : MM : SS</p>
                </div>
                
                <button className="w-full bg-[#00aeef] hover:bg-[#0099d9] text-white py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                  SHOP NOW
                  <FiArrowRight />
                </button>
              </div>
              
              <div className="mt-4 overflow-hidden flex justify-center items-end h-112">
                <Image
                  src="/stacked-laptops.jpg"
                  alt="Featured collection"
                  width={600}
                  height={600}
                  className="object-contain w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Right Products Grid */}
          <div className="lg:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
                {/* <p className="text-sm text-gray-500 mt-1">Eight random items from our range — refreshed on each visit</p> */}
              </div>
              <a
                href="/all-products"
                className="text-[#00aeef] hover:text-[#0099d9] font-medium flex items-center gap-2 md:ml-auto shrink-0"
              >
                Browse all products
                <FiArrowRight />
              </a>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg overflow-hidden animate-pulse bg-gray-100 h-72"
                  />
                ))}
              </div>
            ) : featured.length === 0 ? (
              <p className="text-gray-500 text-sm py-8">No products to show yet. Check your API and Supabase connection.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {featured.map((product) => (
                  <FeaturedProductCard
                    key={product.cartId || `${product.type}-${product.id}`}
                    product={product}
                    onPreview={(item) => {
                      setSelectedProduct(item);
                      setIsModalOpen(true);
                    }}
                    onAddToCart={(item) => {
                      if (!item) return;
                      addToCart({
                        id: item.cartId || `${item.type}-${item.id}`,
                        name: item.name,
                        price: Number(item.rawPrice || 0),
                        image: item.image,
                        type: item.type,
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
};

export default FeaturedProducts;

