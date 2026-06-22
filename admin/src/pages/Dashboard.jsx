import React from 'react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your restaurant's performance today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        {[
          { label: 'Total Orders', value: '24', change: '+12%' },
          { label: 'Revenue', value: '₹14,500', change: '+8.2%' },
          { label: 'Active Queue', value: '5', change: '-2' },
          { label: 'Avg Prep Time', value: '18 min', change: '-2 min' },
        ].map((stat, i) => (
          <div key={i} className="card p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
            <dd className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-gray-900">{stat.value}</span>
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </dd>
          </div>
        ))}
      </div>

      <div className="card p-6 min-h-[400px] flex items-center justify-center bg-white">
        <p className="text-gray-500">Analytics Charts Coming Soon...</p>
      </div>
    </div>
  );
};

export default Dashboard;
