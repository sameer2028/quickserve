import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCart, updateQuantity, removeFromCart, clearCart } from '../store/cartSlice';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, isLoading } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleUpdateQuantity = (itemIndex, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ itemIndex, quantity: newQuantity }));
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  if (isLoading && !cart) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="btn-primary w-full inline-block">
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Your Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="card mb-6">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <img 
                    src={cart.restaurant.logo?.url || 'https://via.placeholder.com/50'} 
                    alt={cart.restaurant.name} 
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{cart.restaurant.name}</h2>
                    <Link to={`/restaurant/${cart.restaurant.slug}`} className="text-sm text-primary-600 hover:underline">
                      View Menu
                    </Link>
                  </div>
                </div>
                <button 
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <Trash2 size={16} /> Clear Cart
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.items.map((item, index) => (
                  <div key={item._id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <img 
                      src={item.menuItem?.images?.[0]?.url || 'https://via.placeholder.com/80'} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${item.menuItem?.foodType === 'veg' ? 'border-green-600' : 'border-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.menuItem?.foodType === 'veg' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        </span>
                        <h3 className="text-base font-semibold text-gray-900 truncate">{item.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">₹{item.price}</p>
                    </div>

                    <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                        <button 
                          onClick={() => handleUpdateQuantity(index, item.quantity, -1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-l-lg transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(index, item.quantity, 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-r-lg transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <span className="font-semibold text-gray-900">₹{item.itemTotal}</span>
                        <button 
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{cart.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (5%)</span>
                  <span className="font-medium text-gray-900">₹{cart.tax}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging Charges</span>
                  <span className="font-medium text-gray-900">₹{cart.packagingCharge}</span>
                </div>
                <div className="flex justify-between">
                  <span>Convenience Fee</span>
                  <span className="font-medium text-gray-900">₹{cart.convenienceFee}</span>
                </div>
                {cart.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount ({cart.couponCode})</span>
                    <span>-₹{cart.couponDiscount}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Total to pay</span>
                  <span className="text-xl font-extrabold text-gray-900">₹{cart.total}</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                className="w-full btn-primary py-3.5 text-base shadow-md shadow-primary-500/30 flex justify-center items-center gap-2"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
