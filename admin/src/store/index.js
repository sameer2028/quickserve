import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import orderReducer from './orderSlice';
import menuReducer from './menuSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: orderReducer,
    menu: menuReducer,
  },
});

export default store;
