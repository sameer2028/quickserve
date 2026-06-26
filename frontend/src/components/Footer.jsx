import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">QuickServe</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The fastest way to pre-order your favorite food. Skip the queue and enjoy your meal immediately upon arrival.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">For Customers</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Restaurants</Link></li>
              <li><Link to="/profile" className="hover:text-primary-400 transition-colors">My Profile</Link></li>
              <li><Link to="/profile?tab=orders" className="hover:text-primary-400 transition-colors">Orders</Link></li>
              <li><Link to="/profile?tab=wallet" className="hover:text-primary-400 transition-colors">Wallet & Loyalty</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">For Restaurants</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="http://localhost:3001/apply" className="hover:text-primary-400 transition-colors" target="_blank" rel="noreferrer">Partner with us</a></li>
              <li><a href="http://localhost:3001/login" className="hover:text-primary-400 transition-colors" target="_blank" rel="noreferrer">Restaurant Login</a></li>
              <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-gray-500">Email:</span>
                <a href="mailto:support@quickserve.com" className="hover:text-primary-400 transition-colors">support@quickserve.com</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-500">Phone:</span>
                <a href="tel:+919876543210" className="hover:text-primary-400 transition-colors">+91 98765 43210</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} QuickServe. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-gray-500">
            {/* Social Icons could go here */}
            <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-white cursor-pointer transition-colors">Instagram</span>
            <span className="hover:text-white cursor-pointer transition-colors">Facebook</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
