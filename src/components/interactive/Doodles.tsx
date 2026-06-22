'use client'

import { motion } from 'framer-motion'

const STROKE = '#aaa'
const SW = 1.5

function MusicNote() {
  return (
    <svg width="30" height="42" viewBox="0 0 30 42" fill="none" aria-hidden>
      {/* note head */}
      <ellipse cx="10" cy="34" rx="7" ry="5" transform="rotate(-20 10 34)" fill={STROKE} />
      {/* stem */}
      <path d="M16 32 L16 6" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* flag */}
      <path d="M16 6 C17 6, 22 8, 24 14 C25 17, 23 19, 20 18" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
    </svg>
  )
}

function DogFace() {
  return (
    <svg width="44" height="48" viewBox="0 0 44 48" fill="none" aria-hidden>
      {/* floppy ears - drawn first, hanging down from sides of head */}
      <path d="M8 16 C4 16, 1 20, 2 28 C3 34, 6 36, 8 34 C10 32, 9 26, 8 22" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M36 16 C40 16, 43 20, 42 28 C41 34, 38 36, 36 34 C34 32, 35 26, 36 22" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* head */}
      <ellipse cx="22" cy="20" rx="14" ry="13" stroke={STROKE} strokeWidth={SW} />
      {/* eyes */}
      <circle cx="16" cy="18" r="1.8" fill={STROKE} />
      <circle cx="28" cy="18" r="1.8" fill={STROKE} />
      {/* nose */}
      <ellipse cx="22" cy="24" rx="3" ry="2.2" fill={STROKE} />
      {/* mouth */}
      <path d="M22 26.5 L22 29" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M18 30 C20 32, 24 32, 26 30" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
      {/* tongue */}
      <path d="M22 32 C22 35, 24 36, 24.5 34" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CodeBrackets() {
  return (
    <svg width="40" height="36" viewBox="0 0 40 36" fill="none" aria-hidden>
      <path d="M12 2 C8 2, 6 4, 6 8 L6 14 C6 16, 4 18, 2 18 C4 18, 6 20, 6 22 L6 28 C6 32, 8 34, 12 34" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <path d="M28 2 C32 2, 34 4, 34 8 L34 14 C34 16, 36 18, 38 18 C36 18, 34 20, 34 22 L34 28 C34 32, 32 34, 28 34" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <circle cx="17" cy="18" r="1.2" fill={STROKE} />
      <circle cx="23" cy="18" r="1.2" fill={STROKE} />
    </svg>
  )
}

function PaintPalette() {
  return (
    <svg width="44" height="38" viewBox="0 0 44 38" fill="none" aria-hidden>
      <path
        d="M22 2 C10 2, 2 10, 2 20 C2 30, 10 36, 20 36 C24 36, 26 34, 26 32 C26 28, 20 28, 20 24 C20 20, 26 18, 32 18 C38 18, 42 14, 42 10 C42 4, 32 2, 22 2Z"
        stroke={STROKE} strokeWidth={SW} strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="2.5" stroke={STROKE} strokeWidth="1.2" />
      <circle cx="10" cy="24" r="2" stroke={STROKE} strokeWidth="1.2" />
      <circle cx="16" cy="28" r="2" stroke={STROKE} strokeWidth="1.2" />
      <circle cx="18" cy="12" r="1.8" stroke={STROKE} strokeWidth="1.2" />
    </svg>
  )
}

function Pencil() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <path d="M8 28 L26 10 L30 14 L12 32 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M26 10 L28 8 C29 7, 31 7, 32 8 L32 8 C33 9, 33 11, 32 12 L30 14" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M8 28 L6 34 L12 32" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M24 12 L28 16" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function CatFace() {
  return (
    <svg width="38" height="36" viewBox="0 0 38 36" fill="none" aria-hidden>
      <path d="M4 14 L8 2 L14 12" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 14 L30 2 L24 12" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="19" cy="22" rx="15" ry="12" stroke={STROKE} strokeWidth={SW} />
      <circle cx="13" cy="19" r="1.5" fill={STROKE} />
      <circle cx="25" cy="19" r="1.5" fill={STROKE} />
      <path d="M17 24 C18 25.5, 20 25.5, 21 24" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 20 L12 22" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
      <path d="M2 24 L12 24" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
      <path d="M36 20 L26 22" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
      <path d="M36 24 L26 24" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function Camera() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32" fill="none" aria-hidden>
      <rect x="3" y="8" width="34" height="22" rx="3" stroke={STROKE} strokeWidth={SW} />
      <path d="M14 8 L16 3 L24 3 L26 8" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="20" cy="19" r="7" stroke={STROKE} strokeWidth={SW} />
      <circle cx="20" cy="19" r="3.5" stroke={STROKE} strokeWidth="1" />
      <circle cx="32" cy="13" r="1.5" fill={STROKE} />
    </svg>
  )
}

function CoffeeCup() {
  return (
    <svg width="38" height="42" viewBox="0 0 38 42" fill="none" aria-hidden>
      {/* cup body */}
      <path d="M5 16 L7 36 C7 38, 9 39, 11 39 L21 39 C23 39, 25 38, 25 36 L27 16" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      {/* rim */}
      <path d="M4 16 L28 16" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* handle */}
      <path d="M28 20 C32 20, 35 23, 35 27 C35 31, 32 34, 28 34" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
      {/* steam */}
      <path d="M11 12 C11 9, 13 9, 13 6 C13 4, 11 3, 11 1" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M19 11 C19 8, 21 8, 21 5 C21 3, 19 2, 19 0" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function Shuttlecock() {
  return (
    <svg width="28" height="44" viewBox="0 0 28 44" fill="none" aria-hidden>
      {/* cork base - rounded */}
      <path d="M10 38 C10 42, 18 42, 18 38 L18 34 C18 33, 10 33, 10 34 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      {/* feather skirt outline */}
      <path d="M10 34 C6 28, 2 16, 4 4 C8 2, 14 0, 20 2 C28 4, 24 16, 22 28 C21 31, 18 34, 18 34" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* feather lines */}
      <path d="M8 30 C7 22, 5 14, 7 6" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
      <path d="M14 33 C14 24, 14 14, 14 3" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
      <path d="M20 30 C21 22, 23 14, 21 6" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function Star() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <path
        d="M17 2 L20.5 12 L31 12.5 L23 20 L25.5 31 L17 25 L8.5 31 L11 20 L3 12.5 L13.5 12 Z"
        stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

interface DoodleDef {
  svg: React.ReactNode
  top?: string
  left?: string
  right?: string
  bottom?: string
  rotation: number
  delay: number
  hideOnMobile: boolean
}

const DOODLES: DoodleDef[] = [
  { svg: <MusicNote />,     top: '12%', left: '6%',   rotation: -10, delay: 0.5,  hideOnMobile: false },
  { svg: <CodeBrackets />,  top: '10%', right: '7%',  rotation: 6,   delay: 0.65, hideOnMobile: false },
  { svg: <DogFace />,       top: '40%', left: '4%',   rotation: 8,   delay: 0.8,  hideOnMobile: true },
  { svg: <Camera />,        top: '35%', right: '5%',  rotation: -5,  delay: 0.95, hideOnMobile: true },
  { svg: <CatFace />,       bottom: '18%', left: '8%',  rotation: 5,   delay: 1.1,  hideOnMobile: false },
  { svg: <PaintPalette />,  bottom: '15%', right: '6%', rotation: -8,  delay: 1.25, hideOnMobile: false },
  { svg: <CoffeeCup />,     top: '22%', left: '14%',  rotation: 12,  delay: 1.4,  hideOnMobile: true },
  { svg: <Pencil />,        bottom: '30%', right: '12%', rotation: -15, delay: 1.55, hideOnMobile: true },
  { svg: <Shuttlecock />,   top: '18%', right: '16%', rotation: 10,  delay: 1.7,  hideOnMobile: false },
  { svg: <Star />,          bottom: '35%', left: '12%', rotation: 0,   delay: 1.85, hideOnMobile: true },
]

export default function Doodles() {
  return (
    <>
      {DOODLES.map((d, i) => (
        <motion.div
          key={i}
          className={d.hideOnMobile ? 'hidden md:block' : ''}
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            right: d.right,
            bottom: d.bottom,
            rotate: `${d.rotation}deg`,
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: [0, -5, 0],
          }}
          transition={{
            opacity: { delay: d.delay, duration: 0.5 },
            y: {
              delay: d.delay + 0.5,
              duration: 3.5 + i * 0.4,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          {d.svg}
        </motion.div>
      ))}
    </>
  )
}
