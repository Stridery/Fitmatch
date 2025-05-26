import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Header from "./components/Header";
import Login from "./components/Login";
import Dashboard from './components/Dashboard';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import SignUp from './components/SignUp';


console.log("Rendering App...");

function App() {
  return (

    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/signup" element={<SignUp />} />
    </Routes>
  );
}

export default App