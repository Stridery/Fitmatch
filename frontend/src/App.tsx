import Login from "./pages/auth/Login";
import Dashboard from './pages/user/dashboard/Dashboard';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPwd';
import MatchPage from './pages/MatchPage'
import MainPage from './pages/Main';
import HomePage from './pages/HomePage'
import ProfilePage from './pages/user/dashboard/user_main_area/Profile'
import CompleteProfilePage from './pages/user/CompleteProfilePage'


console.log("Rendering App...");

function App() {
  return (

    <Routes>
      <Route path="/" element={<HomePage />} > 
        <Route index element={<MatchPage />} />             {/* 默认显示 */}
        <Route path="/match" element={<MatchPage />} />
      </Route>
      <Route path="/main" element={<MainPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />}>
        {/* 默认子路由 */}
        <Route index element={<ProfilePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/resetPwd" element={<ResetPassword />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
    </Routes>
  );
}

export default App