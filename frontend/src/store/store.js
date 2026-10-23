import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import leadsSlice from './leadsSlice';
import propertiesSlice from './propertiesSlice';
import tasksSlice from './tasksSlice';
import analyticsSlice from './analyticsSlice';
import notificationsSlice from './notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    leads: leadsSlice,
    properties: propertiesSlice,
    tasks: tasksSlice,
    analytics: analyticsSlice,
    notifications: notificationsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});