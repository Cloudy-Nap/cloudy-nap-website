'use client';

import React from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiShield, FiRefreshCw, FiX, FiFileText } from 'react-icons/fi';
import Navbar from '../Cx/Layout/Navbar';
import Footer from '../Cx/Layout/Footer';
import { openSans } from '../Cx/Font/font';

const PoliciesPage = () => {
  return (
    <div className={`min-h-screen flex flex-col ${openSans.className}`}>
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#00aeef] hover:text-[#0099d9] mb-4 transition"
            >
              <FiArrowLeft />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Policies & Terms</h1>
            <p className="text-gray-600">Review our policies, terms, and conditions</p>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-8 sticky top-4 z-10">
            <div className="flex flex-wrap gap-4">
              <a href="#warranty-policy" className="text-sm text-[#00aeef] hover:text-[#0099d9] transition">
                Warranty Policy
              </a>
              <a href="#cancellation-policy" className="text-sm text-[#00aeef] hover:text-[#0099d9] transition">
                Cancellation Policy
              </a>
              <a href="#privacy-policy" className="text-sm text-[#00aeef] hover:text-[#0099d9] transition">
                Privacy Policy
              </a>
              <a href="#terms-conditions" className="text-sm text-[#00aeef] hover:text-[#0099d9] transition">
                Terms & Conditions
              </a>
            </div>
          </div>

          <div className="space-y-8">
            {/* Warranty Policy */}
            <section id="warranty-policy" className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiRefreshCw className="text-2xl text-[#00aeef]" />
                <h2 className="text-2xl font-bold text-gray-900">Warranty Policy</h2>
              </div>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <h3 className="font-semibold text-gray-900 mb-2">Warranty</h3>
                <p>
                  Cloudynap warrants that it will, at Cloudynap&apos;s option, replace or repair the purchaser&apos;s product if it is defective due to faulty workmanship or materials, subject to the limitations described in this warranty.
                </p>
                <p>
                  This warranty covers defects in materials and workmanship for a duration specified on the accompanying warranty card.
                </p>
                <p>
                  Cloudynap is not responsible for any other expenses including but not limited to transportation, installation or labor costs. Cloudynap is not liable to any additional costs that exceed the price of the mattress.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Limitations of Warranty</h3>
                <p>This warranty covers:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Structural failures, including broken, burst, or bent coils.</li>
                  <li>Excessive sagging or deformation beyond normal wear and tear. (More than 1.5&quot;)</li>
                  <li>Foam splitting or cracking not resulting from misuse.</li>
                  <li>Any manufacturing defect in the assembly of the mattress cover.</li>
                </ol>

                <p className="mt-4">The warranty does not cover:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Any product which has been subject to misuse, neglect, accident or used in violation of instructions, including instructions to place mattress on proper bed frame.</li>
                  <li>Defects resulting from physical damage, including but not limited to burns, cuts, tears, liquid damage, or stains to the mattress structure or cover.</li>
                  <li>Indentation / Sagging less than 1.5&quot;.</li>
                  <li>Personal preference regarding mattress comfort level.</li>
                  <li>Damage caused by improper storage, including leaving the mattress compressed in its original packaging for extended periods (over 2-4 weeks).</li>
                  <li>Damage resulting from using an unsuitable foundation that does not provide adequate support for the mattress.</li>
                  <li>If the polyethylene packaging has not been removed, we will be unable to process the claim.</li>
                </ol>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Depreciation Policy</h3>
                <p>
                  The value of the mattress decreases over time. Under our warranty policy, we determine the warranty claim value using a depreciation factor that takes into account the length of the warranty and the age of the mattress. The depreciation percentage is calculated with the following formula:
                </p>
                <p className="font-medium bg-blue-50 border-l-4 border-[#00aeef] p-4">
                  Depreciation Percentage = [(Current Gross Price / Total Warranty Period) × Period of usage]
                </p>
                <p>
                  Disclaimer: Depreciation is calculated from the date of purchase up to the date the voucher is issued.
                </p>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section id="cancellation-policy" className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiX className="text-2xl text-[#00aeef]" />
                <h2 className="text-2xl font-bold text-gray-900">Cancellation Policy</h2>
              </div>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <p className="text-lg">
                  You have the right to cancel your order before it is shipped. Once an order has been shipped, it cannot be cancelled, but you can still return it under our refund policy.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Order Cancellation</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Orders can be cancelled within 24 hours of placement, provided they haven't been shipped</li>
                  <li>To cancel an order, contact our customer service team with your order number</li>
                  <li>If payment has been processed, a full refund will be issued within 5-7 business days</li>
                  <li>Once an order is in "Processing" or "Shipped" status, it cannot be cancelled</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Custom Orders</h3>
                <p>
                  Custom or personalized orders may have different cancellation terms. Please contact us immediately if you need to cancel a custom order, as these may be subject to additional fees if production has already begun.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">How to Cancel</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contact our customer service via phone or email with your order number</li>
                  <li>Provide your order details and reason for cancellation</li>
                  <li>We will confirm the cancellation and process your refund if applicable</li>
                  <li>You will receive a confirmation email once the cancellation is processed</li>
                </ol>
              </div>
            </section>

            {/* Privacy Policy */}
            <section id="privacy-policy" className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiShield className="text-2xl text-[#00aeef]" />
                <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
              </div>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <p>
                  Cloudynap works to ensure that your privacy is protected when using our services. This website is operated by Cloudynap and this privacy policy applies to your use of any Cloudynap websites. We therefore have a policy explaining what personal information is, how we use the information, who has access to the data, and your rights regarding the information collected. Your access and use of our website constitute your acceptance of our Privacy Policy and Terms of Use.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Personal Data</h3>
                <p>
                  We take responsibility for all the personal data (such as your name, address, email address, phone number, and date of birth) that you provide us with, obtained when you place an order or when you create a personal profile.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">How do we use your personal data?</h3>
                <p>
                  We use the information that we collect to fulfil orders. This includes sending you products that are ordered and offers for marketing purposes. In order to provide you with relevant offers and information, we may analyze your personal data. We will only keep your data for as long as necessary to carry out our services to you or for as long as we are required by law. After this your personal data will be deleted.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">What information does Cloudynap share with third parties?</h3>
                <p>
                  Cloudynap may share your personal information with third parties or affiliates of Cloudynap who perform services on our behalf or process authorized transactions. The personal information we share with these companies to perform services on our behalf is protected via contractual agreements and cannot be shared. We do not sell your information to any third party nor do we disclose your personal information to unaffiliated third parties.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">What are your rights?</h3>
                <p>
                  You have the right to request information about the personal data we hold on you. If your data is incorrect, incomplete or irrelevant, you can ask to have the information corrected or removed.
                </p>
                <p>
                  A cookie is a small text file that is saved to, and during subsequent visits, retrieved from your computer or mobile device. Cloudynap uses cookies to enhance and simplify your visit. We do not use cookies to store personal information or to disclose information to third parties. There are two types of cookies: permanent and temporary (session cookies). Permanent cookies are stored as a file on your computer or mobile device for no longer than 12 months. Session cookies are stored temporarily and disappear when you close your browser session. We use permanent cookies to store your choice of start page and to store your details. We use session cookies when you use the product filtration function and to check if you are logged in. You can easily erase cookies from your computer or mobile device using your browser.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6 mb-2">Third-party cookies</h3>
                <p>
                  We use third-party cookies to collect statistics in aggregate form in analysis tools such as Google Analytics and Google ads. The cookies used are both permanent and temporary (session cookies). The permanent cookies are stored on your computer or mobile device for no longer than 24 hours.
                </p>
              </div>
            </section>

            {/* Terms & Conditions */}
            <section id="terms-conditions" className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiFileText className="text-2xl text-[#00aeef]" />
                <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
              </div>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <p>
                  You (&quot;you&quot; or &quot;End User&quot; or &quot;your&quot; or &quot;Buyer&quot; or &quot;Customer&quot;) are required to read and accept all of the terms and conditions laid down in this Terms and Conditions (&quot;Terms and Conditions&quot; or &quot;TERMS AND CONDITIONS&quot; or &quot;Terms&quot; or &quot;Agreement&quot;) and the linked Privacy Policy, before you may use the Cloudynap website (hereinafter referred to as &quot;Site&quot; or &quot;brand&quot; or &quot;Cloudynap Online Store&quot; or &quot;we&quot; or &quot;our&quot;). The Site allows you to browse, select and purchase mattresses, furniture, and accessories (&quot;Goods&quot; or &quot;Products&quot; or &quot;Services&quot;). Your use of this website and its related sites, services and tools. These TERMS AND CONDITIONS are effective upon acceptance and govern the relationship between you and Cloudynap (hereinafter the &quot;Company&quot;), including the sale and supply of any Products on the Site. If these TERMS AND CONDITIONS conflict with any other document, the TERMS AND CONDITIONS will prevail for the purposes of usage of the Site. If you do not agree to be bound by these TERMS AND CONDITIONS and the Privacy Policy, you may not use the Site in any way. For the purposes of this TERMS AND CONDITIONS, the term &quot;Acceptance&quot; shall mean your affirmative action in clicking on &quot;checkbox&quot; and on the &quot;continue button&quot; as provided on the registration page or such other actions that implies your acceptance.
                </p>

                <p>
                  The Company may amend this Agreement and/or the Privacy Policy at any time by posting a revised version on the Site. All updates and amendments shall be notified to you via posts on the website or through e-mail. The revised version will be effective at the time we post it on the Site, and in the event you continue to use our Site, you are impliedly agreeing to the revised TERMS AND CONDITIONS and Privacy Policy expressed herein.
                </p>

                <p>
                  In addition, if the revised version of this Agreement includes a Substantial Change, we will provide you with 30 days&apos; prior notice of such Substantial Change as per the Notification Preferences provided by you. You are advised to regularly check for any amendments or updates to the terms and conditions contained in this Agreement. For the purpose of this Agreement, the term &quot;Substantial Change&quot; means a change to the terms of this Agreement that materially reduces your rights or increases your responsibilities. Please read these terms and conditions carefully. These terms &amp; conditions, as modified or amended from time to time, are a binding contract between the Company and you. If you visit, use, or shop at the Site (or any future site operated by the Company), you accept these terms and conditions. In addition, when you use any current or future services of the Company or visit or purchase from any business affiliated with the Company or third party vendors, whether or not included in the Site, you will also be subject to the guidelines and conditions applicable to such service or merchant. If these conditions are inconsistent with such guidelines and conditions, such guidelines and conditions will prevail.
                </p>

                <p>
                  If this Terms and Conditions conflicts with any other document, the Terms and Conditions will prevail for the purposes of usage of the Site. As a condition of purchase, the Site requires your permission to send you administrative and promotional emails. We will send you information regarding your account activity and purchases, as well as updates about our products and promotional offers. You can opt out of our promotional emails anytime by clicking the UNSUBSCRIBE link at the bottom of any of our email correspondences. Please see our Privacy Policy for details. We shall have no responsibility in any manner whatsoever regarding any promotional emails or SMS/MMS sent to you. The offers made in those promotional emails or SMS/MMS shall be subject to change at the sole discretion of the Company and the Company owes no responsibility to provide you any information regarding such change. By placing an order, you make an offer to us to purchase products you have selected based on standard Site restrictions, Merchant specific restrictions, and on the terms and conditions stated below. You are required to create an account in order to purchase any product from the Site. This is required so we can provide you with easy access to print your orders and view your past purchases.
                </p>

                <p>
                  The Site/Company takes no responsibility for the services or products that are sold or supplied by third party vendors. The Company makes no warranty to their end users for the quality, safety, usability, or other aspects of a product or service that is supplied by a Merchant and/or for some services or activities that involve potential bodily harm, and for those activities, the Company takes no responsibility for the service or activity being offered, and the End User takes responsibility for his or her own actions in utilizing those services.
                </p>
              </div>
            </section>
          </div>

          {/* Back to Top */}
          <div className="mt-8 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[#00aeef] hover:text-[#0099d9] transition"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Back to Top
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PoliciesPage;

