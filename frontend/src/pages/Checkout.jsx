import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchCart, clearCart } from '../store/cartSlice';
import toast from 'react-hot-toast';
import { MapPin, Clock, CreditCard, CheckCircle2 } from 'lucide-react';

const Checkout = () => {
  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handlePlaceOrder = async () => {
    try {
      setIsProcessing(true);
      
      const orderPayload = {
        orderType,
        paymentMethod,
        specialInstructions,
      };

      // Place the order
      const { data } = await api.post('/orders', orderPayload);
      const orderId = data.data.orderId;

      // Handle payment (Mocking successful payment flow for now, in reality we'd integrate Stripe JS here)
      // We will call create-intent and confirm directly or just assume success if wallet
      const paymentPayload = {
        orderId,
        paymentMethod: paymentMethod === 'wallet' ? 'wallet' : 'card'
      };

      const paymentRes = await api.post('/payments/create-intent', paymentPayload);
      
      if (paymentMethod === 'wallet') {
        setOrderComplete(data.data.order);
        dispatch(clearCart());
        toast.success('Order placed successfully!');
      } else {
        // Mock Stripe confirm for demo
        await api.post('/payments/confirm', { paymentIntentId: paymentRes.data.data.paymentIntentId });
        setOrderComplete(data.data.order);
        dispatch(clearCart());
        toast.success('Payment successful! Order placed.');
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-gray-500 mb-2">Order #{orderComplete.orderNumber}</p>
          <p className="text-sm text-gray-500 mb-8">
            Your {orderComplete.orderType.replace('_', '-')} order has been received by the kitchen.
          </p>
          <div className="space-y-4">
            <button onClick={() => navigate('/profile?tab=orders')} className="w-full btn-primary">
              Track Order
            </button>
            <button onClick={() => navigate('/')} className="w-full btn-secondary">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 space-y-6">
            {/* Order Type Selection */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Order Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['pickup', 'dine_in', 'delivery'].map((type) => {
                  // Check if restaurant allows this type
                  const isAllowed = 
                    (type === 'pickup' && cart.restaurant.features?.acceptsPickup) ||
                    (type === 'dine_in' && cart.restaurant.features?.acceptsDineIn) ||
                    (type === 'delivery' && cart.restaurant.features?.acceptsDelivery);
                  
                  // For the sake of UI, assuming all are allowed if features isn't populated fully
                  return (
                    <label 
                      key={type}
                      className={`
                        relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all
                        ${orderType === type ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:bg-gray-50'}
                      `}
                    >
                      <input 
                        type="radio" 
                        name="orderType" 
                        value={type} 
                        checked={orderType === type}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="sr-only" 
                      />
                      <span className="flex flex-1">
                        <span className="flex flex-col">
                          <span className="block text-sm font-medium text-gray-900 capitalize">
                            {type.replace('_', '-')}
                          </span>
                        </span>
                      </span>
                      {orderType === type && (
                        <CheckCircle2 className="h-5 w-5 text-primary-600" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Special Instructions</h2>
              <textarea
                rows="3"
                className="input-field"
                placeholder="Any specific requests for the kitchen? e.g. Make it spicy, no onions..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              ></textarea>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                Payment Method
              </h2>
              <div className="space-y-4">
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                  <span className="ml-3 font-medium text-gray-900">Credit / Debit Card</span>
                </label>
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                  <input type="radio" name="payment" value="wallet" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                  <span className="ml-3 font-medium text-gray-900 flex flex-col">
                    <span>QuickServe Wallet</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Payment Summary</h3>
              
              <div className="space-y-4 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{cart.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Charges</span>
                  <span className="font-medium text-gray-900">₹{cart.tax + cart.packagingCharge + cart.convenienceFee}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-gray-900">₹{cart.deliveryFee || 40}</span>
                  </div>
                )}
                {cart.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{cart.couponDiscount}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-gray-900">
                    ₹{orderType === 'delivery' ? cart.total + (cart.deliveryFee || 40) : cart.total}
                  </span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full btn-primary py-3.5 text-base shadow-md shadow-primary-500/30 flex justify-center items-center"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  `Pay ₹${orderType === 'delivery' ? cart.total + (cart.deliveryFee || 40) : cart.total}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
