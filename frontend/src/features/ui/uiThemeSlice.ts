import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {updateSettings} from '../user/userProfileSlice';
import type {RootState} from '../../app/store';

const initialState = {
    mode: 'light',
};

export const toggleTheme = createAsyncThunk(
    'uiTheme/toggleTheme',
    async (_, {dispatch, getState}) => {
        const currentMode = (getState() as RootState).uiTheme.mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        dispatch(setTheme(newMode));
        dispatch(updateSettings({theme: newMode}));
    }
);

export const uiThemeSlice = createSlice({
    name: 'uiTheme',
    initialState,
    reducers: {
        setTheme: (state, action) => {
            state.mode = action.payload;
        },
    },
});

export const {setTheme} = uiThemeSlice.actions;
export default uiThemeSlice.reducer;
