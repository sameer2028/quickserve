import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import orderReducer from './orderSlice';
import menuReducer from './menuSlice';
import dashboardReducer from './dashboardSlice';
import staffReducer from './staffSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: orderReducer,
    menu: menuReducer,
    dashboard: dashboardReducer,
    staff: staffReducer,
  },
});

export default store;
