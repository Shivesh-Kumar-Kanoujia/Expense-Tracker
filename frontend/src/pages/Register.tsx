import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, Check, X } from "lucide-react";

function passwordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "Weak", color: "bg-error" };
  if (score <= 4) return { score, label: "Medium", color: "bg-warning" };
  return { score, label: "Strong", color: "bg-success" };
}

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");
  const strength = useMemo(() => passwordStrength(password), [password]);

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.name);
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      if (typeof msg === "string") {
        setError("root", { message: msg });
      } else if (msg && typeof msg === "object") {
        const first = Object.values(msg).flat().filter(Boolean)[0];
        setError("root", { message: String(first) });
      } else if (err.response?.status === 409) {
        setError("root", { message: "Email already registered. Try logging in." });
      } else {
        setError("root", { message: "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group w-full mt-4 mb-8">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-300" />
      <div className="relative glass rounded-3xl p-8 sm:p-10 w-full">
        <h2 className="text-2xl font-bold text-text mb-8 text-center tracking-tight">Create Account</h2>

      {errors.root && (
        <div className="mb-4 p-3 rounded-lg bg-error-light text-error text-sm text-center" role="alert">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Name"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register("name")}
        />
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
            placeholder="Create a strong password"
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

        {password.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-text-muted/20 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 6) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-text-secondary">{strength.label}</span>
            </div>
            <ul className="space-y-1">
              {requirements.map((req) => (
                <li key={req.label} className="flex items-center gap-2 text-xs">
                  {req.test(password) ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <X className="h-3 w-3 text-text-muted" />
                  )}
                  <span className={req.test(password) ? "text-text" : "text-text-muted"}>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-text-muted">
          By creating an account, you agree to our{" "}
          <button
            type="button"
            onClick={() => {}}
            className="text-accent hover:text-accent-hover underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={() => {}}
            className="text-accent hover:text-accent-hover underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Privacy Policy
          </button>
        </p>

        <Button type="submit" loading={loading} fullWidth>
          {loading ? "Creating account..." : "Register"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors duration-fast">
          Login
        </Link>
      </p>
      </div>
    </div>
  );
}
