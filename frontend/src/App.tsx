import Login from "./pages/auth/Login";
import Dashboard from './pages/user/dashboard/Dashboard';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import SignUp from './pages/auth/SignUp';
import ResetPassword from "./pages/auth/ResetPwd";
import ForgetPassword from "./pages/auth/ForgetPwd";
import MatchPage from './pages/MatchPage';
import MainPage from './pages/Main';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/user/dashboard/user_main_area/Profile';
import CompleteProfilePage from './pages/user/userProfile/CompleteProfilePage';
import CommunityPage from './pages/community/CommunityPage';
import RequireAuth from "./components/RequireAuth";
import { UserProvider } from "./contexts/UserContext";
import CoachApplicationForm from "./pages/coach/CoachApplicationForm";


//console.log("Rendering App...");

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/home" element={<HomePage />}> 
          <Route index element={<MatchPage />} />
          <Route path="match" element={<MatchPage />} />
          <Route path="community" element={<CommunityPage />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgetPwd" element={<ForgetPassword />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route element={<RequireAuth requireProfile = {false}/>}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          
        </Route>

        <Route element={<RequireAuth requireProfile = {false}/>}>
          <Route path="/coach-application" element={<CoachApplicationForm />}/>
        </Route>
      </Routes>
    </UserProvider>
  );
}

export default App;