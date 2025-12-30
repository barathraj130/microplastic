import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Background decoration - Removed to show global mesh */}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl space-y-8"
      >
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight lg:text-7xl">
            Detect Microplastics <br />
           <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-600">
                In Seconds
           </span>

          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI-powered analysis to identify and classify microplastic particles in water samples with high precision.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={onStart} className="text-lg px-8">
            Analyze Sample <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            View Documentation
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
