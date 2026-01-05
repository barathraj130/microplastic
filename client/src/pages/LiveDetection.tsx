import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { CameraStream } from "../components/CameraStream"
import { Hero } from "../components/Hero"
import { UploadZone } from "../components/UploadZone"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { cn } from "../lib/utils"

interface AnalysisResult {
  status: string
  detections: number
  confidence: number
  timestamp: number
  image_url: string
  color?: "safe" | "danger"
}

export function LiveDetection() {
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const reset = () => {
    setResult(null)
    setStarted(false)
  }

  return (
    <div className="space-y-10">
      {/* ================= HEADER ================= */}
      <div className="flex items-center">
        <Link to="/dashboard">
          <Button
            variant="ghost"
            className="pl-0 text-[#a0aec0] hover:text-[#007bff] font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Command Center
          </Button>
        </Link>
      </div>

      {/* ================= CONTENT ================= */}
      <AnimatePresence mode="wait">
        {/* ================= HERO ================= */}
        {!started && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Hero onStart={() => setStarted(true)} />
          </motion.div>
        )}

        {/* ================= LIVE + UPLOAD ================= */}
        {started && !result && (
          <motion.div
            key="live"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* ===== TITLE ===== */}
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Optical Analysis
              </h1>
              <p className="text-sm text-[#a0aec0] max-w-2xl">
                Microscopic sensor synchronization via ESP32-CAM (MJPEG) for
                real-time polymer classification.
              </p>
            </div>

            {/* ===== WORKSPACE ===== */}
            <div className="max-w-3xl mx-auto space-y-8">
              {/* ===== LIVE CAMERA ===== */}
              <Card className="p-4 bg-[#101830]/80 border-white/10 backdrop-blur">
                <CameraStream />
              </Card>

              {/* ===== DIVIDER ===== */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#05070a] px-2 text-[#4a5568] font-bold tracking-widest">
                    Or upload manual sample
                  </span>
                </div>
              </div>

              {/* ===== UPLOAD ===== */}
              <Card className="p-4 bg-[#101830]/80 border-white/10 backdrop-blur">
                <UploadZone onResult={setResult} />
              </Card>
            </div>
          </motion.div>
        )}

        {/* ================= RESULT ================= */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid lg:grid-cols-3 gap-8">
              {/* ===== IMAGE ===== */}
              <div className="lg:col-span-2">
                <Card className="overflow-hidden border-white/10 bg-[#101830]/80 backdrop-blur">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <img
                      src={result.image_url}
                      alt="Detection Result"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </Card>
              </div>

              {/* ===== REPORT ===== */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">
                    Analysis Report
                  </h2>
                  <p className="text-xs text-[#a0aec0]">
                    {new Date(result.timestamp * 1000).toLocaleTimeString()}
                  </p>
                </div>

                <Card className="bg-[#101830]/80 border-white/10 backdrop-blur">
                  <CardContent className="p-6 space-y-6">
                    {/* ===== STATUS ===== */}
                    <div
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-md border",
                        result.detections > 0
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-green-500/10 border-green-500/30 text-green-400"
                      )}
                    >
                      {result.detections > 0 ? (
                        <AlertTriangle className="h-6 w-6 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="h-6 w-6" />
                      )}
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-70">
                          Status
                        </p>
                        <p className="text-lg font-extrabold">
                          {result.status}
                        </p>
                      </div>
                    </div>

                    {/* ===== CONFIDENCE ===== */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs uppercase text-[#a0aec0] font-bold">
                          Confidence
                        </span>
                        <span className="text-xl font-black text-[#007bff]">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${result.confidence * 100}%`,
                          }}
                          transition={{ duration: 1.2 }}
                          className="h-full bg-[#007bff]"
                        />
                      </div>
                    </div>

                    {/* ===== ACTION ===== */}
                    <Button
                      onClick={reset}
                      className="w-full bg-[#ff8c00] hover:bg-[#e67e00] font-bold"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      New Analysis
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}