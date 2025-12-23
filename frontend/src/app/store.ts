import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {persistReducer, persistStore} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '@features/auth/authSlice';
import uiThemeReducer from '@features/ui/uiThemeSlice';
import userProfileReducer from '@features/user/userProfileSlice';
import activityReducer from '@features/activity/activitySlice';
import roomsReducer from '@features/rooms/roomsSlice';
import objectivesReducer from '@features/objectives/objectivesSlice';
import activityMappingsReducer from '@features/mappings/activityMappingsSlice';
import statisticsReducer from '@features/stats/statisticsSlice';
import trackerReducer from '@features/tracker/trackerSlice';
import liveStatusReducer from '@features/tracker/liveStatusSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    uiTheme: uiThemeReducer,
    userProfile: userProfileReducer,
    activity: activityReducer,
    rooms: roomsReducer,
    objectives: objectivesReducer,
    activityMappings: activityMappingsReducer,
    statistics: statisticsReducer,
    tracker: trackerReducer,
    liveStatus: liveStatusReducer,
});

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth', 'uiTheme'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
