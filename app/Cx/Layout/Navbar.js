'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaLinkedin,
  FaYoutube,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import { 
  CiShoppingCart,
  CiHeart,
  CiUser,
  CiHome,
  CiPhone,
  CiSearch,
  CiMenuBurger,
  CiMenuFries,
  CiBoxes
} from 'react-icons/ci';
import { MdOutlineBed, MdWeekend, MdChair, MdOutlineShoppingBag, MdLocalOffer } from 'react-icons/md';
import { GiPillow } from 'react-icons/gi';
import ShoppingCartPopup from '../Components/ShoppingCartPopup';
import LoginPopup from '../Components/LoginPopup';
import { useCart } from '../Providers/CartProvider';
import { API_BASE } from '../../lib/apiBase';
import { getCategoryPlaceholderImage } from '../../lib/categoryPlaceholders';


const Navbar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isAllProductsHovered, setIsAllProductsHovered] = useState(false);
  const { cartCount } = useCart();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const parseNumeric = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };

  const extractPrimaryImage = (item) => {
    if (!item) return getCategoryPlaceholderImage('bed');
    const candidates = [
      item.imageUrls,
      item.image_urls,
      item.images,
      item.imageurls,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length) {
        const found = candidate.find((url) => typeof url === 'string' && url.trim() !== '');
        if (found) return found;
      }
    }
    if (typeof item.image === 'string' && item.image.trim()) {
      return item.image.trim();
    }
    return getCategoryPlaceholderImage(item.type, item.category);
  };

  const formatPrice = (value) => {
    const numeric = parseNumeric(value, 0);
    return `PKR ${numeric.toLocaleString('en-PK')}`;
  };

  const normalizeProduct = (item) => {
    if (!item) return null;
    const inferredType =
      item?.type ||
      (typeof item?.category === 'string' && item.category.toLowerCase().includes('printer')
        ? 'printer'
        : 'bed');
    return {
      id: item.id || item.sourceId || null,
      name: item.name || 'Unnamed Product',
      brand: item.brand || '',
      model: item.model || '',
      price: item.price || 0,
      image: extractPrimaryImage(item),
      type: inferredType,
      category:
        item.category ||
        (inferredType === 'printer' ? 'Printers' : inferredType === 'bed' ? 'Matteress' : 'Laptops'),
    };
  };

  const performSearch = async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = new URL(`${API_BASE}/api/products`);
      // Map category names to API category values
      if (selectedCategory === 'Laptops' || selectedCategory === 'Refurbished Laptops') {
        url.searchParams.set('category', 'laptop');
      } else if (selectedCategory === 'Printers' || selectedCategory === 'Toners' || selectedCategory === 'Cartridges') {
        url.searchParams.set('category', 'printer');
      }
      // Note: LED Monitors, Desktop PCs, Scanners, etc. don't have specific API filters yet
      // They will search all products

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      const data = await response.json();
      const products = Array.isArray(data) ? data : [];
      
      const normalizedQuery = query.trim().toLowerCase();
      
      // Filter by category first
      let categoryFiltered = products.map(normalizeProduct).filter(Boolean);
      
      if (selectedCategory !== 'All Categories') {
        // Map category selection to product types/categories
        if (selectedCategory === 'Laptops' || selectedCategory === 'Refurbished Laptops') {
          categoryFiltered = categoryFiltered.filter((product) => 
            product.type === 'laptop' || product.category === 'Laptops'
          );
        } else if (selectedCategory === 'Printers' || selectedCategory === 'Toners' || selectedCategory === 'Cartridges') {
          categoryFiltered = categoryFiltered.filter((product) => 
            product.type === 'printer' || product.category === 'Printers'
          );
        } else {
          // For categories without products (Desktop PCs, LED Monitors, etc.), return empty
          // This prevents showing laptops/printers when searching in categories that don't exist
          categoryFiltered = [];
        }
      }
      
      // Then filter by search query
      const filtered = categoryFiltered
        .filter((product) => {
          const searchableText = [
            product.name,
            product.brand,
            product.model,
            product.category,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return searchableText.includes(normalizedQuery);
        })
        .slice(0, 8); // Limit to 8 results

      setSearchResults(filtered);
      setIsSearchDropdownOpen(true); // Always show dropdown when there are results or when searching
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setIsSearchDropdownOpen(true); // Still show dropdown to display "No products found"
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search is cleared, close dropdown
    if (!value.trim()) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    // Show dropdown immediately when typing (will show loading state)
    setIsSearching(true);
    setIsSearchDropdownOpen(true);

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    // Don't redirect on Enter - just show dropdown if there are results
    if (searchTerm.trim() && searchResults.length > 0) {
      setIsSearchDropdownOpen(true);
    } else if (searchTerm.trim()) {
      // If no results but there's a search term, perform search
      performSearch(searchTerm);
    }
  };

  const handleViewAllResults = () => {
    if (!searchTerm.trim()) return;
    
    const params = new URLSearchParams();
    params.set('search', searchTerm.trim());
    
    if (selectedCategory !== 'All Categories') {
      // Map category names to API category values
      if (selectedCategory === 'Laptops' || selectedCategory === 'Refurbished Laptops') {
        params.set('category', 'laptop');
      } else if (selectedCategory === 'Printers' || selectedCategory === 'Toners' || selectedCategory === 'Cartridges') {
        params.set('category', 'printer');
      }
      // Note: Other categories will search all products
    }
    
    router.push(`/all-products?${params.toString()}`);
    setIsCategoryDropdownOpen(false);
    setIsSearchDropdownOpen(false);
  };

  const handleResultClick = (product) => {
    setIsSearchDropdownOpen(false);
    setSearchTerm('');
    router.push(`/product/${product.id}?type=${product.type}`);
  };

  const categories = [
    'All Categories',
    'Laptops',
    'Printers & Scanners',
    'LED Monitors',
    'Toners',
    'Desktop PCs',
    'Cartridges',
    'Scanners',
    'Refurbished Laptops',
    'Refurbished Desktop PCs',
    'Computer Accessories'
  ];

  const allProductsSubcategories = [
    { label: 'Matteress', slug: 'matteress', Icon: MdOutlineBed },
    { label: 'Pillows', slug: 'pillows', Icon: GiPillow },
    { label: 'Accessories', slug: 'accessories', Icon: MdOutlineShoppingBag },
    { label: 'Sofa Cum Bed', slug: 'sofa-cum-bed', Icon: MdWeekend },
    { label: 'Furniture', slug: 'furniture', Icon: MdChair },
  ];

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Trigger search when category changes and search term exists
  useEffect(() => {
    if (searchTerm.trim()) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      performSearch(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('user');
      if (!stored) {
        setCurrentUser(null);
        return;
      }
      const parsed = JSON.parse(stored);
      setCurrentUser(parsed);
    } catch (error) {
      console.error('Failed to read user from storage:', error);
      setCurrentUser(null);
    }
  }, []);

  const userInitials = useMemo(() => {
    if (!currentUser) return null;
    const nameParts = [currentUser.first_name, currentUser.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (!nameParts) {
      return (currentUser.email || 'U').charAt(0).toUpperCase();
    }
    return nameParts
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [currentUser]);

  const handleLogout = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('session');
    setCurrentUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="w-full">
      {/* Top Bar - Welcome & Social Media */}
      <div className="bg-[#d3eaf7] text-[#1a2f4a] py-2 px-3 sm:px-5 hidden md:flex items-center justify-between border-b border-sky-200/80">
        <div className="flex items-center">
          <span className="text-sm font-medium">Welcome to Cloudynap.</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
          <span className="text-sm">Follow us:</span>
          <div className="flex items-center gap-3">
            <Link href="https://www.facebook.com/hitekcomputer" target="_blank" rel="noopener noreferrer" className="text-[#1a2f4a] hover:text-[#00aeef] transition"><FaFacebook className="cursor-pointer" /></Link>
            <Link href="https://www.instagram.com/hitek_computers" target="_blank" rel="noopener noreferrer" className="text-[#1a2f4a] hover:text-[#00aeef] transition"><FaInstagram className="cursor-pointer" /></Link>
            <Link href="https://www.tiktok.com/@hi_tek_computers" target="_blank" rel="noopener noreferrer" className="text-[#1a2f4a] hover:text-[#00aeef] transition"><FaTiktok className="cursor-pointer" /></Link>
            <Link href="https://www.linkedin.com/company/hitek-computers/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="text-[#1a2f4a] hover:text-[#00aeef] transition"><FaLinkedin className="cursor-pointer" /></Link>
            <Link href="https://www.youtube.com/@HiTek_Computers" target="_blank" rel="noopener noreferrer" className="text-[#1a2f4a] hover:text-[#00aeef] transition"><FaYoutube className="cursor-pointer" /></Link>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 border border-slate-400/40 rounded cursor-pointer hover:bg-white/60 transition">
            <span className="text-sm">Eng</span>
            <FaChevronDown className="text-xs" />
          </div>
          <div className="flex items-center gap-2 px-2 py-1 border border-slate-400/40 rounded cursor-pointer hover:bg-white/60 transition">
            <span className="text-sm">PKR</span>
            <FaChevronDown className="text-xs" />
          </div>
        </div>
      </div>

      {/* Middle Bar - Logo, Search & Icons */}
      <div className="bg-white text-[#1a2f4a] py-4 px-3 lg:px-5 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-row items-center lg:justify-between gap-4 lg:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/">
            <Image 
              src="/new-logo.png" 
              alt="Cloudynap" 
              width={256} 
              height={88}
              className="object-contain h-9 w-auto sm:h-10 max-h-10"
              priority
              unoptimized
            />
            </Link>
          </div>

          {/* Mobile Menu Toggle - Only visible on mobile */}
          <button 
            type="button"
            className="lg:hidden text-2xl text-[#1a2f4a] shrink-0 ml-auto" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <CiMenuFries /> : <CiMenuBurger />}
          </button>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden lg:flex flex-1">
            <div className="w-full max-w-2xl mx-auto relative z-50">
              <div className="flex rounded overflow-visible relative">
                <div className="relative z-10">
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="bg-gray-300 text-gray-700 px-4 py-[14px] flex items-center gap-2 border-r border-gray-400 hover:bg-gray-400 transition whitespace-nowrap"
                  >
                    <span className="text-sm font-medium">{selectedCategory}</span>
                    <FaChevronDown className={`text-xs transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCategoryDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[45]" 
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-[60] min-w-[180px]">
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsCategoryDropdownOpen(false);
                              if (searchTerm.trim()) {
                                performSearch(searchTerm);
                              }
                            }}
                            className={`w-full text-left px-4 text-black py-2 text-sm hover:bg-gray-100 transition ${
                              selectedCategory === category ? 'bg-gray-100 font-medium' : ''
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 relative z-10">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    onFocus={() => {
                      if (searchTerm.trim() && (searchResults.length > 0 || isSearching)) {
                        setIsSearchDropdownOpen(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSubmit(e);
                      }
                    }}
                    placeholder="Search for anything..." 
                    className="w-full px-4 py-3 text-gray-900 bg-white focus:outline-none"
                  />
                  {isSearchDropdownOpen && searchTerm.trim() && (
                    <>
                      <div 
                        className="fixed inset-0 z-[45]" 
                        onClick={() => setIsSearchDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-xl z-[60] max-h-96 overflow-y-auto w-full">
                        {isSearching ? (
                          <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            Searching...
                          </div>
                        ) : searchResults.length > 0 ? (
                          <>
                            {searchResults.map((product) => (
                              <button
                                key={`${product.type}-${product.id}`}
                                type="button"
                                onClick={() => handleResultClick(product)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                                  <Image
                                    src={product.image || getCategoryPlaceholderImage(product.type, product.category)}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{product.name}</div>
                                  <div className="text-sm text-gray-500 truncate">
                                    {product.brand} {product.model ? `• ${product.model}` : ''}
                                  </div>
                                  <div className="text-sm font-semibold text-[#00aeef] mt-1">
                                    {formatPrice(product.price)}
                                  </div>
                                </div>
                              </button>
                            ))}
                            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                              <button
                                type="button"
                                onClick={handleViewAllResults}
                                className="w-full text-center text-sm text-[#00aeef] hover:underline font-medium"
                              >
                                View all results
                              </button>
                            </div>
                          </>
                        ) : searchTerm.trim() ? (
                          <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            No products found
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={handleViewAllResults}
                  className="bg-white text-gray-700 px-4 py-3 hover:bg-gray-100 transition shrink-0"
                >
                  <CiSearch className="text-xl" />
                </button>
              </div>
            </div>
          </div>

          {/* Icons */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div 
              className="relative"
              onMouseEnter={() => setIsCartHovered(true)}
              onMouseLeave={() => setIsCartHovered(false)}
            >
              <Link href="/cart">
                <CiShoppingCart className="text-2xl cursor-pointer hover:text-[#00aeef] transition" />
              </Link>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#00aeef] text-white text-[11px] leading-none rounded-full min-h-5 min-w-5 px-1.5 py-1 inline-flex items-center justify-center font-bold tabular-nums">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
              {isCartHovered && (
                <>
                  {/* Invisible bridge to maintain hover across the gap */}
                  <div 
                    className="absolute top-full right-0 w-full h-2 pointer-events-auto z-40"
                    onMouseEnter={() => setIsCartHovered(true)}
                  />
                  <ShoppingCartPopup 
                    isOpen={isCartHovered} 
                    onClose={() => setIsCartHovered(false)}
                  />
                </>
              )}
            </div>
            <CiHeart className="text-2xl cursor-pointer hover:text-[#00aeef] transition" />
            <div 
              className="relative"
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
            >
              {currentUser ? (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-slate-200 transition text-[#1a2f4a]">
                  {userInitials}
                </div>
              ) : (
                <CiUser className="text-2xl cursor-pointer hover:text-[#00aeef] transition" />
              )}
              {isProfileHovered && (
                <>
                  <div 
                    className="absolute top-full right-0 w-full h-2 pointer-events-auto z-40"
                    onMouseEnter={() => setIsProfileHovered(true)}
                  />
                  {currentUser ? (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 text-sm text-gray-700"
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setIsProfileHovered(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <LoginPopup 
                      isOpen={isProfileHovered} 
                      onClose={() => setIsProfileHovered(false)} 
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Navigation - Hidden on mobile */}
      <div className="hidden lg:block bg-[#d3eaf7] text-[#1a2f4a] border-b border-sky-200/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-5">
          <div className="flex flex-row items-center justify-between flex-nowrap gap-2 lg:gap-4 min-w-0">
            {/* Desktop Navigation */}
            <div className="flex items-center shrink-0 min-w-0 flex-wrap lg:flex-nowrap">
              <a href="/" className="flex items-center gap-1.5 px-2.5 py-3 bg-transparent hover:bg-sky-300/50 transition shrink-0 whitespace-nowrap">
                <CiHome className="text-2xl shrink-0" />
                <span className="text-sm font-medium">Home</span>
              </a>
              <div
                className="relative shrink-0"
                onMouseEnter={() => setIsAllProductsHovered(true)}
                onMouseLeave={() => setIsAllProductsHovered(false)}
              >
                <Link
                  href="/all-products"
                  className={`flex items-center gap-1.5 px-2.5 py-3 transition whitespace-nowrap shrink-0 ${
                    isAllProductsHovered ? 'bg-sky-300/50' : 'hover:bg-sky-300/50'
                  }`}
                >
                  <span className="text-sm font-medium">All Products</span>
                  <FaChevronDown className="text-xs shrink-0" />
                </Link>

                {isAllProductsHovered && (
                  <div className="absolute top-full left-0 mt-0 min-w-[260px] bg-white border border-gray-200 shadow-lg rounded-sm z-50 py-1">
                    <Link
                      href="/all-products?subcategory=deals"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 transition"
                    >
                      <MdLocalOffer className="text-xl shrink-0 text-[#1a2f4a]/80" aria-hidden />
                      <span>Deals</span>
                    </Link>
                    {allProductsSubcategories.map(({ label, slug, Icon }) => (
                      <Link
                        key={slug}
                        href={`/all-products?subcategory=${encodeURIComponent(slug)}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 transition"
                      >
                        <Icon className="text-xl shrink-0 text-[#1a2f4a]/80" aria-hidden />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/all-products?subcategory=deals"
                className="flex items-center gap-1.5 px-2 lg:px-2.5 py-3 hover:bg-sky-300/50 transition shrink-0 whitespace-nowrap"
              >
                <MdLocalOffer className="text-2xl shrink-0" aria-hidden />
                <span className="text-sm font-medium">Deals</span>
              </Link>

              {allProductsSubcategories.map(({ label, slug, Icon }) => (
                <Link
                  key={slug}
                  href={`/all-products?subcategory=${encodeURIComponent(slug)}`}
                  className="flex items-center gap-1.5 px-2 lg:px-2.5 py-3 hover:bg-sky-300/50 transition shrink-0 whitespace-nowrap"
                >
                  <Icon className="text-2xl shrink-0" aria-hidden />
                  <span className="text-sm font-medium">{label}</span>
                  <FaChevronDown className="text-xs shrink-0" />
                </Link>
              ))}
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-1.5 pl-2 ml-1 sm:pl-3 sm:ml-2 py-3 border-l border-slate-400/50 shrink-0 whitespace-nowrap">
              <CiPhone className="shrink-0 text-lg" />
              <span className="font-medium text-sm tracking-tight">+92-213-2410225</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div 
          className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Menu Header */}
          <div className="bg-white text-[#1a2f4a] p-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
            <Image 
              src="/new-logo.png" 
              alt="Cloudynap" 
              width={224} 
              height={80}
              className="object-contain h-8 w-auto max-h-8"
              unoptimized
            />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-2xl hover:text-gray-300 transition"
            >
              <CiMenuFries />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex flex-col">
            {/* Search Bar in Mobile Menu */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative z-50">
                <div className="flex rounded overflow-visible relative">
                  <div className="relative z-10">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="bg-gray-300 text-gray-700 px-3 py-2 text-xs flex items-center gap-2 border-r border-gray-400 hover:bg-gray-400 transition whitespace-nowrap"
                    >
                      <span className="text-xs font-medium">{selectedCategory}</span>
                      <FaChevronDown className={`text-xs transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCategoryDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[45]" 
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-[60] min-w-[180px]">
                          {categories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category);
                                setIsCategoryDropdownOpen(false);
                                if (searchTerm.trim()) {
                                  performSearch(searchTerm);
                                }
                              }}
                              className={`w-full text-left px-4 text-black py-2 text-sm hover:bg-gray-100 transition ${
                                selectedCategory === category ? 'bg-gray-100 font-medium' : ''
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 relative z-10">
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      onFocus={() => {
                        if (searchTerm.trim() && (searchResults.length > 0 || isSearching)) {
                          setIsSearchDropdownOpen(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchSubmit(e);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      placeholder="Search..." 
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none"
                    />
                    {isSearchDropdownOpen && searchTerm.trim() && (
                      <>
                        <div 
                          className="fixed inset-0 z-[45]" 
                          onClick={() => setIsSearchDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-xl z-[60] max-h-96 overflow-y-auto w-full">
                          {isSearching ? (
                            <div className="px-4 py-3 text-center text-gray-500 text-sm">
                              Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            <>
                              {searchResults.map((product) => (
                                <button
                                  key={`${product.type}-${product.id}`}
                                  type="button"
                                  onClick={() => {
                                    handleResultClick(product);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-100 transition flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                                    <Image
                                      src={product.image || getCategoryPlaceholderImage(product.type, product.category)}
                                      alt={product.name}
                                      width={48}
                                      height={48}
                                      className="object-contain"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate text-sm">{product.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {product.brand} {product.model ? `• ${product.model}` : ''}
                                    </div>
                                    <div className="text-xs font-semibold text-[#00aeef] mt-1">
                                      {formatPrice(product.price)}
                                    </div>
                                  </div>
                                </button>
                              ))}
                              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleViewAllResults();
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="w-full text-center text-sm text-[#00aeef] hover:underline font-medium"
                                >
                                  View all results
                                </button>
                              </div>
                            </>
                          ) : searchTerm.trim() ? (
                            <div className="px-4 py-3 text-center text-gray-500 text-sm">
                              No products found
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      handleViewAllResults();
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-white text-gray-700 px-3 py-2 hover:bg-gray-100 transition shrink-0"
                  >
                    <CiSearch className="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            {/* User Account Section */}
            <div className="p-4 border-b border-gray-200">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00aeef] flex items-center justify-center text-sm font-semibold text-white">
                    {userInitials}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{currentUser.name || currentUser.email || 'User'}</div>
                    <div className="text-xs text-gray-500">Account</div>
                  </div>
                  <Link 
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm text-[#00aeef]"
                  >
                    View Profile
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsProfileHovered(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded transition"
                >
                  <CiUser className="text-2xl text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Login / Sign Up</span>
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-200 grid grid-cols-3 gap-2">
              <Link 
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded transition text-center"
              >
                <div className="relative">
                  <CiShoppingCart className="text-2xl text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#00aeef] text-white text-[11px] leading-none rounded-full min-h-5 min-w-5 px-1.5 py-1 inline-flex items-center justify-center font-bold tabular-nums">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-700">Cart</span>
              </Link>
              <button className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded transition text-center">
                <CiHeart className="text-2xl text-gray-700" />
                <span className="text-xs text-gray-700">Wishlist</span>
              </button>
              <div className="flex flex-col items-center gap-2 p-3">
                <CiPhone className="text-2xl text-gray-700" />
                <span className="text-xs text-gray-700">Call</span>
                <a href="tel:+922132410225" className="text-xs text-[#00aeef] font-medium">+92-213-2410225</a>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col">
              <a 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <CiHome className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Home</span>
              </a>
              <Link
                href="/all-products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <CiBoxes className="text-xl text-gray-700" />
                <span className="text-sm font-medium text-gray-900">All Products</span>
                <FaChevronRight className="ml-auto text-gray-400 text-sm" aria-hidden />
              </Link>
              <Link
                href="/all-products?subcategory=deals"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <MdLocalOffer className="text-xl shrink-0 text-gray-700" aria-hidden />
                <span className="text-sm font-medium text-gray-900">Deals</span>
                <FaChevronRight className="ml-auto text-gray-400 text-sm" aria-hidden />
              </Link>
              {allProductsSubcategories.map(({ label, slug, Icon }) => (
                <Link
                  key={slug}
                  href={`/all-products?subcategory=${encodeURIComponent(slug)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <Icon className="text-xl shrink-0 text-gray-700" aria-hidden />
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <FaChevronRight className="ml-auto text-gray-400 text-sm" aria-hidden />
                </Link>
              ))}
            </div>

            {/* Logout Button if logged in */}
            {currentUser && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;