import { AlertTriangle, CheckCircle2, RefreshCw, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Card } from "./ui/card"

interface LiveResult {
  status: string
  detections: number
  confidence: number
}

export function CameraStream() {
  const [online, setOnline] = useState(false)
  const [reloadKey, setReloadKey] = useState(Date.now())
  const [attempt, setAttempt] = useState(0)
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null)

  // Auto-retry every 5 seconds if offline
  useEffect(() => {
    if (online) return

    const timer = setTimeout(() => {
      setAttempt((a) => a + 1)
      setReloadKey(Date.now())
    }, 5000)

    return () => clearTimeout(timer)
  }, [online])

  // Fetch live detection results every 2 seconds
  useEffect(() => {
    if (!online) return

    const fetchResults = async () => {
      try {
        const response = await fetch('/result')
        const data = await response.json()
        setLiveResult(data)
      } catch (error) {
        console.error('Failed to fetch live results:', error)
      }
    }

    fetchResults()
    const interval = setInterval(fetchResults, 2000)
    return () => clearInterval(interval)
  }, [online])

  return (
    <Card className="relative overflow-hidden bg-card/60 border-primary/30 backdrop-blur-xl rounded-[16px]">
      {/* ===== OFFLINE OVERLAY ===== */}
      {!online && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 text-white">
          <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-bold tracking-widest uppercase">
            Re-establishing node link…
          </p>
          <p className="text-xs text-white/50 mt-1">
            ESP32-CAM MJPEG stream
          </p>

          {attempt > 0 && (
            <p className="mt-2 text-[10px] text-white/40 uppercase tracking-widest">
              Attempt {attempt}
            </p>
          )}

          <Button
            size="sm"
            variant="outline"
            className="mt-4 flex items-center gap-2"
            onClick={() => {
              setAttempt((a) => a + 1)
              setReloadKey(Date.now())
            }}
          >
            <WifiOff className="w-4 h-4" />
            Retry
          </Button>
        </div>
      )}

      {/* ===== LIVE RESULTS OVERLAY ===== */}
      {online && liveResult && (
        <div className="absolute top-4 left-4 z-10">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border",
              liveResult.detections > 0
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : "bg-green-500/20 border-green-500/30 text-green-400"
            )}
          >
            {liveResult.detections > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <div className="text-sm">
              <p className="font-bold">{liveResult.status}</p>
              {liveResult.detections > 0 && (
                <p className="text-xs">
                  {liveResult.detections} detected • {(liveResult.confidence * 100).toFixed(1)}% confidence
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== STREAM IMAGE ===== */}
      <img
        key={reloadKey}
        src={`/live?t=${reloadKey}`} // cache-buster is CRITICAL
        onLoad={() => setOnline(true)}
        onError={() => setOnline(false)}
        className={`w-full aspect-video object-contain bg-black transition-opacity duration-700 ${
          online ? "opacity-100" : "opacity-0"
        }`}
        alt="ESP32-CAM Live Stream"
      />
    </Card>
  )
}
