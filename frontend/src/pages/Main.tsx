// src/pages/MainPage.tsx
import { useNavigate } from "react-router-dom";
import "../styles/Main.css";

function MainPage() {
  const navigate = useNavigate();

  return (
    <div className="main-page">
      <header className="main-header">
        <div className="logo">FITMATCH</div>
        <nav className="nav-links">
          <span onClick={() => navigate("/dashboard")}>Dashboard</span>
          <span onClick={() => navigate("/profile")}>Profile</span>
          <span onClick={() => navigate("/login")}>Log In</span>
        </nav>
      </header>

      <section className="hero-section">
        <h1>Welcome to FitMatch</h1>
        <p>Find your perfect coach or student partner and start training smarter today.</p>
        <div className="hero-buttons">
          <button onClick={() => navigate("/match")}>Start Matching</button>
          <button onClick={() => navigate("/about")}>Learn More</button>
        </div>
      </section>
    </div>
  );
}

export default MainPage;
