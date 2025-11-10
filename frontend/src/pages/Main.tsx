// src/pages/MainPage.tsx
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function MainPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white w-full">
      {/* Dark Header */}
      <header className="w-full bg-black/95 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-50 shadow-lg">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <div
            className="text-lg sm:text-xl font-bold text-white tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200"
            onClick={() => navigate("/")}
          >
            SportaX
          </div>
          
          {/* Center Navigation */}
          <nav className="flex gap-6 sm:gap-8 text-sm font-medium text-gray-300">
            <Link to="/dashboard" className="hover:text-white transition-colors duration-200 hover:scale-105 transform hidden sm:block">Dashboard</Link>
            <Link to="/profile" className="hover:text-white transition-colors duration-200 hover:scale-105 transform hidden sm:block">Profile</Link>
          </nav>
          
          {/* Right Login Button */}
          <Link to="/login" className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 transform font-medium">
            Log In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12 sm:py-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-gray-800 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-gray-700 rounded-full opacity-15 blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto fade-in">
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 leading-tight animate-slide-in-up" style={{animationDelay: '0.2s'}}>
            Welcome to <span className="bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent">SportaX</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mb-8 sm:mb-12 leading-relaxed animate-slide-in-up" style={{animationDelay: '0.4s'}}>
            Join games, compete in series, and connect with your sports community. Find events, discover competitions, and meet fellow athletes.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-12 sm:mb-16 animate-slide-in-up" style={{animationDelay: '0.6s'}}>
            <Button 
              onClick={() => navigate("/home/community")} 
              size="lg"
              className="bg-white hover:bg-gray-100 text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-base sm:text-lg w-full sm:w-auto"
            >
              Explore Community
            </Button>
            <Button 
              onClick={() => navigate("/about")} 
              variant="outline"
              size="lg"
              className="bg-transparent backdrop-blur-sm text-white border-2 border-gray-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-800 hover:border-gray-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold text-base sm:text-lg w-full sm:w-auto"
            >
              Learn More
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-in-up" style={{animationDelay: '0.8s'}}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-white font-bold">Games</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Join Games</h3>
                <p className="text-sm sm:text-base text-gray-400">Discover and join sports events happening in your area. Connect with players and participate in games.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-in-up" style={{animationDelay: '1s'}}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-white font-bold">Competitions</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Competitions & Series</h3>
                <p className="text-sm sm:text-base text-gray-400">Participate in organized competitions and series. Challenge yourself and compete with the community.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-in-up" style={{animationDelay: '1.2s'}}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-white font-bold">Coaches</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Find Coaches</h3>
                <p className="text-sm sm:text-base text-gray-400">Connect with certified coaches and training partners. Get personalized guidance for your fitness journey.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainPage;
