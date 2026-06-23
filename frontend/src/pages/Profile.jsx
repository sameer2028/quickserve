import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Package, MapPin, Wallet, LogOut, Edit2, Check, X } from 'lucide-react';
import { logout, getMe } from '../store/authSlice';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressData, setAddressData] = useState({
    label: 'home',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        if (activeTab === 'orders') {
          const { data } = await api.get('/orders/my-orders');
          setOrders(data.data.orders);
        } else if (activeTab === 'wallet') {
          const { data } = await api.get('/wallet');
          setWallet(data.data);
        } else if (activeTab === 'profile') {
          const { data } = await api.get('/users/addresses');
          setAddresses(data.data.addresses);
        }
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData(true);

    // Set up polling every 5 seconds for live order status tracking
    let interval;
    if (activeTab === 'orders') {
      interval = setInterval(() => {
        fetchData(false);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, user, navigate]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    try {
      setIsUpdating(true);
      await api.put('/users/profile', profileData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      dispatch(getMe()); // Update user in Redux store
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await api.post('/users/addresses', addressData);
      toast.success('Address added successfully');
      setIsAddingAddress(false);
      setAddressData({ label: 'home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
      // Refetch addresses
      const { data } = await api.get('/users/addresses');
      setAddresses(data.data.addresses);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/4">
            <div className="card overflow-hidden">
              <div className="p-6 bg-primary-600 text-white text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary-500">
                  {user.avatar ? (
                    <img src={user.avatar.url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary-600">{user.name?.charAt(0)}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-primary-100 text-sm">{user.email}</p>
              </div>
              
              <nav className="p-4 space-y-1">
                {[
                  { id: 'profile', label: 'My Profile', icon: User },
                  { id: 'orders', label: 'Order History', icon: Package },
                  { id: 'wallet', label: 'QuickServe Wallet', icon: Wallet },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon size={18} className={activeTab === item.id ? 'text-primary-600' : 'text-gray-400'} />
                    {item.label}
                  </button>
                ))}
                
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="md:w-3/4">
            <div className="card p-6 md:p-8 min-h-[500px]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary-500"></div>
                </div>
              ) : (
                <>
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                        {!isEditing ? (
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} /> Edit Profile
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setIsEditing(false);
                                setProfileData({ name: user.name || '', phone: user.phone || '' });
                              }}
                              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <X size={16} /> Cancel
                            </button>
                            <button 
                              onClick={handleUpdateProfile}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Check size={16} />} 
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="input-field" 
                              value={profileData.name} 
                              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            />
                          ) : (
                            <p className="text-gray-900 font-medium px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">{user.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                          <p className="text-gray-500 font-medium px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-not-allowed" title="Email cannot be changed">{user.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Mobile Number</label>
                          {isEditing ? (
                            <input 
                              type="tel" 
                              className="input-field" 
                              value={profileData.phone} 
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              placeholder="e.g. +91 9876543210"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">{user.phone || 'Not provided'}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <MapPin className="text-primary-600" size={20} /> Saved Addresses
                        </h2>
                        {!isAddingAddress && (
                          <button onClick={() => setIsAddingAddress(true)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                            + Add New
                          </button>
                        )}
                      </div>

                      {isAddingAddress && (
                        <form onSubmit={handleAddAddress} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Address</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                              <select className="input-field" value={addressData.label} onChange={(e) => setAddressData({...addressData, label: e.target.value})}>
                                <option value="home">Home</option>
                                <option value="work">Work</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                              <input type="text" required className="input-field" value={addressData.fullName} onChange={(e) => setAddressData({...addressData, fullName: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <input type="text" required className="input-field" value={addressData.phone} onChange={(e) => setAddressData({...addressData, phone: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                              <input type="text" required className="input-field" value={addressData.pincode} onChange={(e) => setAddressData({...addressData, pincode: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                              <input type="text" required className="input-field" value={addressData.addressLine1} onChange={(e) => setAddressData({...addressData, addressLine1: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                              <input type="text" className="input-field" value={addressData.addressLine2} onChange={(e) => setAddressData({...addressData, addressLine2: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                              <input type="text" required className="input-field" value={addressData.city} onChange={(e) => setAddressData({...addressData, city: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                              <input type="text" required className="input-field" value={addressData.state} onChange={(e) => setAddressData({...addressData, state: e.target.value})} />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddingAddress(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button type="submit" disabled={isUpdating} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                              {isUpdating ? 'Saving...' : 'Save Address'}
                            </button>
                          </div>
                        </form>
                      )}

                      {!isAddingAddress && addresses.length === 0 && (
                        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center">
                          <p className="text-gray-500 mb-4">You haven't saved any addresses yet.</p>
                          <button onClick={() => setIsAddingAddress(true)} className="btn-secondary">Add New Address</button>
                        </div>
                      )}

                      {!isAddingAddress && addresses.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map(addr => (
                            <div key={addr._id} className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-colors relative">
                              <span className="absolute top-4 right-4 text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase tracking-wider">{addr.label}</span>
                              <h3 className="font-bold text-gray-900 mb-1">{addr.fullName}</h3>
                              <p className="text-sm text-gray-600 mb-1">{addr.phone}</p>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                                {addr.city}, {addr.state} {addr.pincode}
                              </p>
                              {addr.isDefault && (
                                <span className="inline-block mt-3 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">Default Address</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Orders Tab */}
                  {activeTab === 'orders' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
                      {orders.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center">
                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                          <button onClick={() => navigate('/')} className="btn-primary">Browse Restaurants</button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div key={order._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 pb-4 border-b border-gray-100 gap-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-bold text-gray-900">{order.restaurant?.name || 'Restaurant'}</h3>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {order.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                  {order.schedule?.isScheduled && order.schedule.scheduledAt && (
                                    <p className="text-sm font-medium text-amber-600 mt-1">
                                      Scheduled for: {new Date(order.schedule.scheduledAt).toLocaleString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </p>
                                  )}
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-sm text-gray-500 mb-1">Order #{order.orderNumber}</p>
                                  <p className="text-lg font-bold text-gray-900">₹{order.pricing.total}</p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 mb-4 line-clamp-1">
                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                              </div>
                              <div className="flex gap-3">
                                {order.status === 'delivered' && (
                                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                    Rate Order
                                  </button>
                                )}
                                <button className="px-4 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors">
                                  Reorder
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wallet Tab */}
                  {activeTab === 'wallet' && wallet && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">QuickServe Wallet</h2>
                      
                      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 md:p-8 text-white mb-8 shadow-lg shadow-primary-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
                        <div className="absolute bottom-0 right-10 -mb-10 w-24 h-24 rounded-full bg-white opacity-10"></div>
                        
                        <p className="text-primary-100 text-sm font-medium mb-1 uppercase tracking-wider">Available Balance</p>
                        <h3 className="text-4xl md:text-5xl font-extrabold mb-6">₹{wallet.balance}</h3>
                        
                        <div className="flex gap-4">
                          <button className="bg-white text-primary-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                            Add Money
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
                      {wallet.transactions?.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">No recent transactions.</p>
                      ) : (
                        <div className="space-y-3">
                          {wallet.transactions?.map((tx) => (
                            <div key={tx._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                              <div>
                                <p className="font-medium text-gray-900">{tx.description}</p>
                                <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleString()}</p>
                              </div>
                              <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
