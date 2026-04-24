'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PiPackageThin } from "react-icons/pi";
import { CiTrophy } from "react-icons/ci";
import { CiCreditCard1 } from "react-icons/ci";
import { CiHeadphones } from "react-icons/ci";
import { openSans } from '../Font/font';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    { src: '/ban-1.png', alt: 'Promotional banner' },
    { src: '/ban-2.png', alt: 'Promotional banner' },
    { src: '/banner-2.png', alt: 'Promotional banner' },
  ];

  const maxSlides = banners.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % maxSlides);
    }, 3000);

    return () => clearInterval(interval);
  }, [maxSlides]);

  return (
    <div className={`w-full ${openSans.className}`}>
      {/* Main Banner Carousel */}
      <div className="w-full relative overflow-hidden">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={`${banner.src}-${index}`} className="w-full shrink-0 relative">
              <div className="relative w-full aspect-[16/9] md:aspect-[16/6] lg:aspect-[1920/600] overflow-hidden">
                <Image 
                  src={banner.src} 
                  alt={banner.alt} 
                  fill
                  className="object-cover object-center"
                  priority={index === 0}
                  sizes="100vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Section */}
      <div className="bg-white py-4 sm:py-6 md:py-8 mt-4 sm:mt-6 md:mt-8 border border-gray-300 rounded-xl sm:rounded-2xl max-w-[95%] sm:max-w-[97%] justify-center items-center mx-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {/* Feature 1 - Faster Delivery */}
            <div className="flex items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3 py-2 sm:py-0">
              <PiPackageThin className="text-3xl sm:text-4xl md:text-5xl text-gray-900 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">FASTER DELIVERY</h3>
                <p className="text-xs sm:text-sm text-gray-600">Delivery in 24/H</p>
              </div>
            </div>

            {/* Feature 2 - 24 Hours Return */}
            <div className="flex items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3 py-2 sm:py-0">
              <CiTrophy className="text-3xl sm:text-4xl md:text-5xl text-gray-900 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">24 HOURS RETURN</h3>
                <p className="text-xs sm:text-sm text-gray-600">100% money-back guarantee</p>
              </div>
            </div>

            {/* Feature 3 - Secure Payment */}
            <div className="flex items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3 py-2 sm:py-0">
              <CiCreditCard1 className="text-3xl sm:text-4xl md:text-5xl text-gray-900 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">SECURE PAYMENT</h3>
                <p className="text-xs sm:text-sm text-gray-600">Your money is safe</p>
              </div>
            </div>

            {/* Feature 4 - Support 24/7 */}
            <div className="flex items-center justify-center sm:justify-start text-center sm:text-left gap-2 sm:gap-3 py-2 sm:py-0">
              <CiHeadphones className="text-3xl sm:text-4xl md:text-5xl text-gray-900 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">SUPPORT 24/7</h3>
                <p className="text-xs sm:text-sm text-gray-600">Live contact/message</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero