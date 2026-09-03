import { FormEvent, useState } from "react";
import { HeartPulse, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/useLanguage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/common/FormField";
import { LanguageSelector } from "@/components/common/LanguageSelector";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t, language } = useLanguage();
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
      if (registering) await signUp({ name, email, password, preferred_language: language });
      else await signIn(email, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.auth.authError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <div className="fixed right-4 top-4 z-20">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md p-7">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow"><HeartPulse className="h-6 w-6" /></div>
          <div><p className="text-lg font-black text-ink">{t.common.appName}</p><p className="text-sm text-muted">{t.common.tagline}</p></div>
        </div>
        <h1 className="text-2xl font-black text-ink">{registering ? t.auth.createAccount : t.auth.welcomeBack}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{registering ? t.auth.signUpSubtitle : t.auth.signInSubtitle}</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {registering ? <FormField label={t.auth.fullName} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} /> : null}
          <FormField label={t.auth.email} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <FormField label={t.auth.password} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          {error ? <p className="text-sm font-bold text-danger">{error}</p> : null}
          <Button className="w-full" disabled={submitting}>{registering ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{submitting ? t.auth.connecting : registering ? t.auth.createAccount : t.auth.signIn}</Button>
        </form>
        <button type="button" className="mt-5 w-full text-sm font-bold text-primary" onClick={() => setRegistering((value) => !value)}>{registering ? t.auth.alreadyHaveAccount : t.auth.newToNurtureHer}</button>
      </Card>
    </div>
  );
}