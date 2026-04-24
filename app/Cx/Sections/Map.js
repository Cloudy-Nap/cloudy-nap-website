'use client';

import React, { useState } from 'react';
import { openSans } from '../Font/font';
const Map = () => {
  const [activeCity, setActiveCity] = useState('Karachi');

  const cities = ['Karachi', 'Lahore', 'Quetta', 'Peshawar'];

  return (
    <div className={`w-full py-8 lg:py-12 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Store Locations</h2>
        
        {/* City Tabs */}
        <div className="flex justify-center mb-6">
          <div className="w-[70%] mx-auto bg-gray-100 flex">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`flex-1 py-3 font-medium transition ${
                  activeCity === city
                    ? 'bg-[#00aeef] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="w-[70%] mx-auto rounded-lg overflow-hidden shadow-lg">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2822.894945469706!2d67.06657919999999!3d24.8864581!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33f005c988d77%3A0xd0dcddb87f515bd6!2sDiamond%20Supreme%20Foam%20(CLOUDYNAP)!5e1!3m2!1sen!2s!4v1776985975328!5m2!1sen!2s"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Diamond Supreme Foam (CLOUDYNAP) on Google Maps"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Map;

