import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Menu } from 'lucide-react';
import { fetchMyRestaurant } from '../store/dashboardSlice';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { restaurant } = useSelector((state) => state.dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Fetch restaurant details so it's globally available in the layout
    dispatch(fetchMyRestaurant());
  }, [dispatch]);

  const displayName = restaurant?.name || user?.name || 'Restaurant Owner';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 ml-0 md:ml-64 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center md:hidden gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 -ml-1 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Quick<span className="text-primary-600">Serve</span>
            </h1>
          </div>
          <div className="hidden sm:block">
            {/* Can put a search bar or breadcrumbs here */}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button> */}
            
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-gray-900">{displayName}</span>
                <span className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
