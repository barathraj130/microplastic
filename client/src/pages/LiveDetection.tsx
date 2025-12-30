import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { UploadZone } from "../components/UploadZone";
import { cn } from "../lib/utils";

import { CameraStream } from "../components/CameraStream";

interface AnalysisResult {
  status: string;
  detections: number;
  confidence: string;
  color: "safe" | "danger";
  timestamp: number;
  image_url: string;
}

export function LiveDetection() {
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleResult = (data: AnalysisResult) => {
    setResult(data);
  };

  const reset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      {/* Navigation Header */}
      <div className="h-[52px] border-b border-white/10 bg-[#0A1128]/80 backdrop-blur-[12px]">
        <div className="container max-w-[1200px] mx-auto px-8 h-full flex items-center">
             <Link to="/dashboard">
                <Button variant="ghost" className="h-[36px] pl-0 text-[#a0aec0] hover:text-[#007bff] transition-colors font-bold text-[12px] uppercase tracking-wider">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Command Center
                </Button>
             </Link>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-8 py-8 space-y-8">
        <AnimatePresence mode="wait">
          {!started ? (
             <motion.div
              key="hero"
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-12"
            >
              <Hero onStart={() => setStarted(true)} />
            </motion.div>
          ) : !result ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="space-y-2">
                <h1 className="text-[40px] font-extrabold tracking-tight text-white">
                  Optical Analysis
                </h1>
                <p className="text-[15px] text-[#a0aec0]">
                  Microscopic sensor synchronization via ESP32-CAM (MJPEG-V8)
                </p>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-8">
                <CameraStream />
                
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

                <UploadZone onResult={handleResult} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 max-w-5xl mx-auto"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <Card className="overflow-hidden border-white/10 shadow-2xl bg-[#101830]/80 backdrop-blur-[12px] rounded-[8px] border-[1px]">
                    <div className="relative aspect-video bg-black/40 flex items-center justify-center">
                      <img
                        src={result.image_url}
                        alt="Analysis Result"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </Card>
                </div>

                {/* Analysis Stats Sidebar */}
                <div className="space-y-6">
                   <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold tracking-tight text-white">
                      Analysis Report
                    </h2>
                    <p className="text-sm text-[#a0aec0] font-medium">
                      Generated at {new Date(result.timestamp * 1000).toLocaleTimeString()}
                    </p>
                  </div>

                  <Card className="bg-[#101830]/80 border-white/10 backdrop-blur-[12px] shadow-xl rounded-[8px] border-[1px]">
                    <CardContent className="p-6 space-y-6">
                      <div className={cn(
                        "flex items-center gap-3 p-4 rounded-[6px] border transition-all duration-500",
                        result.color === "danger" 
                          ? "bg-[#c0392b]/10 border-[#c0392b]/30 text-[#c0392b]" 
                          : "bg-[#27ae60]/10 border-[#27ae60]/30 text-[#2ecc71]"
                      )}>
                        {result.color === "danger" ? (
                          <AlertTriangle className="h-6 w-6 animate-pulse" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6" />
                        )}
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[10px] opacity-70">Status</p>
                          <p className="font-extrabold text-lg">{result.status}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-[#a0aec0]">
                               Confidence Score
                             </label>
                             <span className="text-2xl font-black text-[#007bff]">
                               {(parseFloat(result.confidence) * 100).toFixed(1)}%
                             </span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${parseFloat(result.confidence) * 100}%` }}
                              transition={{ duration: 1.5, ease: "circOut" }}
                              className="h-full bg-[#007bff] rounded-full shadow-[0_0_10px_rgba(0,123,255,0.5)]"
                            />
                          </div>
                          <p className="text-[10px] text-[#4a5568] text-center font-bold italic uppercase tracking-tighter">
                             * AI Classification Confidence
                          </p>
                        </div>
                      </div>

                      <Button 
                        onClick={reset} 
                        className="w-full bg-[#ff8c00] hover:bg-[#e67e00] text-white font-bold tracking-tight transition-all active:scale-95 rounded-[8px]" 
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> NEW ANALYSIS
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
