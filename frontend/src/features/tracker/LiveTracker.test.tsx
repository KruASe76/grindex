/* eslint-disable @typescript-eslint/no-explicit-any */
import {render, screen} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {vi} from 'vitest';
import {LiveTracker} from './LiveTracker';
import trackerReducer from './trackerSlice';
import activityReducer from '../activity/activitySlice';
import uiThemeReducer from '../ui/uiThemeSlice';
import {ThemeProvider} from '@components/ThemeProvider';

vi.mock('../../app/hooks', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: any) => any) => selector(
        {
            tracker: {
                active: {
                    activity_id: '1',
                    start_time: new Date().toISOString(),
                }
            },
            activity: {
                list: [
                    {id: '1', name: 'Test Activity', emoji: '🧪'}
                ]
            },
            uiTheme: {
                mode: 'light'
            }
        }
    ),
}));

const mockStore = configureStore({
    reducer: {
        tracker: trackerReducer,
        activity: activityReducer,
        uiTheme: uiThemeReducer,
    },
    preloadedState: {
        tracker: {
            active: {
                user_id: 'user1',
                activity_id: '1',
                start_time: new Date().toISOString(),
            },
            status: 'idle' as const
        },
        activity: {
            list: [
                {id: '1', name: 'Test Activity', emoji: '🧪', color: '#fff', resolution: 'day', archived_at: null}
            ],
            loading: false,
            error: null
        },
        uiTheme: {
            mode: 'light'
        }
    }
});

describe('LiveTracker', () => {
    it('renders when there is an active activity', () => {
        render(
            <Provider store={mockStore}>
                <ThemeProvider>
                    <LiveTracker/>
                </ThemeProvider>
            </Provider>
        );

        expect(screen.getByText('Test Activity')).toBeInTheDocument();
        expect(screen.getByText('Stop')).toBeInTheDocument();
    });
});
