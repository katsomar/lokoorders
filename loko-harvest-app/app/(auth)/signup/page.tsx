"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import api from "@/lib/api";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["admin", "order_manager"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  password_confirmation: z.string().min(6, "Password confirmation must be at least 6 characters"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "admin",
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register", data);
      if (response.data.success) {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
              Staff Registration
            </span>
            <h1 className="text-4xl font-black font-heading tracking-tight leading-tight">
              Request Admin Control Access
            </h1>
          </div>
          <p className="text-sm text-brand-sage/90 leading-relaxed font-medium">
            Register your staff credentials to request authorization. Once approved by an existing admin, you will gain full access to the HQ Control Center, system metrics, and operational dispatch logs.
          </p>
          
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-yellow">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Centralized Management</p>
                <p className="text-xs text-brand-sage/75">Approve, monitor, and configure system operations.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-yellow">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Secure Access Controls</p>
                <p className="text-xs text-brand-sage/75">Role-based privileges with approval validation.</p>
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
            onClick={() => router.push("/login")}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-forest transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Login
          </button>
        </div>

        <div className="my-auto mx-auto w-full max-w-lg py-8">
          {mounted ? (
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="signup-form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black font-heading text-brand-forest tracking-tight">Create Staff Account</h2>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      Submit your registration details below. All signup requests require manual authorization from an existing admin before login.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                      <div className="rounded-xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-100 font-bold animate-pulse-gentle">
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-3.5">
                      <Input
                        label="Full Name"
                        placeholder="Omar Muammar"
                        {...register("name")}
                        error={errors.name?.message}
                        required
                        className="h-11 text-sm rounded-xl"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                          label="Phone Number"
                          type="tel"
                          placeholder="e.g., 0712345678"
                          {...register("phone")}
                          error={errors.phone?.message}
                          required
                          className="h-11 text-sm rounded-xl"
                        />
                      </div>

                      <Select
                        label="Desired Operational Role"
                        options={[
                          { label: "System Administrator", value: "admin" },
                          { label: "Order Manager", value: "order_manager" },
                        ]}
                        {...register("role")}
                        error={errors.role?.message}
                        required
                        className="h-11 text-sm rounded-xl"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <Input
                          label="Password"
                          type="password"
                          placeholder="••••••••"
                          {...register("password")}
                          error={errors.password?.message}
                          required
                          className="h-11 text-sm rounded-xl"
                        />

                        <Input
                          label="Confirm Password"
                          type="password"
                          placeholder="••••••••"
                          {...register("password_confirmation")}
                          error={errors.password_confirmation?.message}
                          required
                          className="h-11 text-sm rounded-xl"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full font-bold text-sm rounded-xl h-11.5 cursor-pointer mt-2" 
                      isLoading={isLoading}
                    >
                      Submit Request
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="text-center space-y-6 py-4 flex flex-col items-center"
                >
                  <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-brand-forest font-heading">Request Submitted!</h3>
                    <p className="text-xs text-gray-500 max-w-sm leading-relaxed font-medium mx-auto">
                      Your staff account has been registered successfully and is now **pending approval**.
                    </p>
                    <div className="bg-brand-sage/35 border border-brand-sage/50 p-3 rounded-xl mt-3 max-w-sm mx-auto">
                      <p className="text-[11px] text-brand-forest font-semibold leading-relaxed">
                        An existing system administrator must approve your account request before you can log in.
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => router.push("/login")} 
                    className="w-full max-w-xs font-bold text-xs rounded-xl h-10.5 cursor-pointer"
                  >
                    Return to Login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="space-y-6 opacity-0">
              <div className="space-y-1">
                <h2 className="text-3xl font-black font-heading text-brand-forest tracking-tight">Create Admin Request</h2>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Submit your registration details below. All signup requests require manual authorization from an existing admin before login.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3.5">
                  <Input
                    label="Full Name"
                    placeholder="Omar Muammar"
                    required
                    className="h-11 text-sm rounded-xl"
                    disabled
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@company.com"
                      required
                      className="h-11 text-sm rounded-xl"
                      disabled
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="e.g., 0712345678"
                      required
                      className="h-11 text-sm rounded-xl"
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-11 text-sm rounded-xl"
                      disabled
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-11 text-sm rounded-xl"
                      disabled
                    />
                  </div>
                </div>

                <Button 
                  type="button" 
                  className="w-full font-bold text-sm rounded-xl h-11.5 mt-2" 
                  disabled
                >
                  Submit Request
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
