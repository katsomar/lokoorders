"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen items-center justify-center bg-brand-sage p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center flex flex-col items-center">
          <img 
            src="/logo/loko.png" 
            alt="Loko Harvest Limited Logo" 
            className="h-24 w-auto object-contain mb-2.5"
          />
          <p className="text-xs text-brand-forest font-bold uppercase tracking-widest">Orders & Delivery Portal</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                  {error}
                </div>
              )}
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                error={errors.email?.message}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
                required
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign In
              </Button>
              
              <div className="text-center mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
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
            </form>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-sm text-gray-500 font-body">
          &copy; {new Date().getFullYear()} Loko Harvest Limited. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
