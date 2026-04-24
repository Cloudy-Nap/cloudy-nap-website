'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiSettings,
  FiTrendingUp,
  FiClipboard,
  FiBell,
  FiLogOut,
  FiPercent,
  FiGift,
} from 'react-icons/fi';
import { API_BASE } from '../../lib/apiBase';

const formatNumber = (value) => {
  const numeric = Number(value || 0);
  return numeric.toLocaleString('en-PK');
};

/** Match CMS orders page status normalization */
const normalizeOrderStatus = (status) => {
  if (!status) return 'pending';
  const s = String(status).toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('complete')) return 'completed';
  if (s.includes('process')) return 'processing';
  return 'pending';
};

const buildStatsFromMetrics = (metrics) => [
  {
    label: 'Total Products',
    value: metrics.products,
    accent: 'from-[#00aeef] to-[#0284c7]',
    icon: FiBox,
  },
  {
    label: 'Pending Orders',
    value: metrics.pendingOrders,
    accent: 'from-[#f97316] to-[#fb7185]',
    icon: FiClipboard,
  },
  {
    label: 'Fulfilled Orders',
    value: metrics.fulfilledOrders,
    accent: 'from-[#22c55e] to-[#10b981]',
    icon: FiTrendingUp,
  },
  {
    label: 'Registered Customers',
    value: metrics.customers,
    accent: 'from-[#a855f7] to-[#6366f1]',
    icon: FiUsers,
  },
];

const emptyMetrics = { products: 0, pendingOrders: 0, fulfilledOrders: 0, customers: 0 };

const fallbackActivities = [
  { id: 1, message: 'Added a new mattress listing to the catalog.', timestamp: '2 hours ago' },
  { id: 2, message: 'Order #10234 marked as fulfilled.', timestamp: '3 hours ago' },
  { id: 3, message: 'Updated sofa cum bed gallery images.', timestamp: 'Yesterday' },
];

const navigationItems = [
  { id: 'overview', label: 'Overview', href: '/cms/dashboard', icon: FiHome, page: 'dashboard' },
  { id: 'products', label: 'Products', href: '/cms/products', icon: FiBox, page: 'products' },
  { id: 'orders', label: 'Orders', href: '/cms/orders', icon: FiShoppingCart, page: 'orders' },
  { id: 'inventory', label: 'Inventory', href: '/cms/inventory', icon: FiPackage, page: 'inventory' },
  { id: 'customers', label: 'Customers', href: '/cms/customers', icon: FiUsers, page: 'customers' },
  { id: 'discounts', label: 'Discounts', href: '/cms/discounts', icon: FiPercent, page: 'discounts' },
  { id: 'deals', label: 'Deals', href: '/cms/deals', icon: FiGift, page: 'deals' },
  { id: 'settings', label: 'Settings', href: '/cms/settings', icon: FiSettings, page: 'settings' },
];

const quickActions = [
  {
    id: 'create-product',
    label: 'Add new product',
    href: '/cms/products/add-product',
    description: 'Create and publish a product listing',
    accent: 'from-[#0ea5e9] to-[#38bdf8]',
    icon: FiBox,
  },
  {
    id: 'review-orders',
    label: 'Review latest orders',
    href: '/cms/orders',
    description: 'Track new and pending purchases',
    accent: 'from-[#f97316] to-[#fb7185]',
    icon: FiShoppingCart,
  },
  {
    id: 'sync-inventory',
    label: 'Catalog overview',
    href: '/cms/inventory',
    description: 'Review Cloudynap SKUs and pricing',
    accent: 'from-[#22c55e] to-[#10b981]',
    icon: FiPackage,
  },
  {
    id: 'view-analytics',
    label: 'Accounts',
    href: '/cms/settings',
    description: 'Manage CMS accounts',
    accent: 'from-[#a855f7] to-[#6366f1]',
    icon: FiUsers,
  },
];

