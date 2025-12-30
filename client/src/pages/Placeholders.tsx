import { ArrowLeft, Cpu, Database, Microscope, Network, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { cn } from "../lib/utils";

function PlaceholderHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="max-w-[1200px] mx-auto px-8 py-10">
      <Link to="/dashboard">
        <Button variant="ghost" className="pl-0 text-[#a0aec0] hover:text-[#007bff] mb-8 font-bold text-[13px] tracking-widest uppercase">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Command
        </Button>
      </Link>
      <div className="space-y-2">
        <h1 className="text-[40px] font-extrabold tracking-tight text-white">{title}</h1>
        <p className="text-[16px] text-[#a0aec0] max-w-2xl">{subtitle}</p>
      </div>
    </div>
  );
}

export function History() { 
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/history")
      .then(res => res.json())
      .then(data => {
        setHistoryItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch history:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-[#05070a] min-h-screen">
      <PlaceholderHeader 
        title="Analysis Archive" 
        subtitle="Historical database of microscopic detection events and classification reports."
      />
      <div className="max-w-[1200px] mx-auto px-8 pb-12">
        <Card className="bg-[#101830]/80 border-white/10 backdrop-blur-[12px] overflow-hidden rounded-[8px] border-[1px]">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center text-[#a0aec0] animate-pulse font-bold tracking-widest uppercase text-[12px]">
                Initializing Secure Database Connection...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-20 text-center text-[#4a5568] font-bold tracking-widest uppercase text-[12px]">
                No detection events recorded in local archive.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    {['Timestamp', 'Particles', 'AI Confidence', 'Primary Type', 'Detection Status'].map((head) => (
                      <th key={head} className="p-6 text-[11px] font-bold uppercase tracking-widest text-[#a0aec0]">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6">
                        <div className="font-bold text-white text-[14px]">{item.date_str}</div>
                        <div className="text-[12px] text-[#4a5568] uppercase font-black tracking-tighter">{item.time_str} LOCAL</div>
                      </td>
                      <td className="p-6 text-[18px] font-black text-white">{item.detections}</td>
                      <td className="p-6">
                        <span className="text-[#007bff] font-bold text-[14px]">{(parseFloat(item.confidence) * 100).toFixed(1)}%</span>
                      </td>
                      <td className="p-6 text-[#a0aec0] text-[14px] font-medium uppercase tracking-tight">Synthetic Polymer</td>
                      <td className="p-6">
                        <span className={cn(
                          "px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-tighter border",
                          item.color === 'danger' ? "bg-[#c0392b]/10 border-[#c0392b]/30 text-[#c0392b]" :
                          "bg-[#27ae60]/10 border-[#27ae60]/30 text-[#2ecc71]"
                        )}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  ); 
}

export function Settings() { 
  return (
    <div className="bg-[#05070a] min-h-screen">
      <PlaceholderHeader 
        title="System Parameters" 
        subtitle="Global configuration for optical sensors, inference thresholds, and secure network nodes."
      />
      <div className="max-w-[1200px] mx-auto px-8 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { icon: Microscope, title: "Optical Sensitivity", desc: "Adjust sensor gain and exposure settings for ESP32 hardware." },
          { icon: Cpu, title: "Inference Engine", desc: "Toggle YOLOv8-tiny vs v8n model weights for optimized latency." },
          { icon: ShieldCheck, title: "Secure Node Auth", desc: "Configure SSL certificates and terminal access tokens." },
          { icon: Network, title: "Mesh Discovery", desc: "Control mDNS broadcast and fallback IP synchronization." }
        ].map((item, i) => (
          <Card key={i} className="p-8 bg-[#101830]/80 border-white/10 backdrop-blur-[12px] rounded-[8px] hover:border-[#007bff] hover:shadow-[0_0_15px_rgba(0,123,255,0.3)] transition-all group border-[1px]">
             <div className="flex gap-6 items-start">
                <div className="p-4 rounded-md bg-black/40 border border-white/5 group-hover:scale-110 transition-transform duration-500 text-[#ff8c00]">
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-white">{item.title}</h3>
                  <p className="text-[14px] text-[#a0aec0] leading-relaxed">{item.desc}</p>
                </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function About() { 
  return (
    <div className="bg-[#05070a] min-h-screen">
      <PlaceholderHeader 
        title="System Information" 
        subtitle="Scientific methodology, hardware telemetry, and project documentation."
      />
      <div className="max-w-4xl mx-auto px-8 pb-12 space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-4 text-[#ff8c00]">
            <Database className="w-6 h-6" />
            <h2 className="text-2xl font-bold tracking-tight text-white">Classification Methodology</h2>
          </div>
          <p className="text-[15px] text-[#a0aec0] leading-relaxed indent-8">
             The Microplastic Detection System utilizes a high-frequency optical sensor (ESP32-CAM) to capture microscopic suspension frames. 
             These frames are processed through a custom YOLOv8 convolutional neural network specialized for sub-millimeter synthetic polymers. 
             Our approach follows IEEE 802.15.4 standards for low-power sensor networks and ISO 14001 environmental monitoring guidelines.
          </p>
        </section>

        <section className="space-y-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-4 text-[#007bff]">
             <Cpu className="w-6 h-6" />
             <h2 className="text-2xl font-bold tracking-tight text-white">Hardware Stack v2.1</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
             {[
               { k: "Neural Core", v: "YOLOv8 Inference" },
               { k: "Imaging Hardware", v: "OV2640 Lens Module" },
               { k: "Network Protocol", v: "mDNS / WebSockets" },
               { k: "Framework", v: "React + Vite Scientific" },
             ].map((item, i) => (
               <div key={i} className="p-4 rounded-[6px] bg-white/[0.02] border border-white/5">
                 <div className="text-[10px] font-bold uppercase tracking-widest text-[#4a5568]">{item.k}</div>
                 <div className="text-[14px] font-black text-white">{item.v}</div>
               </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  ); 
}
