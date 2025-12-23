import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {ThemeProvider} from './components/ThemeProvider';
import {Layout} from './components/Layout/Layout';
import {ProtectedRoute} from './components/ProtectedRoute';
import {LoginPage} from './pages/LoginPage';
import {RegisterPage} from './pages/RegisterPage';
import {DashboardPage} from './pages/DashboardPage';
import {ProfilePage} from './pages/ProfilePage';
import {RoomListPage} from './pages/RoomListPage';
import {RoomDetailPage} from './pages/RoomDetailPage';
import './App.css';

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>

                    <Route element={<Layout/>}>
                        <Route element={<ProtectedRoute/>}>
                            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                            <Route path="/dashboard" element={<DashboardPage/>}/>
                            <Route path="/profile" element={<ProfilePage/>}/>
                            <Route path="/rooms" element={<RoomListPage/>}/>
                            <Route path="/rooms/:roomId" element={<RoomDetailPage/>}/>
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
