import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

const Terms = () => {
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
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
              <Scale size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Terms of Service</h1>
              <p className="text-sm text-gray-500 mt-1">Last Updated: June 26, 2026</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-600 leading-relaxed text-sm">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">1. Agreement to Terms</h2>
              <p>
                Welcome to QuickServe. By accessing or using our website, platform, and services, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">2. Our Services</h2>
              <p>
                QuickServe acts as an intermediary platform connecting users with local restaurants for pre-ordering, dining in, delivery, and self-pickup. We do not prepare food, nor are we responsible for the quality, safety, or legality of the items offered by restaurants.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">3. User Accounts</h2>
              <p>
                To place orders, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and password, and you agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">4. Payments, Refunds, and Wallet</h2>
              <p>
                Payments are securely processed online or via our in-app wallet. Refunds for canceled orders are subject to the restaurant's policies and queue preparation state. Canceled pre-ordered food that has already been prepared cannot be refunded.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">5. Limitation of Liability</h2>
              <p>
                QuickServe shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or use of the services, including food allergies, delivery delays, or incorrect order processing by restaurants.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">6. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of the platform constitutes agreement to the updated terms.
              </p>
            </section>

            <div className="pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                If you have questions about these Terms, please contact us at <a href="mailto:support@quickserve.com" className="text-primary-600 hover:underline">support@quickserve.com</a>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Terms;
