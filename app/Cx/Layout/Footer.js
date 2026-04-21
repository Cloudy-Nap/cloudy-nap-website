'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin } from 'react-icons/fa';
import { CiPhone } from 'react-icons/ci';
import { FaXTwitter } from 'react-icons/fa6';
import { openSans } from '../Font/font';

const Footer = () => {
  return (
    <footer className={`bg-[#d3eaf7] text-[#1a2f4a] border-t border-sky-200/80 ${openSans.className}`}>
      <div className=" mx-auto py-4">
        <hr className="w-full border-sky-300/90 border-2 mb-8" />
        <div className="grid grid-cols-1 px-20 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/loogo.png"
                alt="Cloudynap"
                width={128}
                height={44}
                className="object-contain h-9 w-auto sm:h-10"
              />
            </div>
            <p className="text-[#1a2f4a]/80">Your Trusted IT Partner.</p>
            
            <div className="flex items-start gap-3">
              <CiPhone className="text-xl mt-1 shrink-0" />
              <div>
                <p className="text-[#1a2f4a]/80 font-medium">Contact Us</p>
                <p className="text-[#1a2f4a]">+92-333-2673177</p>
              </div>
            </div>
            
            <div className="mt-6">
              <Image
                src="/google-reviews.png"
                alt="Google Reviews"
                width={100}
                height={40}
                className="object-contain mb-2"
              />
            </div>
          </div>

          {/* Information Links */}
          <div>
            <h3 className="text-[#1a2f4a] font-bold text-lg mb-4">Information</h3>
            <ul className="space-y-2">
              <li><Link href="/policies#privacy-policy" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Privacy Policy</Link></li>
              <li><Link href="#" className="text-[#1a2f4a] hover:text-[#00aeef] transition">About us</Link></li>
              <li><Link href="#" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Secure payment</Link></li>
              <li><Link href="/contact-us" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Contact us</Link></li>
              <li><Link href="/policies#terms-conditions" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Terms & Conditions</Link></li>
              <li><Link href="/policies#refund-policy" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Refund & Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="text-[#1a2f4a] font-bold text-lg mb-4">Important Links</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Delivery</Link></li>
              <li><Link href="#" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Sitemap</Link></li>
              <li><Link href="#" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Stores</Link></li>
              <li><Link href="#" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Best sales</Link></li>
              <li><Link href="#" className="text-[#1a2f4a] hover:text-[#00aeef] transition">Login</Link></li>
              <li><Link href="#" className="text-[#1a2f4a] hover:text-[#00aeef] transition">My account</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-[#1a2f4a] font-bold text-lg mb-4">News Letter</h3>
            <p className="text-[#1a2f4a]/80 text-sm mb-4">
              You may unsubscribe at any moment. For that purpose, please find our contact info in the legal notice.
            </p>
            <div className="flex gap-2 mb-6 min-w-0">
              <input
                type="email"
                placeholder="Your email address..."
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00aeef] min-w-0"
              />
              <button className="bg-[#00aeef] hover:bg-[#0099d9] text-white px-6 py-2 rounded-lg font-medium transition shrink-0">
                Subscribe
              </button>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <a href="#" className="w-10 h-10 bg-[#1a2f4a] hover:bg-[#00aeef] rounded-full flex items-center justify-center transition text-white">
                <FaFacebook className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#1a2f4a] hover:bg-[#00aeef] rounded-full flex items-center justify-center transition text-white">
                <FaInstagram className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#1a2f4a] hover:bg-[#00aeef] rounded-full flex items-center justify-center transition text-white">
                <FaTiktok className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#1a2f4a] hover:bg-[#00aeef] rounded-full flex items-center justify-center transition text-white">
                <FaXTwitter className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#1a2f4a] hover:bg-[#00aeef] rounded-full flex items-center justify-center transition text-white">
                <FaLinkedin className="text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-400/50 pt-6 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#1a2f4a]/70 px-20 text-sm">© Cloudynap 2026. All right reserved</p>
          
          <div className="flex items-center pr-20 gap-4">
            <div className="flex items-center gap-3">
              <Image src="/easypaisa.png" alt="EasyPaisa" width={20} height={20} className="object-contain" />
              <Image src="/sadapay.png" alt="SadaPay" width={20} height={20} className="object-contain" />
              <Image src="/nayapay.png" alt="NayaPay" width={20} height={20} className="object-contain" />
              <Image src="/mastercard.png" alt="Mastercard" width={20} height={20} className="object-contain" />
              <Image src="/visa.png" alt="Visa" width={30} height={30} className="object-contain" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

