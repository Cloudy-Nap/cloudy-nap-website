'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  BadgeCheck,
  ShieldCheck,
  MapPinned,
  Shield,
  Award,
  Users,
  ThumbsUp,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { openSans } from '../Font/font';

const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/Diamond+Supreme+Foam+(CLOUDYNAP)/@24.8864082,67.0638874,761m/data=!3m1!1e3!4m8!3m7!1s0x3eb33f005c988d77:0xd0dcddb87f515bd6!8m2!3d24.8864034!4d67.0664677!9m1!1b1!16s%2Fg%2F11z2vxgf3s?entry=ttu&g_ep=EgoyMDI2MDYwMy4xIKXMDSoASAFQAw%3D%3D';

const RATING_ONLY_FALLBACKS = [
  'Outstanding quality and service — a 5-star experience all the way.',
  'Highly satisfied with the products and the helpful, professional team.',
  'Excellent value and genuine Diamond Foam quality. Would recommend to anyone.',
  'A smooth, trustworthy shopping experience from start to finish.',
  'Great prices, authentic products, and staff who really know their stuff.',
];

const googleReviews = [
  {
    name: 'Faizan Farooq',
    time: '3 days ago',
    rating: 5,
    isNew: true,
    text: 'Great service. Sales person very professional. They give you complete guidance regarding product — this is the best choice at all. Alhumdulillah',
  },
  {
    name: 'Shiraz Sabzwari',
    time: '46 minutes ago',
    rating: 5,
    isNew: true,
    text: 'Good service, very professional and cooperative staff. Highly recommend!',
  },
  {
    name: 'Abdul Ahad',
    time: 'an hour ago',
    rating: 5,
    isNew: true,
    text: 'Professional Service, Amazing!',
  },
  {
    name: 'Haseeb Hamid',
    time: 'an hour ago',
    rating: 5,
    isNew: true,
    text: 'Very good experience.',
  },
  {
    name: 'JuLia _Arts',
    time: 'an hour ago',
    rating: 5,
    isNew: true,
    text: 'Fair price with Excellent Quality',
  },
  {
    name: 'Shahzaib Khan',
    time: 'a day ago',
    rating: 5,
    isNew: true,
    text: RATING_ONLY_FALLBACKS[0],
  },
  {
    name: 'Aisha Uddin',
    time: '2 days ago',
    rating: 5,
    isNew: true,
    text: RATING_ONLY_FALLBACKS[1],
  },
  {
    name: 'Ayan Shahid',
    time: '3 days ago',
    rating: 5,
    isNew: true,
    text: RATING_ONLY_FALLBACKS[2],
  },
  {
    name: 'Maham Osama',
    time: '2 weeks ago',
    rating: 5,
    isNew: false,
    text: RATING_ONLY_FALLBACKS[3],
  },
  {
    name: 'Daniyal Ahad',
    time: '4 weeks ago',
    rating: 5,
    isNew: false,
    text: RATING_ONLY_FALLBACKS[4],
  },
  
];

const headerTrustItems = [
  { icon: BadgeCheck, label: 'Google Verified' },
  { icon: ShieldCheck, label: 'Authentic Reviews' },
  { icon: MapPinned, label: 'Trusted Across Pakistan' },
];

const trustHighlights = [
  {
    icon: Shield,
    title: '100% Authentic',
    description: 'All reviews are from real customers on Google',
  },
  {
    icon: Award,
    title: 'Top Rated Store',
    description: 'Highly rated by hundreds of customers across Pakistan',
  },
  {
    icon: Users,
    title: 'Trusted by Thousands',
    description: 'Join thousands of satisfied Cloudy Nap customers',
  },
];

const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : 'G');

const chunkReviews = (reviews, size = 3) => {
  const chunks = [];
  for (let i = 0; i < reviews.length; i += size) {
    chunks.push(reviews.slice(i, i + size));
  }
  return chunks;
};

