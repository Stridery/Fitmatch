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
import CoachCenterPage from "./pages/coach/CoachCenterPage";
import SportDetailPage from "./pages/coach/SportDetailPage";
import SportEditor from "./pages/coach/SportEditor";
import CourseEditor from "./pages/coach/CourseEditor";
import CourseEditorPage from "./pages/coach/CourseEditorPage";
import SessionsPage from "./pages/coach/SessionsPage";
import ChatDock from "./pages/community/chatDock/ChatDock";
//console.log("Rendering App...");

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<MainPage />} />
        

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgetPwd" element={<ForgetPassword />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route element={<RequireAuth requireAuth={false}/>}>
          <Route path="/home" element={<HomePage />}> 
            <Route index element={<MatchPage />} />
            <Route path="match" element={<MatchPage />} />
            <Route path="community" element={<CommunityPage />} />
          </Route>
          
          
        </Route>

        <Route element={<RequireAuth/>}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          
        </Route>

        <Route element={<RequireAuth requireProfile = {false}/>}>
          <Route path="/coach-application" element={<CoachApplicationForm />}/>
          <Route path="/coach" element={<CoachCenterPage />} />
          <Route path="/coach/sports/:id" element={<SportDetailPage />} />
          <Route path="/coach/sports/:id/edit" element={<SportEditor />} />
          <Route path="/coach/sports/:coachSportId/course" element={<CourseEditor />} />
          <Route path="/coach/sports/:coachSportId/course/new" element={<CourseEditorPage />} />
          <Route path="/coach/sports/:coachSportId/course/:courseId/edit" element={<CourseEditorPage />} />
          <Route path="/coach/sports/:id/sessions" element={<SessionsPage />} />
        </Route>
      </Routes>
      {/* Globally mounted Chat Dock (desktop-only) */}
      <ChatDock />
    </UserProvider>
  );
}

export default App;