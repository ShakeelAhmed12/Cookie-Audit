"use client";

import { Cookie } from "@/types/cookies";
import { useState } from "react";
import CookieTable from "./components/CookieTable";

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedURL, setScannedURL] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!url.trim()) return;

    setLoading(true);
    setError(null);
    setCookies([]);
    setScannedURL(null);

    try {
      const response = await fetch("/api/extract-cookies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch cookies");
      } else{
        setCookies(data.cookies);
        setScannedURL(url);
      }
    } catch (err) {
      setError("Something has went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-[1200px] mx-auto px-8 py-16 pb-20 font-sans text-slate-200">
      <section className="text-center">
        <h1 className="text-6xl font-bold mb-6">Cookie Audit</h1>
        <p className="mx-auto max-w-md mb-4">
          Please enter any URL to scan cookies for.
        </p>
      </section>
      <section className="bg-stone-700 border border-zinc-500 rounded-xl px-4 py-2">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-md p-4  focus:border-sky-600 focus:ring-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-sky-400 text-white font-semibold text-sm py-3 px-9 rounded-lg whitespace-nowrap hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Scanning..." : "Scan Cookies"}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <section className="bg-red-600 text-white rounded-xl p-4">
          <p>{error}</p>
        </section>
      )}

      {cookies.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies Found for {scannedURL}</h2>
          <CookieTable cookies={cookies} />
        </section>
      )}

      {!loading && cookies.length === 0 && !error && scannedURL && (
        <section className="text-center p-8">
          <p className="text-lg">No cookies found for {scannedURL}</p>
        </section>
      )}
    </main>
  );
}