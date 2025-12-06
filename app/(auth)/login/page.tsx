"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    authClient
      .signIn.email(
        {
          email,
          password,
          rememberMe,
          callbackURL: "/",
        },
        {
          onRequest: (ctx) => {
            console.log("attempting to login", ctx);
          },
          onSuccess: (ctx) => {
            console.log("logged in user", ctx);
          },
          onError: (ctx) => {
            console.log("login errored", ctx);
            setError(ctx.error?.message ?? "Unable to sign in.");
          },
        },
      )
      .finally(() => setIsSubmitting(false));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-sm flex-col gap-3"
    >
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          className="size-4 rounded border border-input accent-primary"
        />
        Remember me
      </label>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={!email || !password || isSubmitting}>
        {isSubmitting ? "Signing in..." : "Log in"}
      </Button>
    </form>
  );
}
