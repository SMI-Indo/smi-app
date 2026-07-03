"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z
    .string()
    .min(8, { message: "Kata sandi minimal harus 8 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setAuthError("Email atau kata sandi salah. Silakan coba lagi.");
      } else {
        router.push("/membership");
        router.refresh();
      }
    } catch (err) {
      setAuthError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/membership" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Form Card with ambient card-glow and Bone White theme */}
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-[2rem] card-glow border border-outline-variant space-y-6">
        {/* Form Header */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-primary/20 bg-surface-container flex items-center justify-center mx-auto transition-transform hover:scale-105 shadow-sm inner-glow">
            <Image
              src="/logo_smi.png"
              alt="Logo Sahabat Misdinar Indonesia"
              fill
              sizes="64px"
              priority
              className="object-cover"
            />
          </div>
          <h2 className="font-headline-md text-primary">Masuk Akun</h2>
          <p className="font-body-md text-on-surface-variant">Sahabat Misdinar Indonesia</p>
        </div>

        {authError && (
          <div className="p-3 text-sm rounded-xl bg-error-container text-error font-body-md text-center border border-error/20">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1">
            <label className="font-label-sm text-on-surface-variant block">Email</label>
            <input
              type="email"
              {...register("email")}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-outline bg-surface text-on-surface font-body-md focus:outline-none focus:border-primary transition-colors"
              placeholder="nama@email.com"
            />
            {errors.email && (
              <p className="text-xs text-error font-body-md mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password field with visibility toggle */}
          <div className="space-y-1">
            <label className="font-label-sm text-on-surface-variant block">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-outline bg-surface text-on-surface font-body-md focus:outline-none focus:border-primary pr-12 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined select-none">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-error font-body-md mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Pill-shaped Submit button with hover effect */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-primary text-white font-label-lg py-3 rounded-full flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <span>Masuk</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-[1px] bg-outline-variant" />
          <span className="px-3 font-label-sm text-on-surface-variant">ATAU</span>
          <div className="flex-1 h-[1px] bg-outline-variant" />
        </div>

        {/* Google OAuth button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-3 rounded-full border border-outline font-label-lg flex items-center justify-center gap-2 bg-surface text-on-surface hover:bg-surface-container-low transition-colors active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Google</span>
        </button>
      </div>
    </main>
  );
}
