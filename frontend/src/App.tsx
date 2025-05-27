import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Header from "./components/Header";
import Login from "./pages/Login";
import Dashboard from './pages/Dashboard';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPwd';
import MainPage from './pages/Main';
import ProfilePage from './pages/Profile';


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