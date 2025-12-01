"use client";

import { useState } from "react";
import Coding from "./Coding";
import Spotify from "./Spotify";

export default function StatusCard() {
    const [tab, setTab] = useState<"coding" | "spotify">("coding");
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-lg p-4">
            <div className="flex gap-2 mb-4">

                <button
                    onClick={() => setTab("coding")}
                    className={`px-3 py-1 rounded-md text-sm ${
                    tab === "coding" ? "bg-sky-500 text-black" : "text-slate-400"
                    }`}
                >
                    Coding
                </button>
    
                <button
                    onClick={() => setTab("spotify")}
                    className={`px-3 py-1 rounded-md text-sm ${
                    tab === "spotify" ? "bg-sky-500 text-black" : "text-slate-400"
                    }`}
                >
                    Spotify
                </button>
          </div>
          {tab === "coding" ? <Coding /> : <Spotify />}
        </div>
    );
}