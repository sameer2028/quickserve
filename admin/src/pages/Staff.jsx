import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStaff, createStaff, removeStaff } from '../store/staffSlice';
import {
  Users,
  Plus,
  Trash2,
  X,
  Mail,
  Shield,
  UserCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Staff = () => {
  const dispatch = useDispatch();
  const { members, isLoading } = useSelector((state) => state.staff);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    staffRole: 'chef',
  });

  useEffect(() => {
    dispatch(fetchStaff());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createStaff(form)).unwrap();
      toast.success('Staff member added');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', staffRole: 'chef' });
    } catch (err) {
      toast.error(err || 'Failed to add staff');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this staff member? They will lose access to the admin portal.')) return;
    try {
      await dispatch(removeStaff(id)).unwrap();
      toast.success('Staff member removed');
    } catch (err) {
      toast.error(err || 'Failed to remove staff');
    }
  };

  const roleLabels = {
    chef: { label: 'Kitchen Staff', color: 'bg-orange-100 text-orange-700' },
    cashier: { label: 'Counter Staff', color: 'bg-blue-100 text-blue-700' },
    delivery_staff: { label: 'Delivery Staff', color: 'bg-green-100 text-green-700' },
    manager: { label: 'Manager', color: 'bg-violet-100 text-violet-700' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your restaurant team members and their roles.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-48"></div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members yet</h3>
          <p className="text-gray-500 mb-6">Add team members so they can help manage orders and the kitchen.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const role = roleLabels[member.staffRole] || { label: member.staffRole, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={member._id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {member.user?.avatar?.url ? (
                      <img src={member.user.avatar.url} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-lg">
                          {member.user?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{member.user?.name || 'Unknown'}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.user?.email || '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(member._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove staff"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                    <Shield className="h-3 w-3" />
                    {role.label}
                  </span>
                  {member.user?.phone && (
                    <span className="text-xs text-gray-400">{member.user.phone}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Add Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(roleLabels).map(([key, val]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                        form.staffRole === key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="staffRole"
                        value={key}
                        checked={form.staffRole === key}
                        onChange={(e) => setForm({ ...form, staffRole: e.target.value })}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{val.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
