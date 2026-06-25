import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoginPage({ cardClass }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e2) {
      setErr(e2?.message || "Login error");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <section className={cardClass}>
        <h2 className="text-2xl font-bold text-fg mb-2">
          {mode === "login" ? "Log in" : "Create account"}
        </h2>

        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full rounded bg-app border border-subtle p-2 text-fg focus:border-accent outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded bg-app border border-subtle p-2 text-fg focus:border-accent outline-none"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err && <p className="text-xs text-red-300">{err}</p>}

          <button
            className="w-full px-4 py-2 rounded bg-accent text-white hover:bg-accent/90"
            type="submit"
          >
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          className="mt-3 text-xs text-fgMuted hover:text-accent"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Have an account? Log in"}
        </button>
      </section>
    </div>
  );
}
