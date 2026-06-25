import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async ({ status, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/restaurant/orders', { params: { status, page, limit } });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    pagination: {},
    isLoading: false,
    updatingOrders: {},
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateOrderStatus.pending, (state, action) => {
        if (!state.updatingOrders) state.updatingOrders = {};
        state.updatingOrders[action.meta.arg.orderId] = true;
        
        // Optimistic update for instant UI feedback
        const index = state.orders.findIndex(o => o._id === action.meta.arg.orderId);
        if (index !== -1) {
          // Store old status in meta for potential rollback (requires manual handling if needed)
          state.orders[index].status = action.meta.arg.status;
        }
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        if (state.updatingOrders) delete state.updatingOrders[action.meta.arg.orderId];
        const index = state.orders.findIndex(o => o._id === action.payload.order._id);
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        if (state.updatingOrders) delete state.updatingOrders[action.meta.arg.orderId];
        state.error = action.payload;
      });
  },
});

export default orderSlice.reducer;
