import {baseQuery} from './api';

export const getObjectives = (roomId: string) =>
    baseQuery(`/rooms/${roomId}/objectives`);

export interface CreateObjectiveData {
    name: string;
    emoji: string;
    color: string;
}

export const createObjective = (roomId: string, objective: CreateObjectiveData) =>
    baseQuery(`/rooms/${roomId}/objectives`, {
        method: 'POST',
        body: JSON.stringify(objective),
    });

export const updateObjective = (roomId: string, objectiveId: string, objective: Partial<CreateObjectiveData>) =>
    baseQuery(`/rooms/${roomId}/objectives/${objectiveId}`, {
        method: 'PATCH',
        body: JSON.stringify(objective),
    });

export const deleteObjective = (roomId: string, objectiveId: string) =>
    baseQuery(`/rooms/${roomId}/objectives/${objectiveId}`, {
        method: 'DELETE',
    });
