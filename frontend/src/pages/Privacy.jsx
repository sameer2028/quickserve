import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors font-medium mb-6">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Card Header & Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
              <p className="text-sm text-gray-500 mt-1">Last Updated: June 26, 2026</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-600 leading-relaxed text-sm">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">1. Information We Collect</h2>
              <p>
                We collect personal information that you provide to us directly when creating an account, placing an order, or contacting support. This includes name, email, phone number, physical address, and payment preferences.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">2. How We Use Your Information</h2>
              <p>
                Your information is used to facilitate order placement, coordinate preparation with partner restaurants, handle in-app wallet transactions, and communicate updates (such as queue notifications or receipts).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">3. Sharing Information</h2>
              <p>
                We share essential details (order details, customer name, and contact info) with the specific partner restaurant preparing your order. If choosing delivery, your location and contact details are shared with delivery agents. We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">4. Data Security</h2>
              <p>
                We employ administrative, technical, and physical security measures to safeguard your personal data. All payment details are processed using encrypted external gateways like Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">5. Your Choices & Rights</h2>
              <p>
                You may access, modify, or request deletion of your personal account information and order history directly through your profile settings or by contacting our customer support team.
              </p>
            </section>

            <div className="pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                For security or privacy concerns, please contact us at <a href="mailto:privacy@quickserve.com" className="text-primary-600 hover:underline">privacy@quickserve.com</a>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Privacy;
