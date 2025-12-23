import api from './api';

export interface ActiveActivity {
    user_id: string;
    activity_id: string;
    start_time: string;
}

export const startTracker = async (activityId: string): Promise<ActiveActivity> => {
    const response = await api.post('/activities/active', {activity_id: activityId});
    return response;
};

export const stopTracker = async (): Promise<void> => {
    await api.delete('/activities/active');
};

export const switchTracker = async (activityId: string): Promise<ActiveActivity> => {
    const response = await api.put('/activities/active', {activity_id: activityId});
    return response;
};

export const getActiveTracker = async (): Promise<ActiveActivity> => {
    const response = await api.get('/activities/active');
    return response;
};
