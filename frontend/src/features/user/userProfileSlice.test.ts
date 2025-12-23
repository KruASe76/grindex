import userProfileReducer, {fetchUserProfile, updateSettings} from './userProfileSlice';

describe('userProfile reducer', () => {
    const initialState = {
        profile: null,
        loading: false,
        error: null,
    };

    it('should handle initial state', () => {
        expect(userProfileReducer(undefined, {type: 'unknown'})).toEqual(initialState);
    });

    it('should handle fetchUserProfile.pending', () => {
        const actual = userProfileReducer(initialState, fetchUserProfile.pending('requestId', undefined));
        expect(actual.loading).toEqual(true);
    });

    it('should handle fetchUserProfile.fulfilled', () => {
        const profile = {id: '1', email: 'test@test.com', full_name: 'Test', created_at: '', settings: null};
        const actual = userProfileReducer(initialState, fetchUserProfile.fulfilled(profile, 'requestId', undefined));
        expect(actual.loading).toEqual(false);
        expect(actual.profile).toEqual(profile);
    });

    it('should handle updateSettings.fulfilled', () => {
        const stateWithProfile = {
            ...initialState,
            profile: {
                id: '1',
                email: 'test@test.com',
                full_name: 'Test',
                created_at: '',
                settings: {theme: 'light' as const, updated_at: ''}
            },
        };
        const newSettings = {theme: 'dark' as const, updated_at: 'now'};
        const actual = userProfileReducer(stateWithProfile, updateSettings.fulfilled(newSettings, 'requestId', {theme: 'dark'}));
        expect(actual.profile?.settings).toEqual(newSettings);
    });
});
