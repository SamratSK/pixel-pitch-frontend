"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type UserSession = { username?: string; email?: string; token?: string; expires_at?: number };
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [user, setUser] = useState<UserSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("guardian:user") ?? localStorage.getItem("pixel-pitch:user")
        : null;
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // ignore malformed payload
      }
    }
  }, []);

  const persistUser = (payload: UserSession) => {
    setUser(payload);
    if (typeof window !== "undefined") {
      localStorage.setItem("guardian:user", JSON.stringify(payload));
      localStorage.removeItem("pixel-pitch:user");
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guardian</p>
              <p className="text-lg font-semibold">Security cockpit</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <Link className="hover:text-primary" href="/">
                Home
              </Link>
              <Link className="hover:text-primary" href="/upload">
                Upload
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUser(null);
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("guardian:user");
                      localStorage.removeItem("pixel-pitch:user");
                    }
                    toast.success("Logged out");
                  }}
                >
                  Log out
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-12">
        <div className="mx-auto flex max-w-6xl justify-center">
          <div className="w-full max-w-lg space-y-6 rounded-2xl border border-border/70 bg-white/90 p-8 shadow-xl backdrop-blur dark:bg-slate-900/80">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Create account</p>
              <h1 className="text-3xl font-semibold">Register</h1>
              <p className="text-muted-foreground">Add your details to unlock the upload desk.</p>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="analyst@secops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  placeholder="nithy-secops"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            <div className="grid gap-2">
              <Label htmlFor="register-confirm">Confirm password</Label>
              <Input
                id="register-confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button
              className="w-full"
              onClick={async () => {
                const trimmedEmail = email.trim();
                const trimmedUser = username.trim();
                if (!trimmedEmail || !trimmedUser || !password || !confirm) {
                  setFormError("Fill in all fields");
                  return;
                }
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
                  setFormError("Add a valid email");
                  return;
                }
                if (trimmedUser.length < 3) {
                  setFormError("Username should be at least 3 characters");
                  return;
                }
                if (password.length < 8) {
                  setFormError("Password should be at least 8 characters");
                  return;
                }
                if (password !== confirm) {
                  setFormError("Passwords do not match");
                  return;
                }
                setFormError("");
                try {
                  const headers: Record<string, string> = { "Content-Type": "application/json" };
                  const envKey = process.env.NEXT_PUBLIC_GUARDIAN_KEY;
                  if (envKey) headers["guardian-key"] = envKey;
                    const registerRes = await fetch(`${API_BASE}/auth/register`, {
                      method: "POST",
                      headers,
                      body: JSON.stringify({ username: trimmedUser, password })
                    });
                  if (!registerRes.ok) {
                    const err = await registerRes.json().catch(() => ({}));
                    throw new Error(err?.detail || "Register failed");
                  }
                    const loginRes = await fetch(`${API_BASE}/auth/login`, {
                      method: "POST",
                      headers,
                      body: JSON.stringify({ username: trimmedUser, password })
                    });
                  if (!loginRes.ok) {
                    const err = await loginRes.json().catch(() => ({}));
                    throw new Error(err?.detail || "Login failed");
                  }
                  const session = await loginRes.json();
                  persistUser({ username: trimmedUser, email: trimmedEmail, token: session?.token, expires_at: session?.expires_at });
                  toast.success("Registered", { description: "Upload page is unlocked." });
                  router.push("/upload");
                } catch (error: any) {
                  setFormError(error?.message || "Registration failed");
                  toast.error(error?.message || "Registration failed");
                }
              }}
            >
              Register
            </Button>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Already have an account?</span>
              <Link href="/auth/login" className="text-primary underline underline-offset-4">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-center border-t border-border/60 bg-background py-6 text-sm text-muted-foreground">
        Made with ❤️ by Nithyaneshwar and Samrat
      </footer>
    </main>
  );
}
