import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      if (typeof msg === "string") {
        setError("root", { message: msg });
      } else if (msg && typeof msg === "object") {
        const first = Object.values(msg).flat().filter(Boolean)[0];
        setError("root", { message: String(first) });
      } else if (err.response?.data?.message) {
        setError("root", { message: err.response.data.message });
      } else {
        setError("root", { message: "Login failed. Please check your credentials." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group w-full">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-300" />
      <div className="relative glass rounded-3xl p-8 sm:p-10 w-full">
        <h2 className="text-2xl font-bold text-text mb-8 text-center tracking-tight">Welcome Back</h2>

      {errors.root && (
        <div className="mb-4 p-3 rounded-lg bg-error-light text-error text-sm text-center" role="alert">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-[38px] text-text-muted hover:text-text transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => showToast("Password reset coming soon", "info")}
            className="text-sm text-accent hover:text-accent-hover transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" loading={loading} fullWidth>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Don't have an account?{" "}
        <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors duration-fast">
          Register
        </Link>
      </p>
    </div>
    </div>
  );
}
