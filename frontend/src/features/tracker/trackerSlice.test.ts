/* eslint-disable @typescript-eslint/no-explicit-any */
import {configureStore} from '@reduxjs/toolkit';
import trackerReducer, {
    clearTracker,
    fetchActiveTracker,
    startActivityTracker,
    stopActivityTracker,
    switchActivityTracker,
} from './trackerSlice';
import {getActiveTracker, startTracker, stopTracker, switchTracker} from '../../services/tracker';

vi.mock('../../services/tracker', () => ({
    getActiveTracker: vi.fn(),
    startTracker: vi.fn(),
    stopTracker: vi.fn(),
    switchTracker: vi.fn(),
}));

const mockedGetActiveTracker = getActiveTracker as any;
const mockedStartTracker = startTracker as any;
const mockedStopTracker = stopTracker as any;
const mockedSwitchTracker = switchTracker as any;

const testActivity = {
    activity_id: 'activity-1',
    user_id: 'user-1',
    start_time: new Date().toISOString(),
};

describe('tracker slice', () => {
    let store: any;

    beforeEach(() => {
        store = configureStore({reducer: {tracker: trackerReducer}});
        vi.resetAllMocks();
    });

    it('should handle initial state', () => {
        expect(store.getState().tracker).toEqual({
            active: null,
            status: 'idle',
        });
    });

    it('should handle clearTracker', () => {
        store.dispatch({type: 'tracker/start/fulfilled', payload: testActivity});
        expect(store.getState().tracker.active).not.toBeNull();

        store.dispatch(clearTracker());
        expect(store.getState().tracker.active).toBeNull();
    });

    describe('fetchActiveTracker', () => {
        it('should handle fulfilled state with an active tracker', async () => {
            mockedGetActiveTracker.mockResolvedValue(testActivity);
            await store.dispatch(fetchActiveTracker());
            const state = store.getState().tracker;
            expect(state.status).toBe('idle');
            expect(state.active).toEqual(testActivity);
        });

        it('should handle fulfilled state with no active tracker (404)', async () => {
            mockedGetActiveTracker.mockResolvedValue(null);
            await store.dispatch(fetchActiveTracker());
            const state = store.getState().tracker;
            expect(state.status).toBe('idle');
            expect(state.active).toBeNull();
        });

        it('should handle pending state', () => {
            mockedGetActiveTracker.mockReturnValue(new Promise(() => {
            }));
            store.dispatch(fetchActiveTracker());
            expect(store.getState().tracker.status).toBe('loading');
        });

        it('should handle rejected state', async () => {
            mockedGetActiveTracker.mockRejectedValue(new Error('API Error'));
            await store.dispatch(fetchActiveTracker());
            const state = store.getState().tracker;
            expect(state.status).toBe('failed');
            expect(state.active).toBeNull();
        });
    });

    describe('startActivityTracker', () => {
        it('should set active tracker on fulfillment', async () => {
            mockedStartTracker.mockResolvedValue(testActivity);
            await store.dispatch(startActivityTracker('activity-1'));
            expect(store.getState().tracker.active).toEqual(testActivity);
        });
    });

    describe('stopActivityTracker', () => {
        it('should clear active tracker on fulfillment', async () => {
            store.dispatch({type: 'tracker/start/fulfilled', payload: testActivity});

            mockedStopTracker.mockResolvedValue(undefined);
            await store.dispatch(stopActivityTracker());
            expect(store.getState().tracker.active).toBeNull();
        });
    });

    describe('switchActivityTracker', () => {
        it('should set the new active tracker on fulfillment', async () => {
            const newActivity = {...testActivity, activity_id: 'activity-2'};
            mockedSwitchTracker.mockResolvedValue(newActivity);
            await store.dispatch(switchActivityTracker('activity-2'));
            expect(store.getState().tracker.active).toEqual(newActivity);
        });
    });
});
