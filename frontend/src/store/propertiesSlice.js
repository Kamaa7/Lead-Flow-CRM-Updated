import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  properties: [],
  loading: false,
  error: null,
  totalProperties: 0,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async ({ page = 1, limit = 10, search = '' }, { rejectWithValue }) => {
    try {
      const response = await api.get('/properties', {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch properties');
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/createProperty',
  async (propertyData, { rejectWithValue }) => {
    try {
      const response = await api.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create property');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/updateProperty',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/properties/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update property');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/deleteProperty',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/properties/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete property');
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload.properties || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.totalProperties = action.payload.total || 0;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create property
      .addCase(createProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.properties.unshift(action.payload);
        state.totalProperties += 1;
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update property
      .addCase(updateProperty.fulfilled, (state, action) => {
        const index = state.properties.findIndex(property => property.id === action.payload.id);
        if (index !== -1) {
          state.properties[index] = action.payload;
        }
      })
      // Delete property
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.properties = state.properties.filter(property => property.id !== action.payload);
        state.totalProperties -= 1;
      });
  },
});

export const { clearError } = propertiesSlice.actions;
export default propertiesSlice.reducer;