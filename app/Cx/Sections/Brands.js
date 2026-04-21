'use client';

import React from 'react';
import Image from 'next/image';
import { openSans } from '../Font/font';
import Link from 'next/link';

const Brands = () => {
  return (
    <div className={`w-full py-8 lg:py-12 bg-gray-50 ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mattresses — beds table */}
          <Link href="/all-products?subcategory=matteress" className="relative group cursor-pointer overflow-hidden rounded-lg h-64">
            <div className="w-full h-full">
              <Image 
                src="/banner-s-1.png" 
                alt="Mattresses and mattress in a box" 
                width={600}
                height={400}
                className="w-full h-full object-cover object-right transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">Matteresses</h3>
              </div>
            </div>
          </Link>

          {/* Pillows & accessories — accessories table */}
          <Link href="/all-products?subcategory=accessories" className="relative group cursor-pointer overflow-hidden rounded-lg h-64">
            <div className="w-full h-full">
              <Image 
                src="/banner-s-2.png" 
                alt="Pillows and accessories" 
                width={600}
                height={400}
                className="w-full h-full object-cover object-right transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">Pillows & Accessories</h3>
              </div>
            </div>
          </Link>

          {/* Recliners & adjustable beds — furniture table */}
          <Link href="/all-products?subcategory=furniture" className="relative group cursor-pointer overflow-hidden rounded-lg h-64">
            <div className="w-full h-full">
              <Image 
                src="/banner-s-3.png" 
                alt="Recliners and adjustable beds" 
                width={600}
                height={400}
                className="w-full h-full object-cover scale-110 object- transition-transform duration-300 group-hover:scale-120"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">Recliners & Adjustable Beds</h3>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Brands