import { Camera, Settings, StopCircle, Wifi } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"

/**
 * PhoneNode: Turns any mobile browser into an AI Optical Sensor.
 * It grabs the back camera, takes snapshots, and POSTs them to /api/analyze.
 */
export function PhoneNode() {
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState("Offline")
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<any>(null)

  // Enumerate cameras on load
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices()
        const videoDevs = devs.filter(d => d.kind === 'videoinput')
        setDevices(videoDevs)
        if (videoDevs.length > 0) setSelectedDevice(videoDevs[0].deviceId)
      } catch (e) {
        console.error("Device listing failed", e)
      }
    }
    getDevices()
  }, [])

  const startLens = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: { ideal: "environment" }, // PREFER BACK CAMERA
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setActive(true)
        setStatus("Lens Active - Syncing...")
        
        // Start capture loop
        timerRef.current = setInterval(captureAndSend, 500) // 2 FPS is enough for web analysis
      }
    } catch (err) {
      console.error("Lens error:", err)
      setStatus("Error: Permission denied")
    }
  }

  const stopLens = () => {
    setActive(false)
    setStatus("Offline")
    if (timerRef.current) clearInterval(timerRef.current)
    if (videoRef.current?.srcObject) {
      ;(videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    }
  }

  const captureAndSend = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Sync dimensions
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight

    // Draw frame
    ctx.drawImage(videoRef.current, 0, 0)

    // Convert to compressed JPG
    const b64 = canvas.toDataURL('image/jpeg', 0.6)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64, source: 'phone_node' })
      })
      
      if (res.ok) {
        setStatus("Node Linked ✅")
      } else {
        setStatus("Sync Failed ❌")
      }
    } catch (e) {
      setStatus("Network Error 📶")
    }
  }

  return (
    <Card className="p-6 bg-[#0a0f1e]/80 border-white/10 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-6">
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          {!active && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <Camera className="w-12 h-12 text-white/20" />
            </div>
          )}
        </div>

        {/* Device Selection Dropdown */}
        {!active && (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#a0aec0] flex items-center gap-1">
                <Settings className="w-3 h-3" /> Select Hardware Node
              </p>
              <button 
                onClick={async () => {
                  const devs = await navigator.mediaDevices.enumerateDevices()
                  setDevices(devs.filter(d => d.kind === 'videoinput'))
                }}
                className="text-[10px] text-[#007bff] hover:underline font-bold"
              >
                Refresh Sensors
              </button>
            </div>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full bg-[#0d1520] border border-white/10 text-xs text-white rounded-lg p-3 outline-none focus:border-[#007bff] transition-all cursor-pointer appearance-none"
            >
              {devices.length === 0 && <option value="">No sensors found</option>}
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-4 w-full">
          <div className="flex-1">
            <h3 className="text-white font-bold uppercase text-[10px] tracking-[0.2em] mb-1">
              Optical Node Status
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${active ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`} />
              <p className="text-sm font-medium text-white/80">{status}</p>
            </div>
          </div>

          <Button
            onClick={active ? stopLens : startLens}
            variant={active ? "destructive" : "default"}
            className="font-bold flex items-center gap-2 px-6 bg-[#007bff] hover:bg-[#005ecb]"
          >
            {active ? (
              <>
                <StopCircle className="w-4 h-4" /> DISCONNECT
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" /> ACTIVATE LENS
              </>
            )}
          </Button>
        </div>
        
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        <p className="text-[10px] text-white/30 uppercase tracking-widest text-center mt-4">
          Open this page on your target phone to use it as a remote microplastic sensor.
        </p>
      </div>
    </Card>
  )
}
