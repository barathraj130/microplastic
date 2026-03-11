import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Card } from "./ui/card"

interface LiveResult {
  status: string
  detections: number
  confidence: number
}

export function CameraStream({ cameraId = "esp32", fill = false }: { cameraId?: string, fill?: boolean }) {
  const [online, setOnline] = useState(false)
  const [reloadKey, setReloadKey] = useState(Date.now())
  const [attempt, setAttempt] = useState(0)
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null)

  const [rotation, setRotation] = useState(0)

  // Auto-retry every 5 seconds if offline
  useEffect(() => {
    if (online) return

    const timer = setTimeout(() => {
      setAttempt((a) => a + 1)
      setReloadKey(Date.now())
    }, 5000)

    return () => clearTimeout(timer)
  }, [online])

  const rotate = () => setRotation((r) => (r + 90) % 360)

  // Fetch live detection results every 2 seconds
  useEffect(() => {
    if (!online) return

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/result/${cameraId}`)
        const data = await response.json()
        setLiveResult(data)
      } catch (error) {
        console.error('Failed to fetch live results:', error)
      }
    }

    fetchResults()
    const interval = setInterval(fetchResults, 2000)
    return () => clearInterval(interval)
  }, [online, cameraId])

  return (
    <Card className={cn(
      "relative overflow-hidden bg-card/60 border-primary/30 backdrop-blur-xl rounded-[16px]",
      fill ? "flex-1 w-full" : "w-full"
    )}>
      {/* ===== OFFLINE OVERLAY ===== */}
      {!online && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 text-white">
          <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-bold tracking-widest uppercase text-center px-4">
             Linking {cameraId} Sensor Node...
          </p>
          <p className="text-[10px] text-white/50 mt-1 uppercase tracking-tighter">
            AI Cluster Entrypoint
          </p>

          <Button
            size="sm"
            variant="outline"
            className="mt-6 flex items-center gap-2 border-white/20 bg-white/5"
            onClick={() => {
              setAttempt((a) => a + 1)
              setReloadKey(Date.now())
            }}
          >
            <RefreshCw className="w-3 h-3" />
            RETRY HANDSHAKE
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
              <p className="font-bold uppercase text-[10px] tracking-widest opacity-60">{cameraId} Module</p>
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

      {/* ===== POWER + ROTATE TOGGLE ===== */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="font-bold shadow-xl bg-white/10 hover:bg-white/20 border-white/10"
          onClick={rotate}
        >
          <RefreshCw className="w-3 h-3" />
        </Button>

        {cameraId === "iphone" && (
          <Button
            size="sm"
            variant={online ? "destructive" : "default"}
            className="flex items-center gap-2 font-bold shadow-xl bg-[#ff3b30] hover:bg-[#d63229] border-none"
            onClick={async () => {
              const endpoint = online ? "/api/camera/local/stop" : "/api/camera/local/start"
              try {
                await fetch(endpoint, { method: "POST" })
                if (online) {
                  setOnline(false)
                } else {
                  setAttempt(0)
                  setReloadKey(Date.now())
                }
              } catch (e) {
                console.error("Camera control failed", e)
              }
            }}
          >
            {online ? "STOP SENSOR" : "START SENSOR"}
          </Button>
        )}
      </div>

      {/* ===== STREAM IMAGE ===== */}
      <div className={cn(
        "bg-black flex items-center justify-center overflow-hidden",
        fill ? "flex-1 min-h-[70vh]" : "aspect-video"
      )}>
        <img
          key={reloadKey}
          src={`/api/live/${cameraId}?t=${reloadKey}`} // cache-buster is CRITICAL
          onLoad={() => setOnline(true)}
          onError={() => setOnline(false)}
          style={{ transform: `rotate(${rotation}deg)` }}
          className={cn(
            "w-full h-full transition-all duration-700 object-contain",
            online ? "opacity-100" : "opacity-0"
          )}
          alt={`${cameraId} Live Stream`}
        />
      </div>
    </Card>
  )
}
