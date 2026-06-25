import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { clearCart } from '../store/cartSlice';
import toast from 'react-hot-toast';
import { MapPin, Clock, CreditCard, CheckCircle2, Wallet, Truck, Store, UtensilsCrossed, Check } from 'lucide-react';

const Checkout = () => {
  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressMode, setAddressMode] = useState('saved'); // 'saved' or 'new'
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Delivery address form
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!cart || cart.items?.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Fetch wallet balance and addresses
  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [walletRes, addressRes] = await Promise.all([
          api.get('/wallet').catch(() => ({ data: { data: { balance: 0 } } })),
          api.get('/users/addresses').catch(() => ({ data: { data: { addresses: [] } } }))
        ]);
        setWalletBalance(walletRes.data.data?.wallet?.balance ?? walletRes.data.data?.balance ?? 0);

        const addresses = addressRes.data.data?.addresses || [];
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.isDefault);
          setSelectedAddressId(defaultAddr ? defaultAddr._id : addresses[0]._id);
        } else {
          setAddressMode('new');
        }
      } catch {
        setWalletBalance(0);
      }
    };
    fetchCheckoutData();
  }, []);

  const handlePlaceOrder = async () => {
    // Validate delivery address
    if (orderType === 'delivery') {
      if (addressMode === 'new') {
        if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
          toast.error('Please fill in all required delivery address fields');
          return;
        }
      } else {
        if (!selectedAddressId) {
          toast.error('Please select a delivery address');
          return;
        }
      }
    }

    try {
      setIsProcessing(true);

      const orderPayload = {
        orderType,
        paymentMethod,
        specialInstructions,
      };

      if (isScheduled) {
        if (!scheduledDate || !scheduledTime) {
          toast.error('Please select both date and time for your scheduled order');
          setIsProcessing(false);
          return;
        }

        const combinedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        if (combinedDateTime < new Date(Date.now() + 30 * 60 * 1000)) {
          toast.error('Scheduled time must be at least 30 minutes from now');
          setIsProcessing(false);
          return;
        }
        orderPayload.schedule = {
          scheduledAt: combinedDateTime.toISOString(),
        };
      }

      // Include delivery address for delivery orders
      if (orderType === 'delivery') {
        if (addressMode === 'new') {
          orderPayload.deliveryAddress = {
            name: deliveryAddress.fullName,
            phone: deliveryAddress.phone,
            street: deliveryAddress.street,
            landmark: deliveryAddress.landmark,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            pincode: deliveryAddress.pincode,
            country: 'India',
          };
        } else {
          const selected = savedAddresses.find(a => a._id === selectedAddressId);
          orderPayload.deliveryAddress = {
            name: selected.fullName,
            phone: selected.phone,
            street: `${selected.addressLine1} ${selected.addressLine2 || ''}`.trim(),
            landmark: '',
            city: selected.city,
            state: selected.state,
            pincode: selected.pincode,
            country: 'India',
          };
        }
      }

      // Place the order
      const { data } = await api.post('/orders', orderPayload);
      const orderId = data.data.orderId;

      // Process payment
      const paymentPayload = {
        orderId,
        paymentMethod: paymentMethod,
      };

      const paymentRes = await api.post('/payments/create-intent', paymentPayload);

      if (paymentMethod === 'wallet') {
        // Wallet payment is instant
        dispatch(clearCart());
        toast.success('Order placed successfully! Paid via wallet.');
        navigate('/profile?tab=orders');
      } else {
        // For card, we would integrate Stripe Elements here
        // For demo/testing, try to confirm directly
        try {
          await api.post('/payments/confirm', { paymentIntentId: paymentRes.data.data.paymentIntentId });
          dispatch(clearCart());
          toast.success('Payment successful! Order placed.');
          navigate('/profile?tab=orders');
        } catch {
          // If Stripe confirm fails (no real Stripe setup), still show success for the order
          dispatch(clearCart());
          toast.success('Order placed! Payment pending.');
          navigate('/profile?tab=orders');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart) return null;

  const orderTypeOptions = [
    { value: 'pickup', label: 'Pickup', icon: Store, desc: 'Pick up from restaurant' },
    { value: 'dine_in', label: 'Dine-In', icon: UtensilsCrossed, desc: 'Eat at the restaurant' },
    { value: 'delivery', label: 'Delivery', icon: Truck, desc: 'Deliver to your address' },
  ];

  const total = orderType === 'delivery' ? cart.total + (cart.deliveryFee || 40) : cart.total;

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
                {orderTypeOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <label
                      key={opt.value}
                      className={`
                        relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all
                        ${orderType === opt.value ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:bg-gray-50'}
                      `}
                    >
                      <input
                        type="radio"
                        name="orderType"
                        value={opt.value}
                        checked={orderType === opt.value}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="sr-only"
                      />
                      <span className="flex flex-1 items-center gap-3">
                        <Icon className={`w-5 h-5 ${orderType === opt.value ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span className="flex flex-col">
                          <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                        </span>
                      </span>
                      {orderType === opt.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Order Timing */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Order Timing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all ${!isScheduled ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input type="radio" name="timing" checked={!isScheduled} onChange={() => setIsScheduled(false)} className="sr-only" />
                  <span className="flex flex-1 items-center gap-3">
                    <span className="block text-sm font-semibold text-gray-900">Order Now</span>
                  </span>
                  {!isScheduled && <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />}
                </label>
                <label className={`flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all ${isScheduled ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input type="radio" name="timing" checked={isScheduled} onChange={() => setIsScheduled(true)} className="sr-only" />
                  <span className="flex flex-1 items-center gap-3">
                    <span className="block text-sm font-semibold text-gray-900">Schedule for Later</span>
                  </span>
                  {isScheduled && <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />}
                </label>
              </div>

              {isScheduled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 p-5 border rounded-xl bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      className="input-field"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 sm:col-span-2 flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    Scheduled time must be at least 30 minutes from now.
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Address - Only when delivery is selected */}
            {orderType === 'delivery' && (
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    Delivery Address
                  </h2>
                </div>

                {/* Tabs */}
                {savedAddresses.length > 0 && (
                  <div className="flex gap-4 mb-6 border-b border-gray-100 pb-2">
                    <button
                      className={`pb-2 text-sm font-medium transition-colors ${addressMode === 'saved' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setAddressMode('saved')}
                    >
                      Saved Addresses
                    </button>
                    <button
                      className={`pb-2 text-sm font-medium transition-colors ${addressMode === 'new' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setAddressMode('new')}
                    >
                      + Add New Address
                    </button>
                  </div>
                )}

                {addressMode === 'saved' && savedAddresses.length > 0 ? (
                  <div className="space-y-3">
                    {savedAddresses.map(addr => (
                      <div
                        key={addr._id}
                        onClick={() => setSelectedAddressId(addr._id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-200'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{addr.fullName}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 text-gray-700 rounded uppercase tracking-wider">{addr.label}</span>
                          </div>
                          {selectedAddressId === addr._id && (
                            <div className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{addr.phone}</p>
                        <p className="text-sm text-gray-600">
                          {addr.addressLine1} {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                          {addr.city}, {addr.state} {addr.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress.fullName}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, fullName: e.target.value })}
                        className="input-field"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={deliveryAddress.phone}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                        className="input-field"
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress.street}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                        className="input-field"
                        placeholder="House/Flat No., Building, Street"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                      <input
                        type="text"
                        value={deliveryAddress.landmark}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, landmark: e.target.value })}
                        className="input-field"
                        placeholder="Near park, opposite mall, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                        className="input-field"
                        placeholder="New Delhi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                        className="input-field"
                        placeholder="Delhi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={deliveryAddress.pincode}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                        className="input-field"
                        placeholder="110001"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

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
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="wallet" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary-600" />
                      <div>
                        <span className="font-medium text-gray-900">QuickServe Wallet</span>
                        <p className="text-xs text-gray-500">Instant payment, no card needed</p>
                      </div>
                    </div>
                  </div>
                  {walletBalance !== null && (
                    <span className={`text-sm font-semibold ${walletBalance >= total ? 'text-emerald-600' : 'text-red-500'}`}>
                      ₹{walletBalance.toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                  <div className="ml-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900">Credit / Debit Card</span>
                      <p className="text-xs text-gray-500">Pay securely via Stripe</p>
                    </div>
                  </div>
                </label>
              </div>
              {paymentMethod === 'wallet' && walletBalance !== null && walletBalance < total && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    Insufficient wallet balance. You need ₹{(total - walletBalance).toLocaleString('en-IN')} more.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Payment Summary</h3>

              {/* Order items summary */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                {cart.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.quantity}x {item.name}</span>
                    <span className="font-medium text-gray-900">₹{item.itemTotal}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{cart.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Charges</span>
                  <span className="font-medium text-gray-900">₹{(cart.tax || 0) + (cart.packagingCharge || 0) + (cart.convenienceFee || 0)}</span>
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
                  <span className="text-xl font-extrabold text-gray-900">₹{total}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing || (paymentMethod === 'wallet' && walletBalance !== null && walletBalance < total)}
                className="w-full btn-primary py-3.5 text-base shadow-md shadow-primary-500/30 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  `Pay ₹${total}`
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
