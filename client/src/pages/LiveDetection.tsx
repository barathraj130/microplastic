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
  const [viewMode, setViewMode] = useState<"dual" | "esp32" | "iphone">("dual")
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const reset = () => {
    setResult(null)
  }

  return (
    <div className="space-y-10">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard">
          <Button
            variant="ghost"
            className="pl-0 text-[#a0aec0] hover:text-[#007bff] font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Command Center
          </Button>
        </Link>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
           <Button 
            size="sm" 
            variant={viewMode === "dual" ? "default" : "ghost"}
            onClick={() => setViewMode("dual")}
            className="text-[10px] font-black uppercase tracking-tighter"
           >Dual View</Button>
           <Button 
            size="sm" 
            variant={viewMode === "esp32" ? "default" : "ghost"}
            onClick={() => setViewMode("esp32")}
            className="text-[10px] font-black uppercase tracking-tighter"
           >ESP32 Only</Button>
           <Button 
            size="sm" 
            variant={viewMode === "iphone" ? "default" : "ghost"}
            onClick={() => setViewMode("iphone")}
            className="text-[10px] font-black uppercase tracking-tighter"
           >iPhone Only</Button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <AnimatePresence mode="wait">
        {!result && (
          <motion.div
            key="live"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            {/* ##### TITLE ##### */}
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-white">
                   Optical Analysis Node
                </h1>
                <p className="text-sm text-[#a0aec0]">
                   Analyze your samples across the optical array.
                </p>
              </div>
            </div>

            {/* ##### WORKSPACE ##### */}
            <div className={cn(
               "mx-auto space-y-12 transition-all duration-500",
               viewMode === "dual" ? "max-w-7xl" : "max-w-none px-4"
            )}>
              
              <div className={cn(
                "grid gap-6 transition-all duration-500",
                viewMode === "dual" ? "md:grid-cols-2" : "grid-cols-1"
              )}>
                {(viewMode === "dual" || viewMode === "esp32") && (
                   <Card className={cn(
                     "p-4 bg-[#101830]/80 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden",
                     viewMode !== "dual" && "min-h-[80vh] flex flex-col"
                   )}>
                     <CameraStream cameraId="esp32" fill={viewMode !== "dual"} />
                   </Card>
                )}
                
                {(viewMode === "dual" || viewMode === "iphone") && (
                   <Card className={cn(
                     "p-4 bg-[#101830]/80 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden",
                     viewMode !== "dual" && "min-h-[80vh] flex flex-col"
                   )}>
                     <CameraStream cameraId="iphone" fill={viewMode !== "dual"} />
                   </Card>
                )}
              </div>

              {/* ##### UPLOAD PANEL ##### */}
              <div className="pt-8">
                <UploadZone onResult={setResult} />
              </div>

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