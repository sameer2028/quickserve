import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ─── Categories ─────────────────────────────────────────

export const fetchCategories = createAsyncThunk(
  'menu/fetchCategories',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/menu/${restaurantId}/categories`);
      return response.data.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'menu/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await api.post('/menu/categories', categoryData);
      return response.data.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'menu/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/menu/categories/${id}`, data);
      return response.data.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'menu/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/menu/categories/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

// ─── Menu Items ─────────────────────────────────────────

export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/menu/${restaurantId}/items?limit=100`);
      return response.data.data.menuItems;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu items');
    }
  }
);

export const createMenuItem = createAsyncThunk(
  'menu/createMenuItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await api.post('/menu/items', itemData);
      return response.data.data.menuItem;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create item');
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'menu/updateMenuItem',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/menu/items/${id}`, data);
      return response.data.data.menuItem;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update item');
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'menu/deleteMenuItem',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/menu/items/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete item');
    }
  }
);

export const uploadMenuItemImage = createAsyncThunk(
  'menu/uploadMenuItemImage',
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('images', file);
      const response = await api.post(`/menu/items/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { id, images: response.data.data.images };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload image');
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    categories: [],
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearMenuError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchCategories.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.categories.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.categories[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c._id !== action.payload);
        state.items = state.items.filter(i => i.category?._id !== action.payload && i.category !== action.payload);
      })
      // Items
      .addCase(fetchMenuItems.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(uploadMenuItemImage.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i._id === action.payload.id);
        if (idx !== -1) {
          state.items[idx].images = action.payload.images;
        }
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i._id !== action.payload);
      });
  },
});

export const { clearMenuError } = menuSlice.actions;
export default menuSlice.reducer;
