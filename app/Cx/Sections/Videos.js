'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { openSans } from '../Font/font';

/** Instagram reel shortcodes — update this list when swapping videos. */
const INSTAGRAM_REEL_IDS = [
  'DYNePvClVxx',
  'DYNg7FnDC45',
  'DYNgjcOEw5B',
  'DYNgEBEAg0C',
  'DYNfiSPjl6c',
];

const embedPermalink = (reelId) =>
  `https://www.instagram.com/reel/${reelId}/?utm_source=ig_embed&utm_campaign=loading`;

const BLOCKQUOTE_STYLE = {
  background: '#fff',
  border: 0,
  borderRadius: 8,
  margin: 0,
  maxWidth: '100%',
  minWidth: 280,
  padding: 0,
  width: 'calc(100% - 2px)',
};

const Videos = () => {
  const scrollContainerRef = useRef(null);
  const [embedScriptReady, setEmbedScriptReady] = useState(false);

  useEffect(() => {
    if (!embedScriptReady || typeof window === 'undefined') return;
    if (window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
    }
  }, [embedScriptReady]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -330, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 330, behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full py-8 lg:py-12 bg-gray-50 ${openSans.className}`}>
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => setEmbedScriptReady(true)}
      />

      <div className="max-w-[1400px] mx-auto px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Like, Follow and Share</h2>

        <div className="relative px-12">
          <button
            type="button"
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full p-3 shadow-lg transition"
            aria-label="Scroll left"
          >
            <FaChevronLeft className="text-xl" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth items-start"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {INSTAGRAM_REEL_IDS.map((reelId) => (
              <div
                key={reelId}
                className="relative shrink-0 w-[326px] min-h-[433px] rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200 flex justify-center"
              >
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={embedPermalink(reelId)}
                  data-instgrm-version="14"
                  style={BLOCKQUOTE_STYLE}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#00aeef] hover:bg-[#0099d9] text-white rounded-full p-3 shadow-lg transition"
            aria-label="Scroll right"
          >
            <FaChevronRight className="text-xl" />
          </button>
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Videos;
