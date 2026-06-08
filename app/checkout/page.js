'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiShield } from 'react-icons/fi';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { openSans } from '../Cx/Font/font';
import { useCart } from '../Cx/Providers/CartProvider';
import { API_BASE } from '../lib/apiBase';

const formatCurrency = (value) => {
  const numeric = Number(value) || 0;
  return `PKR ${numeric.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
};

const paymentMethods = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    image: '/cod.png',
    helper: 'Pay when the order arrives at your doorstep.',
  },
];

const formatCardNumber = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ').trim();
};

const formatExpiry = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  const month = digits.slice(0, 2);
  const year = digits.slice(2, 4);
  return `${month}/${year}`;
};

const CheckoutPage = () => {
  const router = useRouter();
  const { cartItems, cartSubtotal, clearCart } = useCart();
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState('');
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    country: '',
    region: '',
    city: '',
    zipCode: '',
    email: '',
    phone: '',
  });
  const [shipToDifferent, setShipToDifferent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cardInfo, setCardInfo] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: '',
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [checkoutAccountUserId, setCheckoutAccountUserId] = useState(null);
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : {};
      setCheckoutAccountUserId(parsed?.id ?? null);
    } catch {
      setCheckoutAccountUserId(null);
    }
  }, []);

  useEffect(() => {
    if (!appliedVoucher) return;
    setAppliedVoucher(null);
    setVoucherMessage('Cart changed — re-apply your voucher if needed.');
  }, [cartSubtotal]); // eslint-disable-line react-hooks/exhaustive-deps -- only reset when subtotal changes

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem('user');
        if (!stored) {
          setUserLoading(false);
          return;
        }

        const parsed = JSON.parse(stored);
        if (!parsed?.id) {
          setUserLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/users/${parsed.id}`);
        if (!response.ok) {
          throw new Error('Failed to load billing information.');
        }

        const data = await response.json();
        setBillingInfo((prev) => ({
          ...prev,
          firstName: data.first_name || prev.firstName,
          lastName: data.last_name || prev.lastName,
          company: data.company || prev.company,
          address: data.address || data.shipment_address || prev.address,
          country: data.country || prev.country || 'PK',
          region: data.province || prev.region,
          city: data.city || prev.city,
          zipCode: data.zip_code || prev.zipCode,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
        }));

        try {
          const cardsResponse = await fetch(
            `${API_BASE}/api/users/${parsed.id}/cards`,
          );
          if (cardsResponse.ok) {
            const cards = await cardsResponse.json();
            if (Array.isArray(cards) && cards.length) {
              const primaryCard = cards[0];
              setCardInfo((prev) => ({
                ...prev,
                name: primaryCard.name_on_card || prev.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                number: formatCardNumber(primaryCard.card_number || prev.number),
                expiry: formatExpiry(primaryCard.expiry || prev.expiry),
                cvc: primaryCard.cvc || prev.cvc,
              }));
            }
          }
        } catch (cardError) {
          console.error('Checkout card fetch error:', cardError);
        }
      } catch (error) {
        console.error('Checkout user fetch error:', error);
        setUserError(error.message || 'Failed to load saved billing information.');
      } finally {
        setUserLoading(false);
      }
    };

    loadUser();
  }, []);

  const taxAmount = useMemo(() => {
    if (appliedVoucher?.totals?.tax != null) {
      return Number(appliedVoucher.totals.tax) || 0;
    }
    return Math.round(cartSubtotal * 0.02);
  }, [cartSubtotal, appliedVoucher]);

  const voucherDiscount = useMemo(() => {
    if (appliedVoucher?.discount_amount != null) {
      return Number(appliedVoucher.discount_amount) || 0;
    }
    return 0;
  }, [appliedVoucher]);

  const total = useMemo(() => {
    if (appliedVoucher?.totals?.total != null) {
      return Number(appliedVoucher.totals.total) || 0;
    }
    return cartSubtotal + taxAmount;
  }, [cartSubtotal, taxAmount, appliedVoucher]);

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim();
    if (!code) {
      setVoucherMessage('Enter a voucher code.');
      return;
    }
    if (cartItems.length === 0) {
      setVoucherMessage('Add items to your cart before applying a voucher.');
      return;
    }

    setVoucherLoading(true);
    setVoucherMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/vouchers/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: cartSubtotal }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Invalid voucher code.');
      }
      setAppliedVoucher(data);
      setVoucherInput(data.voucher?.code || code);
      setVoucherMessage(`"${data.voucher?.name}" applied — ${data.voucher?.discount_percent}% off`);
    } catch (error) {
      setAppliedVoucher(null);
      setVoucherMessage(error.message || 'Could not apply voucher.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherMessage('');
  };

  const handleBillingChange = (field) => (event) => {
    setBillingInfo((prev) => ({ ...prev, [field]: event.target.value }));
    setStatusMessage('');
  };

  const handleCardChange = (field) => (event) => {
    const { value } = event.target;
    setCardInfo((prev) => ({
      ...prev,
      [field]:
        field === 'number'
          ? formatCardNumber(value)
          : field === 'expiry'
            ? formatExpiry(value)
            : value,
    }));
    setStatusMessage('');
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      setStatusMessage('Your cart is empty. Add a product before placing the order.');
      return;
    }

    if (!billingInfo.firstName || !billingInfo.lastName || !billingInfo.address || !billingInfo.phone) {
      setStatusMessage('Please fill in all required billing fields before placing the order.');
      return;
    }

    setOrderPlacing(true);
    setStatusMessage('');

    try {
      let accountUserId = null;
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        accountUserId = storedUser?.id ?? null;
      } catch {
        accountUserId = null;
      }

      const fullName = `${billingInfo.firstName} ${billingInfo.lastName}`.trim();

      const shippingAddressPayload = {
        name: fullName || undefined,
        first_name: billingInfo.firstName || undefined,
        last_name: billingInfo.lastName || undefined,
        line1: billingInfo.address || undefined,
        city: billingInfo.city || undefined,
        state: billingInfo.region || undefined,
        country: billingInfo.country || undefined,
        postal_code: billingInfo.zipCode || undefined,
        phone: billingInfo.phone || undefined,
        email: billingInfo.email || undefined,
      };

      const billingAddressPayload = {
        name: fullName || undefined,
        first_name: billingInfo.firstName || undefined,
        last_name: billingInfo.lastName || undefined,
        line1: billingInfo.address || undefined,
        city: billingInfo.city || undefined,
        state: billingInfo.region || undefined,
        country: billingInfo.country || undefined,
        postal_code: billingInfo.zipCode || undefined,
        phone: billingInfo.phone || undefined,
        email: billingInfo.email || undefined,
      };

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: accountUserId,
          status: paymentMethod === 'cod' ? 'pending' : 'in_progress',
          totals: {
            subtotal: cartSubtotal,
            tax: taxAmount,
            shipping: 0,
            discount: voucherDiscount,
            total,
          },
          ...(appliedVoucher?.voucher?.code
            ? { voucherCode: appliedVoucher.voucher.code }
            : {}),
          shippingAddress: shippingAddressPayload,
          billingAddress: billingAddressPayload,
          paymentMethod,
          orderNotes,
          customer: {
            firstName: billingInfo.firstName,
            lastName: billingInfo.lastName,
            name: fullName,
            email: billingInfo.email,
            phone: billingInfo.phone,
          },
          customerName: fullName,
          customerEmail: billingInfo.email,
          customerPhone: billingInfo.phone,
          items: cartItems.map((item) => {
            const metadata = { image: item.image };
            if (item.id != null) metadata.cartId = String(item.id);
            if (item.type) metadata.type = item.type;
            if (item.productType) metadata.productType = item.productType;
            return {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              metadata,
            };
          }),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to place order. Please try again.');
      }

      const result = await response.json();
      const orderId = result?.order?.id;
      const trackingNumber = result?.order?.tracking_number;
      if (typeof window !== 'undefined') {
        try {
          if (orderId) {
            window.localStorage.setItem('latestOrderId', orderId.toString());
          }
          if (trackingNumber) {
            window.localStorage.setItem('latestTrackingNumber', trackingNumber);
          }
        } catch (storageError) {
          console.error('Failed to store order confirmation:', storageError);
        }
      }

      clearCart();
      setOrderPlaced(true);
      setStatusMessage('Order placed successfully! Redirecting...');
      const confirmQuery = trackingNumber
        ? `tracking=${encodeURIComponent(trackingNumber)}`
        : orderId
          ? `orderId=${orderId}`
          : '';
      router.push(confirmQuery ? `/order-confirmation?${confirmQuery}` : '/order-confirmation');
    } catch (error) {
      console.error('Place order error:', error);
      setStatusMessage(error.message || 'Failed to place order.');
    } finally {
      setOrderPlacing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-white ${openSans.className}`}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#00aeef] transition">
              Home
            </Link>
            <span className="text-[#00aeef]">›</span>
            <Link href="/cart" className="hover:text-[#00aeef] transition">
              Your Cart
            </Link>
            <span className="text-[#00aeef]">›</span>
            <span className="text-[#00aeef] font-medium">Check Out</span>
          </nav>
        </div>
      </div>

      <main className="grow  py-12">
        <div className="container mx-auto px-4">
          <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-8">
              <section className="bg-white  rounded-xs  p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-4 mb-6">
                  <h1 className="text-lg font-bold text-gray-800">Billing Information</h1>
                  <span className="text-xs text-gray-500">
                    Fields marked with * are required.
                  </span>
                </div>

                {statusMessage && (
                  <div className="mb-6 rounded-xs border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {statusMessage}
                  </div>
                )}
                {!statusMessage && userError && (
                  <div className="mb-6 rounded-xs border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {userError}
                  </div>
                )}

                <div className="mb-6 rounded-xs border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {checkoutAccountUserId ? (
                    <span>You are signed in — this order will be linked to your account.</span>
                  ) : (
                    <span>
                      Guest checkout — no account required. We use your name, phone, and email below for delivery
                      and updates.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      First name *
                    </label>
                    <input
                      type="text"
                      value={billingInfo.firstName}
                      onChange={handleBillingChange('firstName')}
                      placeholder="First name"
                      className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      Last name *
                    </label>
                    <input
                      type="text"
                      value={billingInfo.lastName}
                      onChange={handleBillingChange('lastName')}
                      placeholder="Last name"
                      className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mt-4">
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      Company name <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={billingInfo.company}
                      onChange={handleBillingChange('company')}
                      placeholder="Company name"
                      className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={billingInfo.phone}
                      onChange={handleBillingChange('phone')}
                      placeholder="Phone number"
                      className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm  text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={billingInfo.address}
                    onChange={handleBillingChange('address')}
                    placeholder="Street address"
                    className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={billingInfo.country}
                      onChange={handleBillingChange('country')}
                      className="w-full rounded-xs border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="PK">Pakistan</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      Region/State *
                    </label>
                    <select
                      value={billingInfo.region}
                      onChange={handleBillingChange('region')}
                      className="w-full rounded-xs border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Sindh">Sindh</option>
                      <option value="KPK">Khyber Pakhtunkhwa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      City *
                    </label>
                    <select
                      value={billingInfo.city}
                      onChange={handleBillingChange('city')}
                      className="w-full rounded-xs border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Islamabad">Islamabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={billingInfo.zipCode}
                      onChange={handleBillingChange('zipCode')}
                      placeholder="Postal code"
                      className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm  text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={billingInfo.email}
                      onChange={handleBillingChange('email')}
                      placeholder="Email address"
                      className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                      required
                    />
                  </div>
                  <div className="flex items-start gap-3 pt-7">
                    <input
                      id="shipDifferent"
                      type="checkbox"
                      checked={shipToDifferent}
                      onChange={(event) => setShipToDifferent(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded-xs border border-gray-300 text-[#00aeef] focus:ring-[#00aeef]"
                    />
                    <label htmlFor="shipDifferent" className="text-sm text-gray-700">
                      Ship into different address
                    </label>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xs  p-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
                  <FiShield className="text-[#00aeef]" />
                  <h2 className="text-lg font-bold text-gray-800">Payment Option</h2>
                </div>

                <div className="flex items-center gap-3">
                  {paymentMethods.map((method) => {
                    const isActive = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center gap-3 border border-gray-200 rounded-xs px-4 py-4 text-sm transition ${
                          isActive ? 'bg-[#00aeef]/10 text-[#00aeef] border-[#00aeef]' : 'text-gray-600 hover:border-[#00aeef] hover:text-[#00aeef]'
                        }`}
                      >
                        <div className="h-6 w-6 relative">
                          <Image
                            src={method.image}
                            alt={method.label}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="leading-snug">{method.label}</span>
                        <div
                          className={`h-2 w-2 rounded-full border ${
                            isActive ? 'border-[#00aeef] bg-[#00aeef]' : 'border-gray-300 bg-white'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {paymentMethod !== 'card' && (
                  <p className="mt-5 text-sm text-gray-600">
                    You selected <span className=" text-gray-800">{paymentMethods.find((method) => method.id === paymentMethod)?.label}</span>. 
                    Our support team will reach out with instructions to complete the payment.
                  </p>
                )}

                {paymentMethod === 'card' && (
                  <div className="mt-6 grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm  text-gray-700 mb-2">
                        Name on Card *
                      </label>
                      <input
                        type="text"
                        value={cardInfo.name}
                        onChange={handleCardChange('name')}
                        placeholder="Full name as displayed on card"
                        className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm  text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardInfo.number}
                        onChange={handleCardChange('number')}
                        placeholder="XXXX XXXX XXXX XXXX"
                        className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm  text-gray-700 mb-2">
                          Expire Date *
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardInfo.expiry}
                          onChange={handleCardChange('expiry')}
                          className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm  text-gray-700 mb-2">
                          CVC *
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardInfo.cvc}
                          onChange={handleCardChange('cvc')}
                          className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white  rounded-xs  p-6">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-800">Additional Information</h2>
                  <p className="text-xs text-gray-500 mt-1">Order notes <span className="text-gray-400">(Optional)</span></p>
                </div>
                <textarea
                  value={orderNotes}
                  onChange={(event) => setOrderNotes(event.target.value)}
                  rows={4}
                  placeholder="Notes about your order, e.g. special notes for delivery."
                  className="w-full rounded-xs border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                />
              </section>
            </div>

            <aside className="bg-white border border-gray-200 rounded-xs  h-fit">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg  text-gray-800 mb-1">Order Summary</h2>
                <p className="text-xs text-gray-500">Review your order details before placing it.</p>
              </div>

              {orderPlaced ? (
                <div className="px-6 py-8 text-sm text-green-600 text-center">
                  Order confirmed! Redirecting you shortly...
                </div>
              ) : cartItems.length === 0 ? (
                <div className="px-6 py-8 text-sm text-center text-gray-600">
                  No products in your cart.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="hidden md:flex h-14 w-20 items-center justify-center rounded-xs bg-gray-100 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">
                            {(item.brand || item.model || 'LP').toString().slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-snug">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.quantity} ×{' '}
                          <span className="text-[#00aeef]">{formatCurrency(item.price)}</span>
                        </p>
                      </div>
                      <span className="text-sm text-gray-900">
                        {formatCurrency((Number(item.price) || 0) * (item.quantity || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-6 py-5 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Voucher code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => {
                        setVoucherInput(e.target.value.toUpperCase());
                        setVoucherMessage('');
                      }}
                      placeholder="Enter code"
                      disabled={!!appliedVoucher || voucherLoading || orderPlacing}
                      className="flex-1 rounded-xs border border-gray-200 px-3 py-2 text-sm font-mono uppercase text-gray-800 focus:outline-none focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20 disabled:bg-gray-50"
                    />
                    {appliedVoucher ? (
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="shrink-0 px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xs hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || orderPlacing || cartItems.length === 0}
                        className="shrink-0 px-3 py-2 text-sm font-semibold text-white bg-[#00aeef] rounded-xs hover:bg-[#0099d9] disabled:opacity-60"
                      >
                        {voucherLoading ? '…' : 'Apply'}
                      </button>
                    )}
                  </div>
                  {voucherMessage && (
                    <p
                      className={`mt-2 text-xs ${
                        appliedVoucher ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {voucherMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 py-5 space-y-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Sub-total</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Shipping</span>
                  <span className="text-green-500 ">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium text-gray-700">
                    Voucher discount
                    {appliedVoucher?.voucher?.discount_percent
                      ? ` (${appliedVoucher.voucher.discount_percent}%)`
                      : ''}
                  </span>
                  <span className={voucherDiscount > 0 ? 'text-green-600 font-medium' : ''}>
                    {voucherDiscount > 0 ? `−${formatCurrency(voucherDiscount)}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Tax</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-base  text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="px-6 py-5 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={cartItems.length === 0 || orderPlacing || orderPlaced}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xs bg-[#00aeef] px-5 py-3 text-sm  text-white hover:bg-[#0099d9] disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {orderPlacing ? 'PLACING ORDER...' : 'PLACE ORDER'} <FiArrowRight className="text-base" />
                </button>
              </div>
            </aside>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
