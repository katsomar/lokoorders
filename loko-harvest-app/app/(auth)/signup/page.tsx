"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["store_manager", "sales_accounts", "driver", "production_manager"], {
    message: "Please select a valid role",
  }),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: undefined,
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

  const roleOptions = [
    { label: "Store Manager", value: "store_manager" },
    { label: "Sales & Accounts", value: "sales_accounts" },
    { label: "Driver", value: "driver" },
    { label: "Production Manager", value: "production_manager" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-sage p-4 font-body">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 text-center flex flex-col items-center">
          <img 
            src="/logo/loko.png" 
            alt="Loko Harvest Limited Logo" 
            className="h-20 w-auto object-contain mb-2"
          />
          <p className="text-xs text-brand-forest font-bold uppercase tracking-widest">Create Staff Account</p>
        </div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Card className="border-none shadow-xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <UserPlus className="text-brand-forest" size={24} />
                    Sign Up
                  </CardTitle>
                  <CardDescription>
                    Register your details. Your account will require admin approval before login.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 font-medium">
                        {error}
                      </div>
                    )}
                    
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      {...register("name")}
                      error={errors.name?.message}
                      required
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@company.com"
                      {...register("email")}
                      error={errors.email?.message}
                      required
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="e.g., 0772000000"
                      {...register("phone")}
                      error={errors.phone?.message}
                      required
                    />

                    <Select
                      label="Operational Role"
                      options={roleOptions}
                      {...register("role")}
                      error={errors.role?.message}
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

                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      {...register("password_confirmation")}
                      error={errors.password_confirmation?.message}
                      required
                    />

                    <div className="pt-2 flex flex-col gap-3">
                      <Button type="submit" className="w-full font-bold" isLoading={isLoading}>
                        Submit Request
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 font-semibold"
                        onClick={() => router.push("/login")}
                      >
                        <ArrowLeft size={16} />
                        Back to Login
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="signup-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Card className="border-none shadow-xl text-center py-6">
                <CardContent className="space-y-6 flex flex-col items-center pt-6">
                  <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-brand-forest font-heading">Request Submitted!</h3>
                    <p className="text-sm text-gray-500 max-w-sm leading-relaxed px-2">
                      Your staff account has been registered successfully. It is now **pending administrator approval**.
                    </p>
                    <p className="text-xs text-brand-amber font-semibold bg-brand-sage/40 py-2 px-3 rounded-lg mt-2 inline-block">
                      You will be able to log in once an administrator approves your request.
                    </p>
                  </div>

                  <Button 
                    onClick={() => router.push("/login")} 
                    className="w-full max-w-xs font-bold"
                  >
                    Return to Login
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-sm text-gray-500 font-body">
          &copy; {new Date().getFullYear()} Loko Harvest Limited. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
