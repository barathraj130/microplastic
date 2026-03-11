import { ArrowLeft, QrCode, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { PhoneNode } from "../components/PhoneNode";
import { Button } from "../components/ui/button";

export function NodePage() {
  const nodeUrl = `https://192.168.29.182:5173/node`;

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-6 flex flex-col items-center">
      {/* ================= HEADER ================= */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <Link to="/dashboard">
          <Button
            variant="ghost"
            className="pl-0 text-[#a0aec0] hover:text-[#007bff] font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-[#ff8c00]">
          <Smartphone className="w-4 h-4" />
          <span className="text-[10px] font-black tracking-widest uppercase">Remote Node Manager</span>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Node Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Sensor Node Activation
            </h1>
            <p className="text-sm text-[#a0aec0]">
              Convert any handset into a synchronized optical sensor.
            </p>
          </div>
          
          <PhoneNode />

          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400 leading-relaxed">
            <p className="font-bold uppercase tracking-widest mb-2">Instructions:</p>
            <ol className="list-decimal pl-4 space-y-1 opacity-80">
              <li>Open this page on your <strong>iPhone</strong> or target device.</li>
              <li>Toggle the "Select Hardware Node" to your back camera.</li>
              <li>Click <strong>"ACTIVATE LENS"</strong> and allow permissions.</li>
              <li>Your frames will sync with the AI cluster automatically.</li>
            </ol>
          </div>
        </div>

        {/* QR Sync Panel */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sticky top-8">
            <div className="flex items-center gap-2 mb-6 text-[#007bff]">
              <QrCode className="w-4 h-4" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">
                QR Sync (Fastest)
              </h3>
            </div>
            
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-white p-3 rounded-xl overflow-hidden shadow-2xl shadow-blue-500/20">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(nodeUrl)}`}
                  alt="Sync QR"
                  className="w-[180px] h-[180px]"
                />
              </div>
              
              <div>
                <p className="text-[10px] text-white/50 mb-4 leading-relaxed font-bold uppercase tracking-wider">
                  Scan to link phone <br/> over wi-fi instantly
                </p>
                
                <div className="inline-flex items-center gap-2 rounded-lg bg-black/40 border border-white/5 px-3 py-2 text-[10px] font-mono text-white/80">
                  {nodeUrl}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
