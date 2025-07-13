// src/pages/MainPage.tsx
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button"

function MainPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      {/* ✅ Header 全屏 */}
      <header className="w-full bg-white shadow-sm border-b">
        <div className="w-full flex items-center justify-between px-6 py-4">
          <div
            className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer"
            onClick={() => navigate("/")}
          >
            FITMATCH
          </div>
          <nav className="flex gap-6 text-sm font-medium text-gray-700">
            <Link to="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link>
            <Link to="/profile" className="hover:text-blue-600 transition">Profile</Link>
            <Link to="/login" className="hover:text-blue-600 transition">Log In</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 w-full bg-gradient-to-b from-gray-100 via-white to-gray-100 flex flex-col items-center justify-center text-center px-6 py-12">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">FitMatch</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10">
          Find your perfect coach or student partner and start training smarter today.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => navigate("/home/match")} className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition duration-300">
            Start Matching
          </Button>
          <Button onClick={() => navigate("/about")} className="bg-white text-gray-800 border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-100 shadow-sm transition duration-300">
            Learn More
          </Button>
        </div>
      </main>
    </div>
  );
}

export default MainPage;