const CmsDashboardPage = () => {
  const router = useRouter();
  const [cmsUser, setCmsUser] = useState(null);
  const [stats, setStats] = useState(() => buildStatsFromMetrics(emptyMetrics));
  const [statsLoading, setStatsLoading] = useState(true);
  const [activities, setActivities] = useState(fallbackActivities);
  const [activeItem, setActiveItem] = useState('overview');

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const storedUser = window.localStorage.getItem('cmsUser');
      const storedSession = window.localStorage.getItem('cmsSession');

      if (!storedUser || !storedSession) {
        router.replace('/cms/auth/login');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      
      // Ensure accesspages is set (fallback for existing users)
      if (!parsedUser.accesspages || !Array.isArray(parsedUser.accesspages)) {
        if (parsedUser.role === 'admin') {
          parsedUser.accesspages = [
            'dashboard',
            'products',
            'orders',
            'inventory',
            'customers',
            'discounts',
            'deals',
            'settings',
          ];
        } else {
          parsedUser.accesspages = [];
        }
      }
      
      setCmsUser(parsedUser);

      fetchActivities();
      fetchDashboardMetrics();

    } catch (error) {
      console.error('Failed to parse CMS session:', error);
      router.replace('/cms/auth/login');
    }
  }, [router]);

  const fetchDashboardMetrics = async () => {
    setStatsLoading(true);
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/products`),
        fetch(`${API_BASE}/api/orders`),
        fetch(`${API_BASE}/api/users`),
      ]);

      let products = 0;
      if (productsRes.ok) {
        const data = await productsRes.json();
        products = Array.isArray(data) ? data.length : 0;
      }

      let pendingOrders = 0;
      let fulfilledOrders = 0;
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data)) {
          for (const order of data) {
            const st = normalizeOrderStatus(order.status);
            if (st === 'completed') {
              fulfilledOrders += 1;
            } else if (st !== 'cancelled') {
              pendingOrders += 1;
            }
          }
        }
      }

      let customers = 0;
      if (usersRes.ok) {
        const data = await usersRes.json();
        customers = Array.isArray(data) ? data.length : 0;
      }

      setStats(
        buildStatsFromMetrics({
          products,
          pendingOrders,
          fulfilledOrders,
          customers,
        }),
      );
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      setStats(buildStatsFromMetrics(emptyMetrics));
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/cms/activities?limit=3`);
      
      if (!response.ok) {
        console.error('Failed to fetch activities');
        return;
      }
      
      const data = await response.json();
      
      // Map API data to display format
      const mappedActivities = (data || []).map((activity) => {
        const formatTimestamp = (timestamp) => {
          if (!timestamp) return 'Unknown';
          const date = new Date(timestamp);
          const now = new Date();
          const diffInMs = now.getTime() - date.getTime();
          const diffInSeconds = Math.floor(diffInMs / 1000);
          const diffInMinutes = Math.floor(diffInSeconds / 60);
          const diffInHours = Math.floor(diffInMinutes / 60);
          const diffInDays = Math.floor(diffInHours / 24);

          if (diffInSeconds < 60) {
            return 'Just now';
          } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
          } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
          } else if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
          } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        };

        return {
          id: activity.id,
          message: activity.action,
          timestamp: formatTimestamp(activity.created_at),
        };
      });

      setActivities(mappedActivities.length > 0 ? mappedActivities : fallbackActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      // Keep fallback activities on error
    }
  };

  const displayName = useMemo(() => {
    if (!cmsUser) return 'Administrator';
    return (
      cmsUser.full_name ||
      cmsUser.name ||
      cmsUser.username ||
      cmsUser.user_name ||
      cmsUser.email ||
      'Administrator'
    );
  }, [cmsUser]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('cmsUser');
      window.localStorage.removeItem('cmsSession');
    }
    router.push('/cms/auth/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-slate-100">
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-72 bg-linear-to-b from-[#111827]/80 via-[#312e81]/95 to-[#1e1b4b]/95 backdrop-blur-xl border-r border-white/10 min-h-screen sticky top-0">
          <div className="px-7 py-8 border-b border-white/10">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-slate-300">
              <FiBell className="text-[#38bdf8]" />
              Control Center
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">CMS Dashboard</h1>
            <p className="text-xs text-slate-400 mt-2">Manage products, orders, and insights with ease.</p>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigationItems
              .filter((item) => {
                // If no user loaded yet, show all (will be filtered once user loads)
                if (!cmsUser) return true;
                // Admin has access to all pages (case-insensitive check)
                const userRole = (cmsUser.role || '').toLowerCase();
                if (userRole === 'admin') return true;
                // Check if user has access to this page
                const accessPages = Array.isArray(cmsUser.accesspages) ? cmsUser.accesspages : [];
                return accessPages.includes(item.page);
              })
              .map((item, key) => {
                const isActive = activeItem === item.id;
                const Icon = item.icon;
                return (
                  <Link key={key} href={item.href}><button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${
                      isActive
                        ? 'bg-linear-to-r from-[#38bdf8] to-[#6366f1] text-white shadow-lg shadow-[#6366f1]/40'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="text-lg" />
                    <span>{item.label}</span>
                  </button></Link>
                );
              })}
          </nav>

          <div className="px-7 py-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-linear-to-br from-[#38bdf8] to-[#6366f1] text-white font-semibold flex items-center justify-center shadow-lg shadow-[#38bdf8]/40">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-slate-300">Administrator</p>
              </div>
            </div>
            
          </div>
        </aside>

        <div className="flex-1">
          <header className="bg-linear-to-r from-[#1f2937]/80 via-[#312e81]/80 to-[#1f2937]/80 backdrop-blur-md border-b border-white/10 shadow-lg">
            <div className="px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Today</p>
                <h2 className="mt-1 text-3xl font-semibold text-white">Dashboard Overview</h2>
                <p className="text-sm text-slate-200 mt-2">
                  Welcome back, <span className="font-semibold text-white">{displayName}</span>. Let’s keep everything running smoothly.
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-4 py-2.5 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition shadow-lg shadow-black/10"
                >
                  View Storefront
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2.5 bg-linear-to-r from-[#38bdf8] to-[#6366f1] hover:from-[#0ea5e9] hover:to-[#4338ca] text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-[#6366f1]/40"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <main className="px-6 py-10 space-y-10">
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {stats.map((stat, index) => {
                const Icon = stat.icon || FiTrendingUp;
                return (
                  <div
                    key={`${stat.label}-${index}`}
                    className={`relative overflow-hidden rounded-2xl p-6 shadow-xl border border-white/10 bg-linear-to-br ${stat.accent}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_55%)] opacity-70" />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/80">{stat.label}</p>
                        <p className="mt-3 text-3xl font-bold text-white">
                          {statsLoading ? '—' : formatNumber(stat.value)}
                        </p>
                      </div>
                      <span className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Icon className="text-xl text-white" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 xl:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                  <Link
                    href="/cms/auth/login"
                    className="text-sm text-[#38bdf8] hover:text-[#60a5fa] font-medium transition"
                  >
                    Manage CMS Users
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action, key) => {
                    const Icon = action.icon;
                    const buttonContent = (
                      <button
                        key={action.id}
                        className={`relative overflow-hidden rounded-xl border border-white/10 bg-linear-to-br ${action.accent} text-left p-5 transition transform hover:-translate-y-1 hover:shadow-2xl w-full`}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_55%)] opacity-80" />
                        <div className="relative flex items-start gap-4">
                          <span className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Icon className="text-xl text-white" />
                          </span>
                          <div>
                            <span className="text-sm font-semibold text-white block">{action.label}</span>
                            <span className="text-xs text-white/80">{action.description}</span>
                          </div>
                        </div>
                      </button>
                    );

                    return action.href ? (
                      <Link key={key} href={action.href}>
                        {buttonContent}
                      </Link>
                    ) : (
                      <div key={key}>
                        {buttonContent}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                  <Link
                    href="/cms/recent-activity"
                    className="text-sm text-[#38bdf8] hover:text-[#60a5fa] font-medium transition"
                  >
                    View Activity
                  </Link>
                </div>
                <ul className="space-y-5">
                  {activities.map((item) => (
                    <li key={item.id} className="pb-4 border-b border-white/10 last:pb-0 last:border-b-0">
                      <p className="text-sm text-white/90">{item.message}</p>
                      <span className="text-xs text-white/60">{item.timestamp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            
          </main>
        </div>
      </div>
    </div>
  );
};

export default CmsDashboardPage;

