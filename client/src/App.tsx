import { AnimatePresence, motion } from "framer-motion";
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import { cn } from "./lib/utils";
import { Dashboard } from "./pages/Dashboard";
import { LiveDetection } from "./pages/LiveDetection";
import { Login } from "./pages/Login";
import { About, History, Settings } from "./pages/Placeholders";

// Simple background wrapper for dashboard pages to maintain the theme
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-[#05070a] text-white font-sans relative">
      
      {/* Top Bar Navigation */}
      <div className="h-[72px] border-b border-white/10 bg-[#0A1128]/80 backdrop-blur-[12px] sticky top-0 z-50">
        <div className="container flex h-full items-center max-w-[1200px] mx-auto px-8 justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3 group translate-y-[-2px]">
              <div className="w-10 h-10 rounded-[8px] bg-[#007bff] flex items-center justify-center shadow-[0_0_15px_rgba(0,123,255,0.4)] group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-black text-xl">M</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-white group-hover:text-[#007bff] transition-colors leading-none">MICROPLASTICS</span>
                <span className="text-[10px] font-black tracking-[0.3em] text-[#ff8c00] leading-none mt-1 uppercase">Detection App</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-10">
              {[
                { name: "MONITOR", path: "/dashboard" },
                { name: "ANALYSIS", path: "/history" },
                { name: "HARDWARE", path: "/settings" }
              ].map((tab) => (
                <Link 
                  key={tab.path} 
                  to={tab.path}
                  className={cn(
                    "text-[12px] font-bold tracking-[0.15em] transition-all hover:text-[#007bff] relative py-2",
                    location.pathname === tab.path ? "text-[#007bff]" : "text-[#a0aec0]"
                  )}
                >
                  {tab.name}
                  {location.pathname === tab.path && (
                    <motion.div layoutId="nav-glow" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#ff8c00] shadow-[0_0_8px_#ff8c00]" />
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-[6px] bg-black/40 border border-[#27ae60]/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] animate-pulse" />
                <span className="text-[10px] font-black text-[#2ecc71] uppercase tracking-widest">Secure Node Active</span>
              </div>
            </div>
        </div>
      </div>

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/live" element={<Layout><LiveDetection /></Layout>} />
        <Route path="/history" element={<Layout><History /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
