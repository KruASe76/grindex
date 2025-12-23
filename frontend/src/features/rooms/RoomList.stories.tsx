/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Meta, StoryObj} from '@storybook/react';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import {configureStore} from '@reduxjs/toolkit';
import {RoomList} from './RoomList';
import roomsReducer from './roomsSlice';
import userProfileReducer from '../user/userProfileSlice';
import liveStatusReducer from '../tracker/liveStatusSlice';

// Mock Redux store
const createMockStore = (initialState: any) =>
    configureStore({
        reducer: {
            rooms: roomsReducer,
            userProfile: userProfileReducer,
            liveStatus: liveStatusReducer,
        } as any,
        preloadedState: initialState,
    });

const meta: Meta<typeof RoomList> = {
    title: 'Features/Rooms/RoomList',
    component: RoomList,
    decorators: [
        (Story) => (
            <MemoryRouter>
                <Story/>
            </MemoryRouter>
        ),
    ],
};
export default meta;

type Story = StoryObj<typeof RoomList>;

const mockRooms = [
    {id: '1', name: 'Competitive Programming', resolution: 'day', admin_id: 'user-1'},
    {id: '2', name: 'Daily LeetCode', resolution: 'week', admin_id: 'user-2'},
    {id: '3', name: 'Project Grindex', resolution: 'month', admin_id: 'user-1'},
];

const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    full_name: 'Admin User',
};

const defaultState = {
    rooms: {list: mockRooms, loading: false, error: null},
    userProfile: {profile: mockUser, status: 'idle'},
    liveStatus: {rooms: {}},
};

export const Default: Story = {
    decorators: [
        (Story) => {
            const store = createMockStore(defaultState);
            return (
                <Provider store={store}>
                    <Story/>
                </Provider>
            );
        },
    ],
};

export const WithLiveRooms: Story = {
    decorators: [
        (Story) => {
            const store = createMockStore({
                ...defaultState,
                liveStatus: {
                    rooms: {
                        '2': {
                            'objective-1': ['user-3']
                        }
                    }
                }
            });
            return (
                <Provider store={store}>
                    <Story/>
                </Provider>
            );
        },
    ],
};

export const Empty: Story = {
    decorators: [
        (Story) => {
            const store = createMockStore({
                ...defaultState,
                rooms: {list: [], loading: false, error: null},
            });
            return (
                <Provider store={store}>
                    <Story/>
                </Provider>
            );
        },
    ],
};

export const Loading: Story = {
    decorators: [
        (Story) => {
            const store = createMockStore({
                ...defaultState,
                rooms: {list: [], loading: true, error: null},
            });
            return (
                <Provider store={store}>
                    <Story/>
                </Provider>
            );
        },
    ],
};
