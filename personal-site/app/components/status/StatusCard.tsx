"use client";

import { useState } from "react";
import Coding from "./Coding";
import Spotify from "./Spotify";

export default function StatusCard() {
    const [tab, setTab] = useState<"coding" | "spotify">("coding");

    return (
        <div className="h-[32rem] md:h-[36rem] rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-5 flex flex-col shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-m font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Now
                    </p>
                </div>

                <div className="flex items-center gap-1 text-sm text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-4">
                <div className="inline-flex rounded-full bg-slate-800/70 p-1">
                    <button
                        onClick={() => setTab("coding")}
                        className={`px-4 py-1 text-xs rounded-full transition ${tab === "coding"
                                ? "bg-sky-500 text-black shadow"
                                : "text-slate-300 hover:text-slate-100"
                            }`}
                    >
                        Coding
                    </button>

                    <button
                        onClick={() => setTab("spotify")}
                        className={`px-4 py-1 text-xs rounded-full transition ${tab === "spotify"
                                ? "bg-sky-500 text-black shadow"
                                : "text-slate-300 hover:text-slate-100"
                            }`}
                    >
                        Spotify
                    </button>
                </div>
            </div>

            {/* Body – fills remaining height */}
            <div className="flex-1">
                {tab === "coding" ? (
                    // Coding fills card, no inner scroll
                    <div className="h-full overflow-hidden">
                        <Coding />
                    </div>
                ) : (
                    // Spotify has its own scroll area inside fixed card height
                    <div className="h-full overflow-y-auto pr-1">
                        <Spotify />
                    </div>
                )}
            </div>
        </div>
    );
}

