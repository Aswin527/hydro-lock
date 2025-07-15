import { useEffect, useState } from 'react';
import WaterUsageDashboard from './WaterUsageDashboard';
import logo from './assets/h_logo.png';

const LandingPage = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Redirect to dashboard after 3 seconds
      setShowDashboard(true);
    }, 3000);

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, []);

  // Show dashboard if redirect triggered
  if (showDashboard) {
    return <WaterUsageDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center overflow-hidden" style={{backgroundColor: '#e0f2fe'}}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main logo container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with heartbeat animation */}
        <div className="relative mb-8">
          {/* Logo image with heartbeat effect */}
          <img 
            src={logo} 
            alt="HydroLock Logo" 
            className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain heartbeat-logo"
            onError={(e) => {
              // Fallback to text if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback text (hidden by default) */}
          <div className="absolute inset-0 items-center justify-center text-blue-800 text-2xl md:text-3xl lg:text-4xl font-bold" style={{display: 'none'}}>
            HL
          </div>
        </div>
        
        {/* App name/title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-blue-800 mb-4 animate-pulse">
          <span className="font-light">HYDRO</span><span className="font-bold">LOCK</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-blue-600 text-lg md:text-xl opacity-80 mb-2">
          Secure Water Management
        </p>
        
        {/* Progress bar */}
        <div className="w-64 bg-blue-200 rounded-full h-2 mb-4 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full animate-pulse loading-bar"></div>
        </div>
        
        {/* Loading indicator */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% { 
            transform: scale(1); 
          }
          25% { 
            transform: scale(1.05); 
          }
          50% { 
            transform: scale(1.1); 
          }
          75% { 
            transform: scale(1.05); 
          }
        }
        
        @keyframes loadingBar {
          0% { 
            width: 0%; 
          }
          100% { 
            width: 100%; 
          }
        }
        
        .heartbeat-logo {
          animation: heartbeat 1.5s ease-in-out infinite;
        }
        
        .loading-bar {
          animation: loadingBar 3s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;