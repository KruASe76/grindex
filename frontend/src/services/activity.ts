import {baseQuery} from './api';

export const getActivities = () => baseQuery('/activities');

export interface CreateActivityData {
    name: string;
    emoji: string;
    color: string;
    resolution: string;
}

export interface UpdateActivityData {
    name?: string;
    emoji?: string;
    color?: string;
    resolution?: string;
    archived_at?: string | null;
    is_archived?: boolean;
}

export const createActivity = (activity: CreateActivityData) =>
    baseQuery('/activities', {
        method: 'POST',
        body: JSON.stringify(activity),
    });

export const updateActivity = (id: string, updates: UpdateActivityData) =>
    baseQuery(`/activities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });

export const logTime = (activityId: string, date: string, duration: number) =>
    baseQuery(`/activities/${activityId}/logs`, {
        method: 'POST',
        body: JSON.stringify({timestamp: date, duration_minutes: duration}),
    });
