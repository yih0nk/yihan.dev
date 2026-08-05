"use client";

import { useState } from "react";

export default function ResumeGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const blob = await res.blob();
      setUrl(URL.createObjectURL(blob));
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (url) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <a
            href={url}
            download="Yihan_Hong_Resume.pdf"
            className="text-sm border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            download pdf ↓
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 underline underline-offset-4 hover:text-black"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            open in new tab
          </a>
        </div>
        <object
          data={url}
          type="application/pdf"
          className="w-full h-[820px] border border-gray-200"
        >
          <p className="p-4 text-sm text-gray-500">
            Your browser can&apos;t display PDFs inline — use the download link
            above.
          </p>
        </object>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-sm">
      <label
        htmlFor="resume-password"
        className="block text-xs text-gray-400 uppercase tracking-wider mb-2"
      >
        password
      </label>
      <div className="flex gap-2">
        <input
          id="resume-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          style={{ fontFamily: "var(--font-mono)" }}
        />
        <button
          type="submit"
          disabled={loading || !password}
          className="text-sm border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-black"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {loading ? "…" : "enter"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600" style={{ fontFamily: "var(--font-mono)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
