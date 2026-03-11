import { AnimatePresence, motion } from "framer-motion"
import {
    Link,
    Navigate,
    Route,
    BrowserRouter as Router,
    Routes,
    useLocation,
} from "react-router-dom"
import { cn } from "./lib/utils"
import { Dashboard } from "./pages/Dashboard"
import { LiveDetection } from "./pages/LiveDetection"
import { Login } from "./pages/Login"
import { NodePage } from "./pages/NodePage"
import { About, History, Settings } from "./pages/Placeholders"

/* ======================================================
   Layout Wrapper (ONLY for authenticated pages)
====================================================== */
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#05070a] text-white relative">
      {/* ================= TOP BAR ================= */}
      <header className="h-[72px] sticky top-0 z-50 border-b border-white/10 bg-[#0A1128]/80 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#007bff] flex items-center justify-center shadow-[0_0_15px_rgba(0,123,255,0.4)]">
              <span className="font-black text-xl">A</span>
            </div>
            <div className="leading-none">
              <div className="text-lg font-black tracking-tight">
                NIVORA AI
              </div>
              <div className="text-[10px] tracking-[0.3em] font-black text-[#ff8c00] uppercase mt-1">
                Detection App
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {[
              { name: "MONITOR", path: "/dashboard" },
              { name: "ANALYSIS", path: "/history" },
              { name: "HARDWARE", path: "/settings" },
            ].map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "relative text-[12px] font-bold tracking-[0.15em] transition-colors py-2",
                  location.pathname === tab.path
                    ? "text-[#007bff]"
                    : "text-[#a0aec0] hover:text-[#007bff]"
                )}
              >
                {tab.name}
                {location.pathname === tab.path && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#ff8c00] shadow-[0_0_8px_#ff8c00]"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/40 border border-green-500/30">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
              System Active
            </span>
          </div>
        </div>
      </header>

      {/* ================= PAGE CONTENT ================= */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="max-w-[1200px] mx-auto px-6 py-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

/* ======================================================
   App Routes
====================================================== */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public route - Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes with Layout */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/live"
          element={
            <Layout>
              <LiveDetection />
            </Layout>
          }
        />
        <Route
          path="/history"
          element={
            <Layout>
              <History />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <Settings />
            </Layout>
          }
        />
        <Route
          path="/about"
          element={
            <Layout>
              <About />
            </Layout>
          }
        />
        <Route path="/node" element={<NodePage />} />

        {/* Fallback - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}