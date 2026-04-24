'use client';

import React from 'react';
import { openSans } from '../Font/font';
const Testimonials = () => {
  const testimonials = [
    {
      review:
        "We ordered our mattress from Cloudy Nap and the difference in sleep has been night and day. Supportive without feeling hard, and delivery was on time with the team careful bringing it upstairs. Would buy again without hesitation.",
      name: 'Ayesha R.',
      rating: 5,
    },
    {
      review:
        "The pillows and topper I picked up match exactly what was described online. Customer care answered all my firmness questions before I ordered, and the packaging was spotless when it arrived. Great experience end to end.",
      name: 'Omar Siddiqui',
      rating: 5,
    },
    {
      review:
        "Upgraded to a sofa cum bed for our guest room from Cloudy Nap. It is comfortable as a sofa and easy to open when family visits. Build quality feels solid and the fabric looks like it will last.",
      name: 'Fatima K.',
      rating: 5,
    },
    {
      review:
        "I have been buying bedroom pieces from Cloudy Nap for a while now—mattress first, then accessories—and they have been consistent every time. Fair pricing, honest advice, and quick responses on WhatsApp.",
      name: 'Bilal Ahmed',
      rating: 5,
    },
    {
      review:
        "First time ordering furniture online and I was nervous, but the team helped me choose the right size and firmness. Delivery was fast, setup was simple, and we are sleeping better than we have in years.",
      name: 'Sarah M.',
      rating: 5,
    },
  ];

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(<span key={i}>★</span>);
    }
    return stars;
  };

  return (
    <div className={`w-full py-8 lg:py-12 bg-white ${openSans.className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">What Our Customers Say</h2>
        
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="shrink-0 w-[400px] bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
              >
                <div className="flex text-yellow-400 mb-4 text-xl">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {testimonial.review}
                </p>
                <p className="text-gray-900 font-semibold">
                  - {testimonial.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Hide scrollbar for webkit browsers */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Testimonials;

