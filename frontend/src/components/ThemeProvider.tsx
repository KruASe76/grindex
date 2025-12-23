import {useEffect} from 'react';
import {useAppSelector} from '../app/hooks';

export const ThemeProvider = ({children}: { children: React.ReactNode }) => {
    const theme = useAppSelector((state) => state.uiTheme.mode);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return <>{children}</>;
};
