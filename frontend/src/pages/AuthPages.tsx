import { FormEvent, useState } from "react";
import { HeartPulse, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/common/FormField";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (registering) await signUp({ name, email, password, preferred_language: "en" });
      else await signIn(email, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to complete authentication");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md p-7">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow"><HeartPulse className="h-6 w-6" /></div>
          <div><p className="text-lg font-black text-ink">NurtureHer</p><p className="text-sm text-muted">Your care, connected.</p></div>
        </div>
        <h1 className="text-2xl font-black text-ink">{registering ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{registering ? "Start a secure personal wellness record." : "Sign in to continue your wellness journey."}</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {registering ? <FormField label="Full name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} /> : null}
          <FormField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <FormField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          {error ? <p className="text-sm font-bold text-danger">{error}</p> : null}
          <Button className="w-full" disabled={submitting}>{registering ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{submitting ? "Connecting..." : registering ? "Create account" : "Sign in"}</Button>
        </form>
        <button type="button" className="mt-5 w-full text-sm font-bold text-primary" onClick={() => setRegistering((value) => !value)}>{registering ? "Already have an account? Sign in" : "New to NurtureHer? Create an account"}</button>
      </Card>
    </div>
  );
}