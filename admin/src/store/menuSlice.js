import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchAdminMenu = createAsyncThunk(
  'menu/fetchAdmin',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/restaurants/${restaurantId}/menu`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu');
    }
  }
);

export const toggleMenuItem = createAsyncThunk(
  'menu/toggleItem',
  async ({ itemId, isAvailable }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/menu/${itemId}`, { isAvailable });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle item');
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMenu.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminMenu.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.menuItems;
      })
      .addCase(fetchAdminMenu.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(toggleMenuItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i._id === action.payload.menuItem._id);
        if (index !== -1) {
          state.items[index] = action.payload.menuItem;
        }
      });
  },
});

export default menuSlice.reducer;
