'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiAlertCircle, FiRefreshCw, FiSearch } from 'react-icons/fi';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import OrderTrackingDetails from '../Cx/Components/OrderTrackingDetails';
import { openSans } from '../Cx/Font/font';
import { API_BASE } from '../lib/apiBase';
import { parseOrderIdInput, sanitizeOrderDetailData } from '../lib/orderTracking';

function TrackYourOrderContent() {
  const searchParams = useSearchParams();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lookupOrder = useCallback(async (rawId) => {
    const orderId = parseOrderIdInput(rawId);
    if (!orderId) {
      setError('Please enter a valid order ID (e.g. 1042).');
      setOrder(null);
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No order found with that ID. Check the number and try again.');
        }
        throw new Error('Unable to load order details. Please try again.');
      }
      const data = await response.json();
      setOrder(sanitizeOrderDetailData(data));
      setOrderIdInput(String(orderId));
    } catch (err) {
      console.error('Track order error:', err);
      setError(err.message || 'Failed to find order.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('orderId');
    if (fromUrl) {
      setOrderIdInput(fromUrl.replace(/^#/, ''));
      lookupOrder(fromUrl);
    }
  }, [searchParams, lookupOrder]);

  const handleSubmit = (event) => {
    event.preventDefault();
    lookupOrder(orderIdInput);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${openSans.className}`}>
      <Navbar />

      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#00aeef] transition">
              Home
            </Link>
            <span className="text-gray-500">›</span>
            <span className="text-[#00aeef]">Track Your Order</span>
          </nav>
        </div>
      </div>

      <main className="grow py-10">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Track Your Order</h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter the order ID from your confirmation email or receipt to see status and details.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4"
          >
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
              Order ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="orderId"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 1042"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#00aeef] hover:bg-[#0099d9] text-white font-semibold transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Looking up…
                  </>
                ) : (
                  <>
                    <FiSearch />
                    Track Order
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              No login required. You can also find your order ID on the{' '}
              <Link href="/order-confirmation" className="text-[#00aeef] hover:underline">
                order confirmation
              </Link>{' '}
              page after checkout.
            </p>
          </form>

          {loading && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-sm text-gray-500">
              <FiRefreshCw className="mx-auto text-2xl animate-spin mb-3" />
              Loading order details…
            </div>
          )}

          {!loading && error && (
            <div className="bg-white border border-red-200 rounded-lg shadow-sm p-8 text-center text-sm text-red-600">
              <FiAlertCircle className="mx-auto text-2xl mb-3" />
              {error}
            </div>
          )}

          {!loading && order && <OrderTrackingDetails order={order} />}

          <p className="text-center text-sm text-gray-500">
            Have an account?{' '}
            <Link href="/profile?tab=track" className="text-[#00aeef] hover:underline font-medium">
              View all orders in your profile
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TrackYourOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <TrackYourOrderContent />
    </Suspense>
  );
}
