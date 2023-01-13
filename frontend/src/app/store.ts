import { configureStore } from '@reduxjs/toolkit';
import authReducer from "../features/auth/authSlice";
import playlistReducer from "../features/playlists/playlistSlice";
import deleteReducer from '../features/misc/deleteSlice';
import songReducer from '../features/misc/songSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    playlists: playlistReducer,
    deleting: deleteReducer,
    song: songReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;