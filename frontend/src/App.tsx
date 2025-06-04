import Login from "./pages/auth/Login";
import Dashboard from './pages/dashboard/Dashboard';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPwd';
import MainPage from './pages/Main';
import ProfilePage from './pages/user/Profile';


console.log("Rendering App...");

function App() {
  return (

    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/resetPwd" element={<ResetPassword />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default App