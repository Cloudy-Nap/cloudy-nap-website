'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { openSans } from '../Cx/Font/font';
import { API_BASE } from '../lib/apiBase';
import { normalizeTrackingNumberInput } from '../lib/orderTracking';

const OrderConfirmationContent = () => {
  const [status, setStatus] = useState('loading'); // loading | success | failure
  const [orderInfo, setOrderInfo] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const queryTracking =
      searchParams.get('tracking') ||
      searchParams.get('trackingNumber') ||
      searchParams.get('tracking_number');
    const queryOrderId = searchParams.get('orderId');

    let trackingRaw = queryTracking;
    if (!trackingRaw) {
      trackingRaw = window.localStorage.getItem('latestTrackingNumber') || '';
    }

    const normalizedTracking = normalizeTrackingNumberInput(trackingRaw);

    const fetchByTracking = async (trackingNumber) => {
      const response = await fetch(
        `${API_BASE}/api/orders/track/${encodeURIComponent(trackingNumber)}`,
      );
      if (!response.ok) throw new Error('Order not found');
      return response.json();
    };

    const fetchById = async (id) => {
      const response = await fetch(`${API_BASE}/api/orders/${id}`);
      if (!response.ok) throw new Error('Order not found');
      return response.json();
    };

    const load = async () => {
      try {
        let data = null;

        if (normalizedTracking) {
          data = await fetchByTracking(normalizedTracking);
        } else if (queryOrderId) {
          const parsedId = Number(queryOrderId);
          if (Number.isFinite(parsedId) && parsedId > 0) {
            data = await fetchById(parsedId);
          }
        } else {
          const storedId = window.localStorage.getItem('latestOrderId') || '';
          const parsedId = Number(storedId);
          if (Number.isFinite(parsedId) && parsedId > 0) {
            data = await fetchById(parsedId);
          }
        }

        if (!data) {
          setStatus('failure');
          return;
        }

        setOrderInfo({
          orderId: data.id,
          trackingNumber: data.tracking_number || null,
          total: data.total,
          createdAt: data.created_at,
          status: data.status,
        });
        setStatus('success');
      } catch (error) {
        console.error('Fetch order confirmation error:', error);
        setStatus('failure');
      } finally {
        if (!queryTracking && !queryOrderId) {
          window.localStorage.removeItem('latestOrderId');
          window.localStorage.removeItem('latestTrackingNumber');
        }
      }
    };

    load();
  }, [searchParams]);

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="text-center text-sm text-gray-500">
          Checking order status...
        </div>
      );
    }

    if (status === 'failure') {
      return (
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-3xl">
            <FiAlertTriangle />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Order not completed
            </h1>
            <p className="text-sm text-gray-600 max-w-md">
              We could not find a recent order confirmation. Please return to your cart and try again.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xs border border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white transition text-sm font-semibold"
            >
              Return to Cart
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xs bg-[#00aeef] text-white hover:bg-[#0099d9] transition text-sm font-semibold"
            >
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    const trackHref = orderInfo?.trackingNumber
      ? `/track-your-order?tracking=${encodeURIComponent(orderInfo.trackingNumber)}`
      : '/track-your-order';

    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-full border-4 border-green-200 bg-green-50 text-green-500 flex items-center justify-center text-4xl">
          <FiCheckCircle />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Your order is successfully placed
          </h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Thank you for shopping with us. Save your tracking number below to check status anytime.
          </p>
        </div>
        {orderInfo && (
          <div className="text-sm text-gray-600 space-y-2 w-full max-w-sm">
            {orderInfo.trackingNumber ? (
              <p className="rounded-lg border border-[#00aeef]/30 bg-sky-50 px-4 py-3">
                <span className="block text-xs font-semibold uppercase tracking-wide text-[#0099d9] mb-1">
                  Tracking number
                </span>
                <span className="font-mono text-lg font-bold text-gray-900 tracking-wider">
                  {orderInfo.trackingNumber}
                </span>
              </p>
            ) : (
              <p>
                <span className="font-semibold text-gray-900">Order ID:</span> #{orderInfo.orderId ?? '—'}
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-900">Total:</span>{' '}
              PKR {(Number(orderInfo.total) || 0).toLocaleString('en-PK')}
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xs border border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef] hover:text-white transition text-sm font-semibold"
          >
            Go to Dashboard
          </Link>
          <Link
            href={trackHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xs bg-[#00aeef] text-white hover:bg-[#0099d9] transition text-sm font-semibold"
          >
            Track Order <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xs shadow-sm px-8 py-12">
      {renderContent()}
    </div>
  );
};

const OrderConfirmationPage = () => {
  return (
    <div className={`min-h-screen flex flex-col bg-white ${openSans.className}`}>
      <Navbar />
      <main className="grow flex items-center justify-center px-4 py-16">
        <Suspense fallback={<div className="text-sm text-gray-500">Checking order status...</div>}>
          <OrderConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmationPage;
