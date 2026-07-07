import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/Card";
import client from "@/api/client";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    client.post("/auth/verify-email", { token })
      .then(({ data }) => {
        setStatus("verified");
        setMessage(data.message);
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(err.response?.data?.error || "Verification failed");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-accent mx-auto animate-spin" />
              <CardTitle>Verifying your email...</CardTitle>
            </>
          )}
          {status === "verified" && (
            <>
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>{message}</CardDescription>
              <Link to="/login" className="inline-block text-accent hover:text-accent-hover font-medium mt-4">
                Go to login
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>{message}</CardDescription>
              <Link to="/" className="inline-block text-accent hover:text-accent-hover font-medium mt-4">
                Back to home
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
