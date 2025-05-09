import { useState } from "react";
import "../styles/TopBar.css";

export default function K8sTopBar() {
  const [darkMode, setDarkMode] = useState(true);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  };
  
  return (
    <header className={`topbar ${darkMode ? "dark" : "light"}`}>
      <div className="topbar-left">
        <div className="app-title">Redux Todo in Astro (Docker)</div>
      </div>
      
      <div className="topbar-right">
        <button 
          onClick={toggleDarkMode} 
          className="theme-toggle"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        
        <div className="user-info">
          <span className="username">Docker User</span>
        </div>
      </div>
    </header>
  );
}
