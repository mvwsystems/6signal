"use client";
import { useState } from "react";
import { trackEvent } from "../lib/fbq";
import { getAttribution } from "../lib/attribution";
import { LEVER_QUESTIONS, LEVER_COUNT, scoreLevers } from "../lib/levers-quiz-data";

// Embedded in the MIT ten-levers post via the MDX components map. Ten yes/no
// rows with a live score; the band, the reader's lowest levers, and an emailed
// copy are the exchange for an email address. Reuses the /profit-leak row
// styles (.pl-q, .pl-live) so the two audits look like one instrument.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Result {
  score: number;
  band: { label: string; text: string };
  lowest: { num: string; lever: string }[];
  emailed: boolean;
}

export default function LeversQuiz() {
  const [answers, setAnswers] = useState<boolean[]>(() => Array(LEVER_COUNT).fill(false));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const live = scoreLevers(answers);

  const toggle = (i: number) =>
    setAnswers((a) => {
      const next = a.slice();
      next[i] = !next[i];
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/levers-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, answers, website, attribution: getAttribution() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(data as Result);
      trackEvent("Lead", { content_name: "ai-levers-quiz" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lq" id="levers-audit" aria-labelledby="lq-title">
      <span className="idx lq-eyebrow">Ten questions · about four minutes</span>
      <h3 className="lq-title" id="lq-title">Score your shop against the ten levers</h3>
      <p className="lq-rule">
        Check a box only if the answer is an unqualified yes — something you could point to today, not
        something you could probably arrange. Your score updates as you go. Your two lowest levers are
        where to start.
      </p>

      {!result ? (
        <form className="lq-form" onSubmit={submit} noValidate>
          <div className="pl-section">
            {LEVER_QUESTIONS.map((q, i) => (
              <label key={q.num} className={`pl-q${answers[i] ? " is-yes" : ""}`}>
                <input type="checkbox" checked={answers[i]} onChange={() => toggle(i)} />
                <span className="pl-q-box" aria-hidden="true" />
                <span className="pl-q-text">
                  <span className="idx lq-q-lever">{q.num} · {q.lever}</span>
                  {q.question}
                </span>
              </label>
            ))}
          </div>

          <div className="pl-live">
            <span className="idx">Running score</span>
            <span className="pl-live-num">{live.total}<i>/ {LEVER_COUNT}</i></span>
          </div>

          <div className="lq-capture">
            <p className="lq-capture-lede">
              Get your band, your lowest levers, and a copy of your answers by email.
            </p>
            <div className="lq-fields">
              <input
                className="vc2-input"
                type="text"
                placeholder="First name"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="First name"
              />
              <input
                className="vc2-input"
                type="email"
                placeholder="Email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                aria-label="Email"
                required
              />
              {/* honeypot — off-screen, never shown to people */}
              <div className="pl-hp" aria-hidden="true">
                <label htmlFor="lq-website">Website</label>
                <input id="lq-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Scoring…" : "Score my shop"}
              </button>
            </div>
            {error && <p className="vc2-error lq-error">{error}</p>}
            <p className="idx lq-fine">Joins the 6 Signal list. Unsubscribe any time.</p>
          </div>
        </form>
      ) : (
        <div className="lq-result" role="status">
          <div className="lq-result-score">
            <span className="lq-result-num">{result.score}</span>
            <span className="idx">out of {LEVER_COUNT}</span>
          </div>
          <p className="lq-result-band">{result.band.label}.</p>
          <p className="lq-result-text">{result.band.text}</p>
          {result.lowest.length > 0 && (
            <div className="lq-lowest">
              <span className="idx">Start here</span>
              <ul>
                {result.lowest.map((l) => (
                  <li key={l.num}><span className="idx">{l.num}</span> {l.lever}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="idx lq-fine">
            {result.emailed ? "A copy of your answers is in your inbox." : "Your result is saved above; email delivery is delayed."}
          </p>
        </div>
      )}
    </section>
  );
}
