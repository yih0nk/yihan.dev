"use client";

import { useEffect, useState } from "react";

type SpotifyResponse = {
    profile: any;
    recentTracks: any[];
};

function timeAgo(dateString: string | undefined) {
    if (!dateString) return "";
    const then = new Date(dateString).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);

    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function Spotify() {
    const [data, setData] = useState<SpotifyResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/spotify/status")
            .then((res) => res.json())
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700/40" />
                    <div className="space-y-2 flex-1">
                        <div className="h-3 bg-slate-700/40 rounded w-1/2" />
                        <div className="h-3 bg-slate-700/30 rounded w-1/3" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-3 bg-slate-700/30 rounded w-5/6" />
                    <div className="h-3 bg-slate-700/20 rounded w-4/6" />
                    <div className="h-3 bg-slate-700/10 rounded w-3/6" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <p className="text-slate-400 text-xs">
                Spotify data unavailable. Try refreshing the page.
            </p>
        );
    }

    const { profile, recentTracks = [] } = data;

    return (
        <div className="text-sm text-slate-200 space-y-4">
            {/* PROFILE HEADER */}
            {/* PROFILE HEADER */}
            {profile && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {profile.images?.[0]?.url && (
                            <img
                                src={profile.images[0].url}
                                alt="Spotify avatar"
                                className="h-10 w-10 rounded-full object-cover border border-white/10"
                            />
                        )}
                        <div>
                            <p className="font-semibold text-sky-400 leading-tight">
                                {profile.display_name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                Connected to Spotify
                            </p>
                        </div>
                    </div>

                    {profile.external_urls?.spotify && (
                        <a
                            href={profile.external_urls.spotify}
                            target="_blank"
                            className="text-[11px] px-2 py-1 rounded-full border border-slate-700/70 text-slate-400 hover:border-sky-500 hover:text-sky-400 transition"
                        >
                            Open profile ↗
                        </a>
                    )}
                </div>
            )}


            {/* RECENTLY PLAYED LIST */}
            <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Recently played
                </p>

                {(recentTracks ?? []).slice(0, 5).map((item: any, idx: number) => {
                    if (!item.track) return null;
                    const track = item.track;

                    const artists = track.artists
                        ?.map((a: any) => a.name)
                        .join(", ");

                    const playedAt = item.played_at as string | undefined;

                    return (
                        <a
                            key={track.id + playedAt}
                            href={track.external_urls.spotify}
                            target="_blank"
                            className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-800/70 transition group"
                        >
                            {/* index */}
                            <span className="text-[11px] text-slate-500 w-4 text-right">
                                {idx + 1}
                            </span>

                            {/* cover */}
                            {track.album?.images?.[0]?.url && (
                                <img
                                    src={track.album.images[0].url}
                                    alt={track.name}
                                    className="w-10 h-10 rounded-md object-cover shadow group-hover:shadow-lg group-hover:shadow-sky-500/25"
                                />
                            )}

                            {/* text */}
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-[13px] font-medium group-hover:text-sky-400">
                                    {track.name}
                                </p>
                                <p className="truncate text-[11px] text-slate-500">
                                    {artists}
                                </p>
                            </div>

                            {/* time */}
                            <p className="text-[10px] text-slate-500 whitespace-nowrap">
                                {timeAgo(playedAt)}
                            </p>
                        </a>
                    );
                })}

                {recentTracks.length === 0 && (
                    <p className="text-xs text-slate-500">
                        Looks quiet here...
                    </p>
                )}
            </div>
        </div>
    );
}


