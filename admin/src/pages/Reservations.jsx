import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { CalendarClock, Check, X, User, Loader2 } from 'lucide-react';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal State
  const [assignModal, setAssignModal] = useState({ isOpen: false, reservationId: null });
  const [selectedTable, setSelectedTable] = useState('');

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations/restaurant/all');
      setReservations(res.data.data.reservations);
    } catch (err) {
      toast.error('Failed to fetch reservations');
    }
  };

  const fetchTables = async () => {
    try {
      const res = await api.get('/reservations/tables');
      setTables(res.data.data.tables);
    } catch (err) {
      toast.error('Failed to fetch tables');
    }
  };

  useEffect(() => {
    Promise.all([fetchReservations(), fetchTables()]).finally(() => setLoading(false));
  }, []);

  const handleAssignTable = async () => {
    if (!selectedTable) return toast.error('Please select a table');
    setActionLoading('assigning');
    try {
      await api.patch(`/reservations/${assignModal.reservationId}/assign-table`, { tableId: selectedTable });
      toast.success('Table assigned successfully');
      setAssignModal({ isOpen: false, reservationId: null });
      setSelectedTable('');
      await fetchReservations();
      await fetchTables(); // Refresh tables to show updated status
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign table');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(`${id}-${status}`);
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      toast.success(`Reservation status updated to ${status}`);
      await fetchReservations();
      await fetchTables();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations & Tables</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Reservations */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Requests</h2>
          <div className="grid gap-4">
            {reservations.filter(r => r.status === 'pending').map((res) => (
              <div key={res._id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{res.customer?.name}</span>
                    <span className="text-sm text-gray-500">({res.guestCount} guests)</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Date:</strong> {new Date(res.date).toLocaleDateString()} at {res.timeSlot?.start}</p>
                    {res.specialRequests && <p className="text-amber-600 dark:text-amber-400 mt-1">Note: {res.specialRequests}</p>}
                    {res.order && res.order.items && res.order.items.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
                        <p className="font-semibold text-gray-900 dark:text-white mb-1 text-xs uppercase tracking-wider">Pre-Ordered Items</p>
                        <ul className="space-y-1">
                          {res.order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm">
                              <span><span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity}x</span> {item.name}</span>
                              {item.variant?.name && <span className="text-xs text-gray-500">({item.variant.name})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignModal({ isOpen: true, reservationId: res._id })}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
                  >
                    Assign Table
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(res._id, 'rejected')}
                    disabled={actionLoading === `${res._id}-rejected`}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors flex items-center justify-center disabled:opacity-50 min-w-[80px]"
                  >
                    {actionLoading === `${res._id}-rejected` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
            {reservations.filter(r => r.status === 'pending').length === 0 && (
              <p className="text-gray-500 italic">No pending reservations.</p>
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white pt-6">Confirmed & Active</h2>
          <div className="grid gap-4">
            {reservations.filter(r => ['confirmed', 'checked_in'].includes(r.status)).map((res) => (
              <div key={res._id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-l-4 border-l-primary-500 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{res.customer?.name} - Table {res.assignedTable?.tableNumber}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Guests: {res.guestCount} | Date: {new Date(res.date).toLocaleDateString()} | Time: {res.timeSlot?.start}</p>
                  
                  {res.order && res.order.items && res.order.items.length > 0 && (
                    <div className="mt-3 mb-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-slate-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1 text-xs uppercase tracking-wider">Pre-Ordered Items</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {res.order.items.map((item, idx) => (
                          <li key={idx}>{item.quantity}x {item.name} {item.variant?.name ? `(${item.variant.name})` : ''}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${res.status === 'checked_in' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {res.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(res._id, 'checked_in')}
                      disabled={actionLoading === `${res._id}-checked_in`}
                      className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center justify-center disabled:opacity-50 min-w-[80px]"
                    >
                      {actionLoading === `${res._id}-checked_in` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check In'}
                    </button>
                  )}
                  {res.status === 'checked_in' && (
                    <button
                      onClick={() => handleUpdateStatus(res._id, 'completed')}
                      disabled={actionLoading === `${res._id}-completed`}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center justify-center disabled:opacity-50 min-w-[80px]"
                    >
                      {actionLoading === `${res._id}-completed` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tables Overview */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Table Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {tables.map(table => (
              <div 
                key={table._id} 
                className={`p-4 rounded-xl border text-center ${
                  table.status === 'available' ? 'bg-white border-gray-200 text-gray-800 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-200' :
                  table.status === 'reserved' ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800' :
                  'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="text-2xl font-bold">{table.tableNumber}</div>
                <div className="text-xs mt-1 opacity-80 uppercase tracking-wide">{table.status}</div>
                <div className="text-xs mt-1 text-gray-500">Cap: {table.capacity}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-6 text-center">Manage tables in Settings</p>
        </div>
      </div>

      {/* Assign Table Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Assign Table</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Select an available table for this reservation.</p>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white mb-6 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose a table --</option>
              {tables.filter(t => t.status === 'available').map(t => (
                 <option key={t._id} value={t._id}>Table {t.tableNumber} (Capacity: {t.capacity})</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setAssignModal({ isOpen: false, reservationId: null })}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignTable}
                disabled={actionLoading === 'assigning'}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center disabled:opacity-50 min-w-[150px]"
              >
                {actionLoading === 'assigning' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
