import axios from "axios"
import { motion } from "framer-motion"
import { Activity, AlertTriangle, Camera, Smartphone, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

interface HistoryEntry {
  status: string
  detections: number
  confidence: number
  color: "safe" | "danger"
  image_url?: string
  timestamp: number
}

interface DashboardStats {
  totalScans: number
  detectionsToday: number
  avgConfidence: number
  activeDevices: number
}

interface RecentDetection {
  id: number
  time: string
  count: number
  confidence: number
  status: "High" | "Medium" | "Low"
  color: "safe" | "danger"
}

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalScans: 0,
    detectionsToday: 0,
    avgConfidence: 0,
    activeDevices: 1,
  })
  const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await axios.get("/api/history")
      const history: HistoryEntry[] = response.data

      // Calculate total scans
      const totalScans = history.length

      // Get detections from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = Math.floor(today.getTime() / 1000)

      const detectionsToday = history.filter(
        (entry) => entry.timestamp >= todayTimestamp && entry.detections > 0
      ).length

      // Calculate average confidence
      const confidences = history
        .filter((entry) => entry.confidence > 0)
        .map((entry) => entry.confidence)

      const avgConfidence =
        confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : 0

      // Get recent detections (last 4)
      const recent = history.slice(0, 4).map((entry, index) => {
        const confidencePercent = entry.confidence * 100

        return {
          id: index + 1,
          time: formatTime(entry.timestamp),
          count: entry.detections,
          confidence: parseFloat(confidencePercent.toFixed(1)),
          status:
            confidencePercent >= 90
              ? "High"
              : confidencePercent >= 70
              ? "Medium"
              : "Low" as "High" | "Medium" | "Low",
          color: entry.color,
        }
      })

      setStats({
        totalScans,
        detectionsToday,
        avgConfidence: avgConfidence * 100,
        activeDevices: 1, // ESP32-CAM
      })

      setRecentDetections(recent)
      setLoading(false)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      // Set default values on error
      setStats({
        totalScans: 0,
        detectionsToday: 0,
        avgConfidence: 0,
        activeDevices: 1,
      })
      setRecentDetections([])
      setLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000
    const diff = now - timestamp

    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1520] to-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1520] to-[#0a0e1a] p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-4xl font-black text-white">Dashboard</h1>
          <p className="text-gray-400">Real-time microplastic monitoring overview</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-400">Total Scans</p>
                <p className="text-3xl font-black text-white">{stats.totalScans}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-400">Detections Today</p>
                <p className="text-3xl font-black text-white">{stats.detectionsToday}</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-orange-500 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-400">Avg Confidence</p>
                <p className="text-3xl font-black text-white">
                  {stats.avgConfidence > 0 ? stats.avgConfidence.toFixed(1) : "0.0"}%
                </p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-green-500 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-gray-400">Active Devices</p>
                <p className="text-3xl font-black text-white">{stats.activeDevices}</p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3">
                <Camera className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-transparent" />
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Detections */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl"
          >
            <div className="border-b border-white/10 p-6">
              <h2 className="text-xl font-bold text-white">Recent Detections</h2>
            </div>
            <div className="p-6">
              {recentDetections.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No detections yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start analyzing samples to see data here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDetections.map((detection, i) => (
                    <motion.div
                      key={detection.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-lg ${
                            detection.status === "High"
                              ? "bg-red-500/20"
                              : detection.status === "Medium"
                              ? "bg-orange-500/20"
                              : "bg-green-500/20"
                          } flex items-center justify-center`}
                        >
                          <AlertTriangle
                            className={`h-5 w-5 ${
                              detection.status === "High"
                                ? "text-red-500"
                                : detection.status === "Medium"
                                ? "text-orange-500"
                                : "text-green-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {detection.count} particle{detection.count !== 1 ? "s" : ""} detected
                          </p>
                          <p className="text-sm text-gray-400">{detection.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{detection.confidence}%</p>
                        <p className="text-xs text-gray-400">confidence</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl">
              <div className="border-b border-white/10 p-6">
                <h2 className="text-xl font-bold text-white">Quick Actions</h2>
              </div>
              <div className="space-y-3 p-6">
                <button
                  onClick={() => navigate("/live")}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50"
                >
                  <Camera className="mb-1 inline h-5 w-5" /> Start Live Detection
                </button>
                <button 
                  onClick={() => navigate("/node")}
                  className="w-full rounded-xl border border-[#ff8c00]/40 bg-[#ff8c00]/10 px-6 py-4 font-bold text-white transition-all hover:bg-[#ff8c00]/20"
                >
                  <Smartphone className="mb-1 inline h-5 w-5 mr-2" /> Link Remote Node
                </button>
                <button 
                  onClick={() => navigate("/live")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10"
                >
                  Upload Sample
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10"
                >
                  View History
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl">
              <div className="border-b border-white/10 p-6">
                <h2 className="text-xl font-bold text-white">System Status</h2>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">ESP32-CAM</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold text-green-500">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">AI Model</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-semibold text-blue-500">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Backend API</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold text-green-500">Running</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}