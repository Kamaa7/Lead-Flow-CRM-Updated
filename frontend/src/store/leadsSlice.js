import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
import { addNotification } from './notificationsSlice';

const initialState = {
  leads: [],
  loading: false,
  error: null,
  totalLeads: 0,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async ({ page = 1, limit = 10, search = '' }, { rejectWithValue }) => {
    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return {
        leads: data,
        pagination: { page, limit, total: count },
        total: count,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch leads');
    }
  }
);

export const createLead = createAsyncThunk(
  'leads/createLead',
  async (leadData, { rejectWithValue, dispatch }) => {
    try {
      const { data, error } = await supabase.from('leads').insert([leadData]).select().single();
      if (error) throw error;
      dispatch(addNotification(`New lead added: ${data.name}`));
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create lead');
    }
  }
);

export const updateLead = createAsyncThunk(
  'leads/updateLead',
  async ({ id, data: updateData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.from('leads').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update lead');
    }
  }
);

export const deleteLead = createAsyncThunk(
  'leads/deleteLead',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      // Find the lead's name before deleting for notification
      const lead = getState().leads.leads.find(l => l.id === id);
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      if (lead) dispatch(addNotification(`Lead deleted: ${lead.name}`));
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete lead');
    }
  }
);

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leads
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload.leads || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.totalLeads = action.payload.total || 0;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create lead
      .addCase(createLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.loading = false;
        state.leads.unshift(action.payload);
        state.totalLeads += 1;
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update lead
      .addCase(updateLead.fulfilled, (state, action) => {
        const index = state.leads.findIndex(lead => lead.id === action.payload.id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
      })
      // Delete lead
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter(lead => lead.id !== action.payload);
        state.totalLeads -= 1;
      });
  },
});

export const { clearError } = leadsSlice.actions;
export default leadsSlice.reducer;