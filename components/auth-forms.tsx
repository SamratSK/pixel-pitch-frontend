import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User } from "lucide-react";

type AuthFormsProps = {
  onLogin: (payload: { email: string }) => void;
  onRegister: (payload: { email: string }) => void;
  userEmail?: string | null;
};

export function AuthForms({ onLogin, onRegister, userEmail }: AuthFormsProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="glass card-hover">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Login</CardTitle>
              <CardDescription>Mock session for trying the flow.</CardDescription>
            </div>
            {userEmail && (
              <Badge variant="success" className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="login-pass">Password</Label>
            <Input
              id="login-pass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              onLogin({ email: loginEmail });
            }}
          >
            Sign in
          </Button>
          {userEmail && (
            <p className="text-sm text-muted-foreground">Logged in as {userEmail}. Uploads are unlocked.</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass card-hover relative overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -inset-x-4 -top-16 h-24 rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-cyan-500/20 blur-3xl"
          initial={{ opacity: 0, y: -6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        />
        <CardHeader className="relative">
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a mock account to try uploads.</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="analyst@secops.com"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="register-pass">Password</Label>
            <Input
              id="register-pass"
              type="password"
              placeholder="secure pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => onRegister({ email: registerEmail })}
          >
            Create account
          </Button>
          {registerEmail && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              We keep this in-memory for demo only.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
