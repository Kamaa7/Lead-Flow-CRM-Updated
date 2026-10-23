import { createSlice, nanoid } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: [],
  reducers: {
    addNotification: {
      reducer(state, action) {
        state.unshift(action.payload);
        if (state.length > 20) state.pop(); // keep max 20 notifications
      },
      prepare(message, type = 'info') {
        return {
          payload: {
            id: nanoid(),
            message,
            type,
            timestamp: Date.now(),
          },
        };
      },
    },
    clearNotifications: (state) => [],
  },
});

export const { addNotification, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer; 