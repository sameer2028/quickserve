import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Package,
  PieChart,
} from 'lucide-react';

const Analytics = () => {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/analytics/restaurant?period=${period}`);
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
      setIsLoading(false);
    };
    fetchAnalytics();
  }, [period]);

  const summary = data?.summary || {};
  const revenueOverTime = data?.revenueOverTime || [];
  const topDishes = data?.topDishes || [];
  const peakHours = data?.peakHours || [];
  const orderTypeDistribution = data?.orderTypeDistribution || [];

  const periodLabels = { '1d': 'Today', '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days' };

  // Find peak hour
  const peakHour = peakHours.length > 0 ? peakHours[0] : null;

  // Order type total
  const totalOrderTypes = orderTypeDistribution.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Insights into your restaurant's performance.</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
          {Object.entries(periodLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === key
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Total Orders</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.totalOrders || 0}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-violet-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Avg Order Value</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">₹{summary.avgOrderValue || 0}</p>
            </div>
          </div>

          {/* Revenue Over Time */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Revenue Breakdown — {periodLabels[period]}
            </h3>
            {revenueOverTime.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-400">No data available.</div>
            ) : (
              <>
                {/* Bar chart visualization */}
                <div className="mb-6">
                  <div className="flex items-end gap-1 h-40">
                    {revenueOverTime.map((day) => {
                      const maxRevenue = Math.max(...revenueOverTime.map(d => d.revenue || 0), 1);
                      const height = ((day.revenue || 0) / maxRevenue) * 100;
                      return (
                        <div key={day._id} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                            ₹{day.revenue?.toLocaleString('en-IN')}
                          </span>
                          <div
                            className="w-full bg-primary-500 rounded-t-md hover:bg-primary-600 transition-all cursor-pointer min-h-[4px]"
                            style={{ height: `${Math.max(height, 3)}%` }}
                            title={`${new Date(day._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ₹${day.revenue?.toLocaleString('en-IN')} (${day.orders} orders)`}
                          />
                          <span className="text-xs text-gray-400 mt-1">
                            {new Date(day._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Revenue</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Orders</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Avg/Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {revenueOverTime.map((day) => (
                        <tr key={day._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-gray-700">
                            {new Date(day._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-emerald-600">₹{day.revenue?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{day.orders}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            ₹{day.orders > 0 ? Math.round(day.revenue / day.orders) : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Two Column: Top Dishes + Peak Hours & Order Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Dishes */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-600" />
                Top Selling Dishes
              </h3>
              {topDishes.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-gray-400">No data yet.</div>
              ) : (
                <div className="space-y-3">
                  {topDishes.map((dish, i) => {
                    const maxOrders = topDishes[0]?.totalOrders || 1;
                    const widthPercent = (dish.totalOrders / maxOrders) * 100;
                    return (
                      <div key={dish._id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">{i + 1}. {dish.name}</span>
                          <span className="text-xs text-gray-500">{dish.totalOrders} orders · ₹{dish.totalRevenue?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Peak Hours + Order Types */}
            <div className="space-y-6">
              {/* Peak Hours */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary-600" />
                  Peak Hours
                </h3>
                {peakHours.length === 0 ? (
                  <div className="h-20 flex items-center justify-center text-gray-400">No data yet.</div>
                ) : (
                  <div className="space-y-2">
                    {peakHours.slice(0, 6).map((hour) => {
                      const maxOrders = peakHours[0]?.orders || 1;
                      const widthPercent = (hour.orders / maxOrders) * 100;
                      const hourLabel = `${String(hour._id).padStart(2, '0')}:00 — ${String(hour._id + 1).padStart(2, '0')}:00`;
                      return (
                        <div key={hour._id} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-500 w-28 flex-shrink-0">{hourLabel}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${widthPercent}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-8 text-right">{hour.orders}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Type Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary-600" />
                  Order Types
                </h3>
                {orderTypeDistribution.length === 0 ? (
                  <div className="h-20 flex items-center justify-center text-gray-400">No data yet.</div>
                ) : (
                  <div className="space-y-3">
                    {orderTypeDistribution.map((type) => {
                      const percent = totalOrderTypes > 0 ? Math.round((type.count / totalOrderTypes) * 100) : 0;
                      const colors = {
                        pickup: 'bg-blue-500',
                        delivery: 'bg-emerald-500',
                        dine_in: 'bg-violet-500',
                      };
                      return (
                        <div key={type._id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-900 capitalize">{type._id?.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-gray-500">{type.count} orders ({percent}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${colors[type._id] || 'bg-gray-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
