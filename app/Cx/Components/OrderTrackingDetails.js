'use client';

import React from 'react';
import {
  FiCheckCircle,
  FiPackage,
  FiTruck,
  FiClock,
  FiPhone,
  FiMail,
  FiShoppingBag,
} from 'react-icons/fi';
import {
  ACTIVITY_BADGE_STYLES,
  buildOrderDetailActivity,
  buildOrderDetailTimeline,
  formatCurrency,
  formatOrderDate,
} from '../../lib/orderTracking';

const STEP_ICONS = {
  placed: FiShoppingBag,
  processing: FiPackage,
  in_transit: FiTruck,
  delivered: FiCheckCircle,
};

const ACTIVITY_ICONS = {
  placed: FiCheckCircle,
  processing: FiPackage,
  in_transit: FiTruck,
  delivered: FiCheckCircle,
};

export default function OrderTrackingDetails({ order }) {
  if (!order) return null;

  const timeline = buildOrderDetailTimeline(order.status, STEP_ICONS);
  const activeIndex = timeline.findIndex((step) => step.current);
  const denominator = Math.max(1, timeline.length - 1);
  const normalizedIndex = activeIndex >= 0 ? activeIndex : 0;
  const progressPercent = Math.min(100, Math.max(0, (normalizedIndex / denominator) * 100));
  const activity = buildOrderDetailActivity(order);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Tracking #{order.trackingNumber || order.number}
          </p>
          {order.trackingNumber && order.id != null && (
            <p className="mt-1 text-xs text-gray-500">Internal order ref: #{order.id}</p>
          )}
          <p className="mt-2 text-sm text-gray-700">
            {order.items.length} Product{order.items.length === 1 ? '' : 's'} • Order placed on{' '}
            <span className="font-semibold text-gray-900">{formatOrderDate(order.placedAt)}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                ACTIVITY_BADGE_STYLES[order.statusBadge] || 'border-blue-200 bg-blue-50 text-blue-600'
              }`}
            >
              {order.statusBadge || 'In Progress'}
            </span>
            {order.rawStatus && (
              <span className="text-xs text-gray-500 capitalize">
                Current status: {order.rawStatus.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total amount</p>
          <p className="text-3xl font-bold text-blue-500 mt-2">{formatCurrency(order.total)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="mt-2 px-2">
          <div className="relative h-1 bg-blue-100 rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            {timeline.map((step, index) => {
              const Icon = step.icon || FiCheckCircle;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                      step.completed
                        ? 'border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-200'
                        : 'border-blue-100 bg-white text-blue-200'
                    }`}
                  >
                    <Icon className="text-lg" />
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      step.completed ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[11px] text-gray-400">Step {index + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Order Activity</h3>
        {activity.map((entry, index) => {
          const Icon = ACTIVITY_ICONS[entry.id] || FiClock;
          return (
            <div
              key={entry.id || index}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                entry.completed
                  ? 'border-emerald-200 bg-emerald-50'
                  : entry.current
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-100 bg-gray-50'
              }`}
            >
              <span
                className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full border ${
                  entry.completed
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-500'
                    : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                <Icon className="text-sm" />
              </span>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="text-sm text-gray-800">{entry.label}</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      ACTIVITY_BADGE_STYLES[entry.statusBadge] || 'border-blue-200 bg-blue-50 text-blue-600'
                    }`}
                  >
                    {entry.statusBadge}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Product ({order.items.length.toString().padStart(2, '0')})
          </h3>
          <p className="text-sm text-gray-500">Items in this order</p>
        </div>
        <div className="overflow-hidden border border-gray-200 rounded-xl">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Products</th>
                <th className="px-5 py-3 text-left font-semibold">Price</th>
                <th className="px-5 py-3 text-left font-semibold">Quantity</th>
                <th className="px-5 py-3 text-right font-semibold">Sub-total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {order.items.map((item) => (
                <tr key={item.id || item.name}>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 max-w-md">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{formatCurrency(item.price)}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">x{item.quantity}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-full md:w-72 ml-auto space-y-1 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.voucherCode && order.voucherDiscount > 0 && (
            <div className="flex items-center justify-between text-green-700">
              <span>Voucher ({order.voucherCode})</span>
              <span className="font-semibold">−{formatCurrency(order.voucherDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Tax</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(order.shippingCost)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2 text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Billing Address</h3>
          <div className="text-sm text-gray-700 leading-6 space-y-1">
            {order.billing.name && <p className="font-semibold text-gray-900">{order.billing.name}</p>}
            {order.billing.lines.length > 0 ? (
              order.billing.lines.map((line, index) => <p key={index}>{line}</p>)
            ) : (
              <p className="text-gray-500">No billing address provided.</p>
            )}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            {order.billing.phone && (
              <p className="flex items-center gap-2">
                <FiPhone /> {order.billing.phone}
              </p>
            )}
            {order.billing.email && (
              <p className="flex items-center gap-2">
                <FiMail /> {order.billing.email}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Shipping Address</h3>
          <div className="text-sm text-gray-700 leading-6 space-y-1">
            {order.shipping.name && <p className="font-semibold text-gray-900">{order.shipping.name}</p>}
            {order.shipping.lines.length > 0 ? (
              order.shipping.lines.map((line, index) => <p key={index}>{line}</p>)
            ) : (
              <p className="text-gray-500">No shipping address provided.</p>
            )}
          </div>
          {order.shipping.phone && (
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-2">
                <FiPhone /> {order.shipping.phone}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Order Notes</h3>
          <p className="text-sm text-gray-700 leading-6">
            {order.notes || 'No special instructions were provided for this order.'}
          </p>
        </div>
      </div>
    </div>
  );
}
