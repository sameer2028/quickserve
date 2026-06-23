import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyRestaurant } from '../store/dashboardSlice';
import api from '../services/api';
import {
  Store,
  MapPin,
  Clock,
  ToggleLeft,
  ToggleRight,
  Save,
  Phone,
  Mail,
  IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const dispatch = useDispatch();
  const { restaurant } = useSelector((state) => state.dashboard);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    cuisine: '',
    avgCostForTwo: '',
    foodType: 'both',
    minOrderAmount: '',
    deliveryFee: '',
    taxRate: '',
    features: {
      acceptsPickup: true,
      acceptsDelivery: true,
      acceptsDineIn: true,
    },
  });

  useEffect(() => {
    dispatch(fetchMyRestaurant());
  }, [dispatch]);

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        cuisine: restaurant.cuisine?.join(', ') || '',
        avgCostForTwo: String(restaurant.avgCostForTwo || ''),
        foodType: restaurant.foodType || 'both',
        minOrderAmount: String(restaurant.minOrderAmount || ''),
        deliveryFee: String(restaurant.deliveryFee || ''),
        taxRate: String(restaurant.taxRate || ''),
        features: {
          acceptsPickup: restaurant.features?.acceptsPickup ?? true,
          acceptsDelivery: restaurant.features?.acceptsDelivery ?? true,
          acceptsDineIn: restaurant.features?.acceptsDineIn ?? true,
        },
      });
    }
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant?._id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        phone: form.phone,
        email: form.email,
        cuisine: form.cuisine.split(',').map(c => c.trim()).filter(Boolean),
        avgCostForTwo: parseInt(form.avgCostForTwo) || 0,
        foodType: form.foodType,
        minOrderAmount: parseInt(form.minOrderAmount) || 0,
        deliveryFee: parseInt(form.deliveryFee) || 0,
        taxRate: parseFloat(form.taxRate) || 0,
        features: form.features,
      };

      await api.put(`/restaurants/${restaurant._id}`, payload);
      toast.success('Settings saved successfully');
      dispatch(fetchMyRestaurant());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    }
    setIsSubmitting(false);
  };

  const toggleFeature = (key) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  };

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your restaurant details and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-primary-600" />
            Restaurant Info
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisines (comma-separated)</label>
              <input
                type="text"
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                className="input-field"
                placeholder="Indian, Fast Food, Chinese"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Food Type</label>
              <div className="flex gap-3">
                {['veg', 'non_veg', 'both'].map((type) => (
                  <label
                    key={type}
                    className={`px-4 py-2 rounded-lg border-2 cursor-pointer text-sm font-medium transition-all ${
                      form.foodType === type
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="foodType"
                      value={type}
                      checked={form.foodType === type}
                      onChange={(e) => setForm({ ...form, foodType: e.target.value })}
                      className="sr-only"
                    />
                    {type === 'veg' ? 'Vegetarian' : type === 'non_veg' ? 'Non-Vegetarian' : 'Both'}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary-600" />
            Pricing & Fees
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avg Cost for Two (₹)</label>
              <input
                type="number"
                value={form.avgCostForTwo}
                onChange={(e) => setForm({ ...form, avgCostForTwo: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₹)</label>
              <input
                type="number"
                value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ToggleLeft className="h-5 w-5 text-primary-600" />
            Service Options
          </h3>
          <div className="space-y-4">
            {[
              { key: 'acceptsPickup', label: 'Pickup', desc: 'Allow customers to order and pick up' },
              { key: 'acceptsDelivery', label: 'Delivery', desc: 'Deliver orders to customer location' },
              { key: 'acceptsDineIn', label: 'Dine-In', desc: 'Customers can pre-order for dine-in' },
            ].map((feature) => (
              <div key={feature.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{feature.label}</p>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFeature(feature.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.features[feature.key] ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    form.features[feature.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Address (read-only) */}
        {restaurant.address && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Address
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              {restaurant.address.street && <p>{restaurant.address.street}</p>}
              <p>
                {[restaurant.address.city, restaurant.address.state, restaurant.address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {restaurant.address.country && <p>{restaurant.address.country}</p>}
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
