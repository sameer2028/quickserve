import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, updateOrderStatus } from '../store/orderSlice';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, updatingOrders } = useSelector((state) => state.orders);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // We would pass restaurant ID here if admin manages multiple, but backend uses JWT
    dispatch(fetchOrders({ status: filter === 'all' ? undefined : filter }));
  }, [dispatch, filter]);

  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready_for_pickup', 'cancelled'],
    ready_for_pickup: ['out_for_delivery', 'delivered'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: ['refunded'],
    refunded: []
  };

  const isOptionDisabled = (currentStatus, optionValue) => {
    if (currentStatus === optionValue) return false;
    const allowed = validTransitions[currentStatus] || [];
    return !allowed.includes(optionValue);
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready_for_pickup: 'bg-green-100 text-green-800',
    out_for_delivery: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders Queue</h2>
          <p className="mt-1 text-sm text-gray-500">Manage incoming orders and update their status.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field py-1.5"
          >
            <option value="all">All Active Orders</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready_for_pickup">Ready</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found matching the criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order._id.substring(order._id.length - 6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.user?.name || '—'}</div>
                      <div className="text-xs text-gray-500">{order.user?.phone || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 capitalize">{order.orderType?.replace('_', ' ')}</span>
                        {order.schedule?.isScheduled && order.schedule.scheduledAt && (
                          <span className="text-xs text-amber-600 font-medium mt-1">
                            Scheduled: {new Date(order.schedule.scheduledAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-xs">
                        {order.items.map(i => `${i.quantity}x ${i.name || i.menuItem?.name || 'Item'}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{order.pricing?.total || order.payment?.amount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingOrders && updatingOrders[order._id]}
                        className={`text-sm rounded-md py-1 pl-2 pr-8 focus:outline-none border ${
                          updatingOrders && updatingOrders[order._id] 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                      >
                        <option value="pending" disabled={isOptionDisabled(order.status, 'pending')}>Pending</option>
                        <option value="confirmed" disabled={isOptionDisabled(order.status, 'confirmed')}>Confirmed</option>
                        <option value="preparing" disabled={isOptionDisabled(order.status, 'preparing')}>Preparing</option>
                        <option value="ready_for_pickup" disabled={isOptionDisabled(order.status, 'ready_for_pickup')}>Ready</option>
                        <option value="out_for_delivery" disabled={isOptionDisabled(order.status, 'out_for_delivery')}>Out for Delivery</option>
                        <option value="delivered" disabled={isOptionDisabled(order.status, 'delivered')}>Delivered</option>
                        <option value="cancelled" disabled={isOptionDisabled(order.status, 'cancelled')}>Cancelled</option>
                      </select>
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

export default Orders;
