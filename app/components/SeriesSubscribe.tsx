"use client";
import { useState } from "react";

export default function SeriesSubscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "intelligent-contractor" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="tic-sub-done idx">
        Confirmed. You&apos;re on the list — next installment, you&apos;ll know.
      </p>
    );
  }

  return (
    <form className="tic-sub-form" onSubmit={submit}>
      <input
        type="email"
        className="vc2-input tic-sub-input"
        placeholder="you@yourcompany.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="Email address"
      />
      <button type="submit" className="btn btn-primary" disabled={state === "sending"}>
        {state === "sending" ? "Adding…" : "Follow the series"}
      </button>
      {state === "error" && (
        <span className="tic-sub-err idx">That didn&apos;t go through — try again.</span>
      )}
    </form>
  );
}