const ReviewCard = ({ review, wide = false }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col ${
      wide ? 'w-full min-h-[160px]' : 'min-h-[220px]'
    }`}
  >
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center shrink-0">
          {getInitial(review.name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{review.name}</p>
          <p className="text-xs text-gray-500">{review.time}</p>
        </div>
      </div>
      <Image
        src="/google-icon.png"
        alt="Google review"
        width={22}
        height={22}
        className="object-contain shrink-0"
      />
    </div>

    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`w-4 h-4 ${
            index < review.rating
              ? 'text-[#fbbc04] fill-[#fbbc04]'
              : 'text-gray-200 fill-gray-200'
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>

    <p className={`text-gray-700 text-sm leading-relaxed flex-1 ${wide ? 'line-clamp-3 sm:line-clamp-none' : ''}`}>
      {review.text}
    </p>

    <div className="mt-4 pt-3 border-t border-gray-100">
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        <ThumbsUp className="w-3.5 h-3.5 text-[#00aeef]" strokeWidth={2.25} />
        Helpful
      </span>
    </div>
  </div>
);

const Testimonials = () => {
  const reviewSlides = useMemo(() => chunkReviews(googleReviews, 3), []);
  const [activeSlide, setActiveSlide] = useState(0);

  const goToSlide = (direction) => {
    setActiveSlide((current) => {
      const next = current + direction;
      if (next < 0) return reviewSlides.length - 1;
      if (next >= reviewSlides.length) return 0;
      return next;
    });
  };

  const currentReviews = reviewSlides[activeSlide] || [];
  const topReviews = currentReviews.slice(0, 2);
  const bottomReview = currentReviews[2];

  return (
    <div className={`w-full py-10 lg:py-16 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 shadow-sm mb-5">
            <Image src="/google-icon.png" alt="Google" width={18} height={18} className="object-contain" />
            <span className="text-sm font-medium text-gray-700">Google Verified Reviews</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Why Customers Love Cloudy Nap
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Real reviews from satisfied customers who trust our quality and service.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-5 text-sm text-gray-600">
            {headerTrustItems.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#00aeef] shrink-0" strokeWidth={2.25} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:sticky lg:top-6">
            <div className="flex justify-center mb-4">
              <Image src="/google-icon.png" alt="Google" width={48} height={48} className="object-contain" />
            </div>

            <p className="text-center text-4xl font-bold text-gray-900 mb-2">4.9 / 5</p>
            <div className="flex justify-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className="w-5 h-5 text-[#fbbc04] fill-[#fbbc04]"
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mb-5">Based on 500+ reviews</p>

            <div className="border-t border-gray-100 pt-5 mb-5">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <BadgeCheck className="text-[#00aeef] w-5 h-5 shrink-0" strokeWidth={2.25} />
                <span className="font-medium">Google Verified</span>
              </div>
            </div>

            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00aeef] hover:bg-[#0099d9] text-white font-semibold py-3 px-4 transition"
            >
              <Image src="/google-icon.png" alt="" width={18} height={18} className="object-contain brightness-0 invert" />
              Review Us
              <ExternalLink className="w-4 h-4" strokeWidth={2.25} />
            </a>
          </div>

          {/* Review carousel — 2 cards on top, 1 wide card below */}
          <div className="relative min-w-0">
            <div className="flex flex-col gap-4 transition-opacity duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topReviews.map((review) => (
                  <ReviewCard
                    key={`${review.name}-${review.time}`}
                    review={review}
                  />
                ))}
              </div>

              {bottomReview && (
                <ReviewCard
                  key={`${bottomReview.name}-${bottomReview.time}-wide`}
                  review={bottomReview}
                  wide
                />
              )}
            </div>

            {reviewSlides.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-5">
                <button
                  type="button"
                  onClick={() => goToSlide(-1)}
                  className="bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full p-2.5 shadow-lg transition"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                </button>

                <div className="flex items-center gap-2">
                  {reviewSlides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === activeSlide ? 'w-6 bg-[#00aeef]' : 'w-2 bg-gray-300'
                      }`}
                      aria-label={`Go to review slide ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToSlide(1)}
                  className="bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full p-2.5 shadow-lg transition"
                  aria-label="Next reviews"
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer trust bar */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {trustHighlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-4 p-6">
              <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Icon className="text-[#00aeef] w-5 h-5" strokeWidth={2.25} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">{title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Testimonials;
