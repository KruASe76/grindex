import objectivesReducer, {addObjective} from './objectivesSlice';

vi.mock('../../services/objectives', () => ({
    createObjective: vi.fn(),
    deleteObjective: vi.fn(),
    getObjectives: vi.fn(),
    updateObjective: vi.fn(),
}));

describe('objectives slice', () => {
    it('does not duplicate an objective already loaded by a concurrent fetch', () => {
        const objective = {
            id: 'objective-1',
            name: 'Test Objective',
            emoji: '🎯',
            color: '#FF0000',
        };
        const state = {
            list: [objective],
            loading: false,
            error: null,
        };

        const nextState = objectivesReducer(
            state,
            addObjective.fulfilled(
                objective,
                'request-1',
                {
                    roomId: 'room-1',
                    objective: {
                        name: objective.name,
                        emoji: objective.emoji,
                        color: objective.color,
                    },
                },
            ),
        );

        expect(nextState.list).toEqual([objective]);
    });
});
