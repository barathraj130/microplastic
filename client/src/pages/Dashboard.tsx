import { motion } from "framer-motion";
import { Activity, ArrowUpRight, Clock, Info, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { cn } from "../lib/utils";

const features = [
  {
    title: "Live Detection",
    description: "Real-time analysis via connected ESP32-CAM optical sensor. Optimized for low-latency polymer tracking.",
    icon: Activity,
    href: "/live",
    color: "text-[#007bff]"
  },
  {
    title: "History",
    description: "Scientific archive of previous microscopic detections and classification reports.",
    icon: Clock,
    href: "/history",
    color: "text-[#ff8c00]"
  },
  {
    title: "Settings",
    description: "Configure optical gain, exposure, and YOLOv8 inference thresholds.",
    icon: Settings,
    href: "/settings",
    color: "text-[#007bff]"
  },
  {
    title: "System Info",
    description: "Technical hardware diagnostics and project methodology overview.",
    icon: Info,
    href: "/about",
    color: "text-[#ff8c00]"
  }
];

export function Dashboard() {
  return (
    <div className="max-w-[1200px] mx-auto px-8 py-10 min-h-[calc(100vh-120px)] flex flex-col justify-center">
      <div className="mb-8 space-y-1">
        <h1 className="text-[32px] font-bold tracking-tight text-white">
          Detection Command
        </h1>
        <p className="text-[14px] text-[#a0aec0]">
          Polymer classification and optical sensor monitoring interface
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
        {features.map((feature, i) => (
          <Link to={feature.href} key={i}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <Card className={cn(
                "h-[220px] p-6 flex flex-col justify-between transition-all duration-300 rounded-[8px] border-white/10 bg-[#101830]/80 backdrop-blur-[12px] overflow-hidden border-[1px]",
                "hover:border-[#007bff] hover:shadow-[0_0_15px_rgba(0,123,255,0.3)]"
              )}>
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-3 rounded-md bg-black/40 border border-white/5 transition-transform duration-500 group-hover:scale-110", 
                    "text-[#ff8c00]"
                  )}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-[#4a5568] group-hover:text-[#ff8c00] transition-all" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-[18px] font-semibold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="text-[14px] text-[#a0aec0] leading-relaxed line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
