"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { LogIn, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/store/useAuth";
import api from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const handleError = (e: ErrorEvent) => {
        setClientError(`${e.message} at ${e.filename}:${e.lineno}`);
      };
      window.addEventListener("error", handleError);
      return () => window.removeEventListener("error", handleError);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", {
        ...data,
        device_name: typeof window !== 'undefined' ? window.navigator.userAgent : 'web',
      });

      if (response.data.success) {
        const user = response.data.data.user;
        setAuth(user, response.data.data.token);
        
        // Role-based redirect
        if (user.role === 'driver') {
          router.push("/driver");
        } else {
          router.push("/dashboard/admin");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full lg:h-screen lg:w-screen lg:overflow-hidden bg-white font-body">
      {/* Left side: Hero branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-brand-forest p-12 text-white lg:flex">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1e5b29,transparent_60%)] opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,#0d3315,transparent_50%)] opacity-80" />
        
        {/* Animated glowing decorative blobs */}
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-brand-sage/10 blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
        
        {/* Foreground Content */}
        <div className="relative z-10 flex items-center gap-3">
          <img 
            src="/logo/loko.png" 
            alt="Loko Harvest Limited Logo" 
            className="h-12 w-auto object-contain bg-white/10 p-1.5 rounded-xl border border-white/10"
          />
          <div>
            <h2 className="text-xl font-black font-heading tracking-tight text-brand-yellow">Loko Harvest</h2>
            <p className="text-[10px] text-brand-sage font-bold uppercase tracking-wider">Orders & Delivery System</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-md space-y-6">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-brand-yellow/20 px-3.5 py-1.5 text-xs font-bold text-brand-yellow uppercase tracking-wider">
              Control Center Login
            </span>
            <h1 className="text-4xl font-black font-heading tracking-tight leading-tight">
              Manage Orders & Dispatch Operations
            </h1>
          </div>
          <p className="text-sm text-brand-sage/90 leading-relaxed font-medium">
            Sign in to access your administrative workspace. Oversee deliveries, dispatch drivers, review transactions, and adjust system configurations from a single portal.
          </p>
          
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-yellow">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">HQ Control Desk</p>
                <p className="text-xs text-brand-sage/75">Full dispatch visibility and manual override controls.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-yellow">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Real-time Analytics</p>
                <p className="text-xs text-brand-sage/75">Live revenue trends, driver tracking, and sales feed.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-brand-sage/70 font-medium">
          <span>&copy; {new Date().getFullYear()} Loko Harvest Limited.</span>
          <span>Version 2.1.0</span>
        </div>
      </div>

      {/* Right side: Form panel */}
      <div className="relative flex w-full flex-col justify-between p-6 sm:p-12 lg:w-1/2 bg-gray-50/50 min-h-screen lg:min-h-0">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <img 
              src="/logo/loko.png" 
              alt="Loko Harvest Limited Logo" 
              className="h-9 w-auto object-contain bg-brand-forest/10 p-1 rounded-lg"
            />
            <span className="text-xs font-black font-heading text-brand-forest">Loko Harvest ODS</span>
          </div>
          <button
            onClick={() => router.push("/signup")}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-forest transition-colors cursor-pointer"
          >
            Request Access
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="my-auto mx-auto w-full max-w-lg py-8">
          {mounted ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-3xl font-black font-heading text-brand-forest tracking-tight">Welcome Back</h2>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Sign in to your account to continue managing Loko Harvest ODS.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100 font-bold">
                    {error}
                  </div>
                )}
                
                <div className="space-y-3.5">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@company.com"
                    {...register("email")}
                    error={errors.email?.message}
                    required
                    className="h-11 text-sm rounded-xl"
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    error={errors.password?.message}
                    required
                    className="h-11 text-sm rounded-xl"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full font-bold text-sm rounded-xl h-11.5 cursor-pointer mt-2 flex items-center justify-center gap-1.5" 
                  isLoading={isLoading}
                >
                  <LogIn size={14} />
                  Sign In
                </Button>
              </form>
              
              <div className="text-center border-t border-gray-100 pt-4 lg:hidden">
                <p className="text-xs text-gray-500 font-medium">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/signup")}
                    className="font-bold text-brand-forest hover:text-[#14491F] transition-colors hover:underline cursor-pointer"
                  >
                    Request Signup
                  </button>
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6 opacity-0">
              <div className="space-y-1">
                <h2 className="text-3xl font-black font-heading text-brand-forest tracking-tight">Welcome Back</h2>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Sign in to your account to continue managing Loko Harvest ODS.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3.5">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@company.com"
                    required
                    className="h-11 text-sm rounded-xl"
                    disabled
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-11 text-sm rounded-xl"
                    disabled
                  />
                </div>

                <Button 
                  type="button" 
                  className="w-full font-bold text-sm rounded-xl h-11.5 mt-2 flex items-center justify-center gap-1.5" 
                  disabled
                >
                  <LogIn size={14} />
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-[10px] text-gray-400 font-medium lg:hidden mt-6 pb-4">
          &copy; {new Date().getFullYear()} Loko Harvest Limited. All rights reserved.
        </div>
        <div className="hidden lg:block" /> {/* spacer for flex layout spacing */}
      </div>
    </div>
  );
}
