import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats, fetchRecentOrders, fetchMyRestaurant } from '../store/dashboardSlice';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, recentOrders, restaurant, isLoading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRecentOrders());
    dispatch(fetchMyRestaurant());
  }, [dispatch]);

  const summary = stats?.summary || {};
  const revenueData = stats?.revenueOverTime || [];
  const topDishes = stats?.topDishes || [];

  const statCards = [
    {
      label: 'Total Orders',
      value: summary.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Revenue',
      value: `₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Avg Order Value',
      value: `₹${summary.avgOrderValue || 0}`,
      icon: TrendingUp,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50',
      textColor: 'text-violet-700',
    },
    {
      label: 'Period',
      value: summary.period === '7d' ? 'Last 7 Days' : summary.period || '—',
      icon: Clock,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready_for_pickup: 'bg-green-100 text-green-800',
    out_for_delivery: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back{restaurant ? `, ${restaurant.name}` : ''}. Here's your overview for the last 7 days.
        </p>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                  <div className={`p-2 rounded-lg ${stat.lightColor}`}>
                    <Icon className={`h-5 w-5 ${stat.textColor}`} />
                  </div>
                </div>
                <dd className="mt-3">
                  <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                </dd>
              </div>
            );
          })}
        </div>
      )}

      {/* Two Column: Revenue + Top Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Revenue Over Time
          </h3>
          {revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <p>No revenue data available for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-medium text-gray-500">Date</th>
                    <th className="text-right py-2 font-medium text-gray-500">Revenue</th>
                    <th className="text-right py-2 font-medium text-gray-500">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((day) => (
                    <tr key={day._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 text-gray-700">{new Date(day._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td className="py-2.5 text-right font-medium text-emerald-600">₹{day.revenue?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right text-gray-600">{day.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Dishes */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary-600" />
            Top Selling Dishes
          </h3>
          {topDishes.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <p>No dish data available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topDishes.slice(0, 5).map((dish, i) => (
                <div key={dish._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : 
                      i === 1 ? 'bg-gray-100 text-gray-700' : 
                      i === 2 ? 'bg-orange-100 text-orange-700' : 
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{dish.name}</p>
                      <p className="text-xs text-gray-500">{dish.totalOrders} orders</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">₹{dish.totalRevenue?.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No recent orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order._id?.substring(order._id.length - 6)}</div>
                      {order.schedule?.isScheduled && order.schedule.scheduledAt && (
                        <div className="text-xs text-amber-600 font-medium mt-1">
                          Scheduled: {new Date(order.schedule.scheduledAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.customer?.name || order.user?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {order.items?.map(i => `${i.quantity}x ${i.name || i.menuItem?.name}`).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {order.status?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ₹{order.pricing?.total || order.payment?.amount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
