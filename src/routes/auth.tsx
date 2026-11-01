import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const searchSchema = z.object({
  redirect: z.string().optional(),
  intent: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in · Vinci" },
      { property: "og:title", content: "Sign in · Vinci" },
      { property: "og:description", content: "Sign in or create your Vinci account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content: "Sign in or create a Vinci account to bid, vote, chat and gift creators.",
      },
    ],
  }),
});

const credsSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  displayName: z.string().trim().min(1).max(60).optional(),
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: search.redirect ?? "/", replace: true });
    }
  }, [loading, user, search.redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = credsSchema.safeParse({
      email,
      password,
      displayName: mode === "signup" ? displayName : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: parsed.data.displayName },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setBusy(true);
    try {
      const next = search.redirect ?? "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(next)}`,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link
        to="/"
        className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
      >
        ← Back to Vinci
      </Link>

      <h1 className="mt-6 font-display text-4xl leading-tight">
        {mode === "signin" ? (
          "Welcome back."
        ) : (
          <>
            Open your <span className="gold-gradient-text italic">studio.</span>
          </>
        )}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {search.intent
          ? `Sign in to ${search.intent}.`
          : "Watching is free. Sign in to bid, vote, chat and gift."}
      </p>

      <div className="mt-8 space-y-2">
        <button
          onClick={() => handleOAuth("google")}
          disabled={busy}
          className="w-full h-11 rounded-md border border-border text-sm hover:border-primary/60 disabled:opacity-50 transition-colors"
        >
          Continue with Google
        </button>
        <button
          onClick={() => handleOAuth("apple")}
          disabled={busy}
          className="w-full h-11 rounded-md border border-border text-sm hover:border-primary/60 disabled:opacity-50 transition-colors"
        >
          Continue with Apple
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or email{" "}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-11 rounded-md bg-card border border-border px-3 text-sm focus:outline-none focus:border-primary"
            maxLength={60}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-11 rounded-md bg-card border border-border px-3 text-sm focus:outline-none focus:border-primary"
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-11 rounded-md bg-card border border-border px-3 text-sm focus:outline-none focus:border-primary"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={8}
        />

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-accent disabled:opacity-50 transition-colors"
        >
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {mode === "signin" ? (
          <>
            New to Vinci?{" "}
            <button onClick={() => setMode("signup")} className="text-primary hover:underline">
              Create an account
            </button>
          </>
        ) : (
          <>
            Already a member?{" "}
            <button onClick={() => setMode("signin")} className="text-primary hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
