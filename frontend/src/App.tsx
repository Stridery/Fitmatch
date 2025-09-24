import Login from "./pages/auth/Login";
import Dashboard from './pages/user/dashboard/Dashboard';
import CoachLayout from '@/layouts/CoachLayout'
import './App.css';
import { Route, Routes, Navigate } from 'react-router-dom';
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
          {/* Existing user dashboard */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="coach" element={<CoachLayout />}>
              <Route index element={<CoachCenterPage />} />
              <Route path="sports/new" element={<SportEditor />} />
              <Route path="sports/:id" element={<SportDetailPage />} />
              <Route path="sports/:id/edit" element={<SportEditor />} />
              <Route path="sports/:coachSportId/course" element={<CourseEditor />} />
              <Route path="sports/:coachSportId/course/new" element={<CourseEditorPage />} />
              <Route path="sports/:coachSportId/course/:courseId/edit" element={<CourseEditorPage />} />
              <Route path="sports/:id/sessions" element={<SessionsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Full-screen onboarding (no sidebar) */}
        <Route path="/coach/onboarding" element={<CoachApplicationForm />} />
        <Route path="/become-a-coach" element={<Navigate to="/coach/onboarding" replace />} />

        <Route element={<RequireAuth requireProfile = {false}/>}>
          <Route path="/coach-application" element={<CoachApplicationForm />}/>
        </Route>

        {/* Legacy redirects from old /coach paths to new /dashboard/coach paths */}
        <Route path="/coach" element={<Navigate to="/dashboard/coach" replace />} />
        <Route path="/coach/sports/:id" element={<Navigate to="/dashboard/coach/sports/:id" replace />} />
        <Route path="/coach/sports/:id/edit" element={<Navigate to="/dashboard/coach/sports/:id/edit" replace />} />
        <Route path="/coach/sports/:coachSportId/course" element={<Navigate to="/dashboard/coach/sports/:coachSportId/course" replace />} />
        <Route path="/coach/sports/:coachSportId/course/new" element={<Navigate to="/dashboard/coach/sports/:coachSportId/course/new" replace />} />
        <Route path="/coach/sports/:coachSportId/course/:courseId/edit" element={<Navigate to="/dashboard/coach/sports/:coachSportId/course/:courseId/edit" replace />} />
        <Route path="/coach/sports/:id/sessions" element={<Navigate to="/dashboard/coach/sports/:id/sessions" replace />} />
      </Routes>
      {/* Globally mounted Chat Dock (desktop-only) */}
      <ChatDock />
    </UserProvider>
  );
}

export default App;