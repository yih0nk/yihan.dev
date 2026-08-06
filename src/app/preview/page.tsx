'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

/**
 * Toolbar-free preview of the new homepage.
 *
 * Rendered as a fixed, full-viewport layer above the site chrome so there is no
 * nav, footer, or control bar sitting on top of the design — what you see here
 * is what a visitor would see.
 *
 * The font switcher starts HIDDEN. It used to start open, which put a white
 * pill across the middle of the hero in every screenshot anyone took of this
 * page. Press F to bring it up.
 *
 * The previous four-section arrangement is still reachable at /preview/v2 for
 * side-by-side comparison; it goes when this one is promoted to /.
 */
const Home = dynamic(() => import('@/components/home/Home'), { ssr: false })

const FONT = '"Instrument Serif", serif'

/** Three free grotesks standing in for Söhne / Suisse Int'l, switchable live. */
const BODY_FONTS = [
  {
    key: 'switzer',
    label: "Switzer — closest to Suisse Int'l",
    css: 'Switzer, ui-sans-serif, system-ui, sans-serif',
  },
  {
    key: 'general',
    label: 'General Sans — warmer, Söhne-ish',
    css: '"General Sans", ui-sans-serif, system-ui, sans-serif',
  },
  { key: 'geist', label: 'Geist — Vercel, self-hostable', css: 'Geist, ui-sans-serif, system-ui, sans-serif' },
  { key: 'inter', label: 'Inter — the safe default', css: 'Inter, ui-sans-serif, system-ui, sans-serif' },
]

export default function PreviewPage() {
  const [body, setBody] = useState(BODY_FONTS[1].css) // General Sans — the chosen face
  const [showUI, setShowUI] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') setShowUI((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@300;400;500&family=Geist:wght@300;400;500&family=Source+Code+Pro:wght@300;400;500&display=swap'
    document.head.appendChild(link)

    // Switzer + General Sans come from Fontshare (both free for commercial use)
    const fontshare = document.createElement('link')
    fontshare.rel = 'stylesheet'
    fontshare.href =
      'https://api.fontshare.com/v2/css?f[]=switzer@300,400,500&f[]=general-sans@300,400,500&display=swap'
    document.head.appendChild(fontshare)

    return () => {
      document.head.removeChild(link)
      document.head.removeChild(fontshare)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ background: '#f7f8f9', ['--font-body' as string]: body }}
    >
      <Home font={FONT} />

      {showUI && (
        <div className="fixed bottom-4 left-1/2 z-[10000] flex -translate-x-1/2 items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          {BODY_FONTS.map((f) => (
            <button
              key={f.key}
              onClick={() => setBody(f.css)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                body === f.css ? 'bg-black text-white' : 'text-ink-soft hover:bg-gray-100'
              }`}
              style={{ fontFamily: f.css }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
