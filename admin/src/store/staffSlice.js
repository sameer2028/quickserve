import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchStaff = createAsyncThunk(
  'staff/fetchStaff',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/staff');
      return response.data.data.staff;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff');
    }
  }
);

export const createStaff = createAsyncThunk(
  'staff/createStaff',
  async (staffData, { rejectWithValue }) => {
    try {
      const response = await api.post('/staff', staffData);
      return response.data.data.staff;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create staff');
    }
  }
);

export const updateStaff = createAsyncThunk(
  'staff/updateStaff',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/staff/${id}`, data);
      return response.data.data.staff;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update staff');
    }
  }
);

export const removeStaff = createAsyncThunk(
  'staff/removeStaff',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/staff/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove staff');
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState: {
    members: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearStaffError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => { state.isLoading = true; })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.members.push(action.payload);
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        const idx = state.members.findIndex(m => m._id === action.payload._id);
        if (idx !== -1) state.members[idx] = action.payload;
      })
      .addCase(removeStaff.fulfilled, (state, action) => {
        state.members = state.members.filter(m => m._id !== action.payload);
      });
  },
});

export const { clearStaffError } = staffSlice.actions;
export default staffSlice.reducer;
