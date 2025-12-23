import {baseQuery} from './api';

export interface MappingData {
    activity_id: string;
    objective_id: string;
    weight?: number;
}

export const fetchMappings = (roomId: string) =>
    baseQuery(`/rooms/${roomId}/mapping`);

export const updateMapping = (roomId: string, mapping: MappingData) =>
    baseQuery(`/rooms/${roomId}/mapping`, {
        method: 'PUT',
        body: JSON.stringify(mapping),
    });

export const deleteMapping = (roomId: string, activityId: string, objectiveId: string) =>
    baseQuery(`/rooms/${roomId}/mapping?activity_id=${activityId}&objective_id=${objectiveId}`, {
        method: 'DELETE',
    });
