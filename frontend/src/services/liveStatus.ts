import {baseQuery} from './api';

export const getLiveStatus = () => baseQuery('/live-status');
