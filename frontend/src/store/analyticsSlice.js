import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  dashboardStats: {
    totalLeads: 0,
    totalProperties: 0,
    totalTasks: 0,
    completedTasks: 0,
    leadConversionRate: 0,
    monthlyGrowth: 0,
  },
  leadsByStatus: [],
  leadsBySource: [],
  propertiesByType: [],
  tasksByStatus: [],
  monthlyLeads: [],
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'analytics/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchLeadAnalytics = createAsyncThunk(
  'analytics/fetchLeadAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics/leads');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch lead analytics');
    }
  }
);

export const fetchPropertyAnalytics = createAsyncThunk(
  'analytics/fetchPropertyAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics/properties');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch property analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch lead analytics
      .addCase(fetchLeadAnalytics.fulfilled, (state, action) => {
        state.leadsByStatus = action.payload.leadsByStatus || [];
        state.leadsBySource = action.payload.leadsBySource || [];
        state.monthlyLeads = action.payload.monthlyLeads || [];
      })
      // Fetch property analytics
      .addCase(fetchPropertyAnalytics.fulfilled, (state, action) => {
        state.propertiesByType = action.payload.propertiesByType || [];
      });
  },
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;