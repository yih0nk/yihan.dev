'use client'

import { useState, useRef, useEffect } from 'react'

interface Track {
  src: string   // e.g. "/audio/piece-01.mp3"
  label?: string
}

interface AudioPlayerProps {
  tracks: Track[]
}

export default function AudioPlayer({ tracks }: AudioPlayerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState<number[]>(tracks.map(() => 0))
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([])

  // Pause all tracks, then play the selected one
  const toggle = (i: number) => {
    const audio = audioRefs.current[i]
    if (!audio) return

    if (activeIndex === i && playing) {
      audio.pause()
      setPlaying(false)
    } else {
      // Pause whatever was playing
      if (activeIndex !== null && activeIndex !== i) {
        audioRefs.current[activeIndex]?.pause()
      }
      audio.play()
      setActiveIndex(i)
      setPlaying(true)
    }
  }

  const handleTimeUpdate = (i: number) => {
    const audio = audioRefs.current[i]
    if (!audio || !audio.duration) return
    setProgress(prev => {
      const next = [...prev]
      next[i] = audio.currentTime / audio.duration
      return next
    })
  }

  const handleEnded = (i: number) => {
    setPlaying(false)
    setProgress(prev => { const n = [...prev]; n[i] = 0; return n })
  }

  const handleScrub = (i: number, e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRefs.current[i]
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
    setProgress(prev => { const n = [...prev]; n[i] = ratio; return n })
  }

  return (
    <ul className="space-y-3">
      {tracks.map((track, i) => {
        const isActive = activeIndex === i
        const isPlaying = isActive && playing

        return (
          <li key={i} className="flex items-center gap-4">
            {/* Hidden audio element */}
            <audio
              ref={el => { audioRefs.current[i] = el }}
              src={track.src}
              onTimeUpdate={() => handleTimeUpdate(i)}
              onEnded={() => handleEnded(i)}
            />

            {/* Play / Pause button */}
            <button
              onClick={() => toggle(i)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex-shrink-0 w-9 h-9 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            >
              {isPlaying ? (
                // Pause icon
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="1" y="1" width="4" height="10" />
                  <rect x="7" y="1" width="4" height="10" />
                </svg>
              ) : (
                // Play icon
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <polygon points="2,1 11,6 2,11" />
                </svg>
              )}
            </button>

            {/* Track label + progress bar */}
            <div className="flex-1 flex flex-col gap-1.5">
              {track.label && (
                <span className="text-xs text-gray-500">{track.label}</span>
              )}
              {/* Scrubable progress bar */}
              <div
                className="w-full h-px bg-gray-200 relative cursor-pointer group"
                onClick={e => handleScrub(i, e)}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-black transition-none"
                  style={{ width: `${progress[i] * 100}%` }}
                />
                {/* Thumb dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress[i] * 100}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
