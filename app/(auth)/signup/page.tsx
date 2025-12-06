"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit() {
    authClient.signUp.email(
      {
        email,
        name,
        password,
        callbackURL: "/",
      },
      {
        onRequest: (ctx) => {
          console.log("attempting to create user", ctx);
        },
        onSuccess: (ctx) => {
          console.log("created new user", ctx);
        },
        onError: (ctx) => {
          console.log("Creating new user errored", ctx);
        },
      },
    );
  }

  return (
    <>
      <Input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" onClick={onSubmit} />
    </>
  );
}
