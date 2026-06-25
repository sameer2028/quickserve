import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { LogOut, User, ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const cartItemsCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">QuickServe</span>
            </Link>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Restaurants
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-6">
                <Link to="/cart" className="text-gray-600 hover:text-primary-600 relative">
                  <ShoppingBag size={24} />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 focus:outline-none">
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-primary-100" />
                    ) : (
                      <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-primary-100" />
                    )}
                    <span className="font-medium text-sm">{user?.name?.split(' ')[0]}</span>
                  </button>

                  <div className="absolute right-0 w-48 pt-2 hidden group-hover:block z-50">
                    <div className="bg-white rounded-xl shadow-lg py-1 border border-gray-100 transition-all">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile & Orders</Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut size={20} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium">Log in</Link>
                <Link to="/register" className="btn-primary">Sign up</Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 sm:hidden">
            {isAuthenticated && (
              <Link to="/cart" className="text-gray-600 hover:text-primary-600 relative">
                <ShoppingBag size={24} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 w-full bg-white shadow-xl border-t border-gray-100 z-40">
          <div className="pt-2 pb-4 space-y-1 px-2">
            <Link onClick={() => setIsMenuOpen(false)} to="/" className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors">
              Restaurants
            </Link>
            {isAuthenticated ? (
              <>
                <Link onClick={() => setIsMenuOpen(false)} to="/profile" className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors">Profile & Orders</Link>
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full text-left block px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link onClick={() => setIsMenuOpen(false)} to="/login" className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors">Log in</Link>
                <Link onClick={() => setIsMenuOpen(false)} to="/register" className="block px-4 py-3 rounded-lg text-base font-medium text-primary-600 hover:bg-primary-50 transition-colors">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
