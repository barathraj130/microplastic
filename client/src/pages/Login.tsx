import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AntiGravityBackground } from "../components/AntiGravityBackground";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

export function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050b14]">
      <AntiGravityBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-[90vw] md:w-[420px] z-10"
      >
        <Card className="rounded-[8px] border-white/10 bg-[#101830]/80 shadow-2xl backdrop-blur-[12px] overflow-hidden p-0 border-[1px]">
          <CardHeader className="p-8 pb-4 space-y-2 text-center">
            <CardTitle className="text-[28px] font-bold tracking-tight text-white font-heading">
              Detection App
            </CardTitle>
            <CardDescription className="text-[#a0aec0] text-[14px]">
              Microplastic Detection Interface v2.5
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="px-8 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#a0aec0] px-1">
                  Access Identifier
                </label>
                <div className="relative group">
                  <Input 
                    placeholder="researcher@node.local" 
                    className="h-[46px] pl-20 rounded-[6px] bg-black/60 border-white/5 text-[14px] focus:border-[#007bff]/50 focus:bg-black/80 transition-all font-medium"
                    type="email"
                    required
                  />
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#4a5568] group-focus-within:text-[#007bff] transition-colors z-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#a0aec0] px-1">
                  Secure Token
                </label>
                <div className="relative group">
                  <Input 
                    placeholder="••••••••••••" 
                    type="password"
                    className="h-[46px] pl-20 rounded-[6px] bg-black/60 border-white/5 text-[14px] focus:border-[#007bff]/50 focus:bg-black/80 transition-all font-medium"
                    required
                  />
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#4a5568] group-focus-within:text-[#007bff] transition-colors z-10" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-4">
              <Button 
                className="w-full h-[44px] rounded-[8px] bg-[#ff8c00] hover:bg-[#e67e00] text-white font-bold text-[14px] transition-all duration-300 shadow-lg shadow-orange-500/20 active:scale-[0.98]" 
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center tracking-wide">
                    AUTHENTICATE <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-[11px] text-[#4a5568] font-bold uppercase tracking-[0.2em]">
            Precision Monitoring Environment
          </p>
        </div>
      </motion.div>
    </div>
  );
}
