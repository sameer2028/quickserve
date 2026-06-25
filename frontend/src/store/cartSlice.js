import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/cart');
    return response.data.data.cart;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async (itemData, { rejectWithValue }) => {
  try {
    const { item, ...apiData } = itemData;
    const response = await api.post('/cart/add', apiData);
    return response.data.data.cart;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add item');
  }
});

export const updateQuantity = createAsyncThunk('cart/updateQuantity', async ({ itemIndex, quantity }, { rejectWithValue }) => {
  try {
    const response = await api.put('/cart/update-quantity', { itemIndex, quantity });
    return response.data.data.cart;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update quantity');
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (itemId, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/cart/item/${itemId}`);
    return response.data.data.cart;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove item');
  }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart/clear');
    return null;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
  }
});

const initialState = {
  cart: null,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state, action) => {
        const { menuItemId, quantity, item } = action.meta.arg;
        if (!state.cart) {
          state.cart = { items: [], subtotal: 0, total: 0 };
        }
        
        const existingItem = state.cart.items.find(i => 
          i.menuItem === menuItemId || (i.menuItem && i.menuItem._id === menuItemId)
        );
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else if (item) {
          state.cart.items.push({
            _id: 'temp_' + Date.now(),
            menuItem: item,
            name: item.name,
            price: item.discountPrice || item.price,
            quantity: quantity,
          });
        }
        
        state.cart.subtotal = state.cart.items.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);
        state.cart.total = state.cart.subtotal;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(updateQuantity.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.cart = null;
      });
  },
});

export default cartSlice.reducer;
