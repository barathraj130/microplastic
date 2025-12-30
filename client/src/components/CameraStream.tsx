import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Settings, WifiOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

// Default mDNS address
const DEFAULT_STREAM_URL = "http://esp32cam.local:81/stream";

export function CameraStream() {
  const [streamUrl, setStreamUrl] = useState(DEFAULT_STREAM_URL);
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [manualIp, setManualIp] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const imgRef = useRef<HTMLImageElement>(null);

  // Auto-reconnect logic
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (isError) {
      timeout = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setIsError(false); // Reset error to trigger reload
      }, 3000); // Retry every 3 seconds
    }
    
    return () => clearTimeout(timeout);
  }, [isError]);

  const handleImageLoad = () => {
    setIsConnected(true);
    setIsError(false);
  };

  const handleImageError = () => {
    setIsConnected(false);
    setIsError(true);
  };

  const updateManualIp = () => {
    if (!manualIp) return;
    // Basic formatting ensuring http protocol
    const formattedIp = manualIp.startsWith("http") ? manualIp : `http://${manualIp}`;
    const finalUrl = formattedIp.includes(":81") ? formattedIp : `${formattedIp}:81`;
    
    setStreamUrl(`${finalUrl}/stream`);
    setManualIp("");
    setShowSettings(false);
    setRetryCount(0);
    setIsError(false);
  };

  return (
    <Card className="overflow-hidden bg-card/60 border-primary/30 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl relative group rounded-[16px]">
      {/* Header / Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-5 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-[28px] px-3 rounded-full text-[12px] font-bold tracking-widest flex items-center gap-1.5 backdrop-blur-md border uppercase",
            isConnected 
              ? "bg-success/20 text-success border-success/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
              : "bg-destructive/20 text-destructive border-destructive/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
          )}>
            {isConnected ? (
              <><div className="w-2 h-2 rounded-full bg-success animate-pulse" /> LIVE STREAM</>
            ) : (
              <><WifiOff className="w-3.5 h-3.5" /> SYSTEM OFFLINE</>
            )}
          </div>
          <div className="text-[11px] text-white/40 font-mono tracking-tighter bg-black/40 px-2 py-1 rounded">
            {new URL(streamUrl).hostname}
          </div>
        </div>

        <Button 
          size="icon" 
          variant="ghost" 
          className="h-9 w-9 text-white/70 hover:text-primary hover:bg-primary/10 transition-all rounded-full"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Stream Area */}
      <div className="relative aspect-video w-full flex items-center justify-center bg-[#020617]/80">
        <img
          ref={imgRef}
          src={`${streamUrl}?t=${Date.now()}`}
          alt="ESP32-CAM Live Analysis"
          className={cn(
            "max-h-full max-w-full object-contain transition-all duration-700",
            isConnected ? "opacity-100 scale-100" : "opacity-20 scale-95 blur-sm"
          )}
          style={{ imageRendering: "auto" }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Loading / Offline State Overlay */}
        <AnimatePresence>
          {!isConnected && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-white p-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
              </div>
              <h3 className="mt-8 text-[20px] font-extrabold tracking-tight text-glow">RE-ESTABLISHING NODE LINK...</h3>
              <p className="text-[14px] text-muted-foreground/60 max-w-md mt-3 text-center leading-relaxed">
                Searching for hardware identifier <span className="text-primary font-mono">{new URL(streamUrl).hostname}</span> on local subnet. Verify power status.
              </p>
              {retryCount > 0 && (
                <div className="mt-6 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  Attempt {retryCount}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute inset-0 bg-[#020617]/90 z-20 flex items-center justify-center p-8"
            >
              <div className="w-full max-w-sm space-y-6">
                <div className="flex justify-between items-center text-white border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">Node Configuration</h3>
                    <p className="text-[12px] text-muted-foreground uppercase tracking-widest">Hardware Port 81</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowSettings(false)}
                    className="h-10 w-10 text-muted-foreground hover:text-white rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Manual Override Link</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="192.168.1.X or esp32cam.local" 
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-[12px] text-[14px]"
                        value={manualIp}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualIp(e.target.value)}
                      />
                      <Button onClick={updateManualIp} className="h-11 px-6 font-bold bg-primary text-primary-foreground hover:glow-sm active:scale-95 transition-all">
                        LINK
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/40 leading-normal italic">
                    Note: The system attempts to resolve via mDNS by default. Re-linking will reset all temporary cache layers.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}


