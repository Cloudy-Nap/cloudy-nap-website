'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const PromotionalBanners = () => {
  return (
    <div className="w-full py-8 lg:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dolce Vita mattresses — beds */}
          <Link href="/all-products?subcategory=matteress" className="relative rounded-lg overflow-hidden group cursor-pointer block">
            <Image 
              src="/banner-m-1.png" 
              alt="Dolce Vita mattresses" 
              width={800}
              height={400}
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0  flex items-center p-6">
              <div>
                <div className="bg-[#00aeef] text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                  INTRODUCING
                </div>
                <h2 className="text-2xl max-w-xs lg:text-3xl font-bold text-white mb-2">
                  Dolce Vita Matteresses
                </h2>
              </div>
            </div>
          </Link>

          {/* Dolce Vita 5000 Series — same mattress catalog */}
          <Link href="/all-products?subcategory=matteress" className="relative rounded-lg overflow-hidden group cursor-pointer block">
            <Image 
              src="/banner-m-2.png" 
              alt="Dolce Vita 5000 Series mattresses" 
              width={800}
              height={400}
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent flex items-center p-6">
              <div>
                <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                  LATEST PRODUCT
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                 Dolce Vita 5000 Series
                </h2>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanners;

