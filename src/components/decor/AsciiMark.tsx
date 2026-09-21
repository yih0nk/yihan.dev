import { FONTS } from '@/styles/tokens'

/**
 * A faint ASCII drawing, meant to sit in a page's whitespace as decoration —
 * the same alphabet the homepage reel resolves into. Pass the art as text; the
 * parent positions it. Decoration only: aria-hidden, non-interactive, drawn in
 * a faint ink mix so it reads as a watermark rather than content.
 */

/** Placeholder until the real shark/cat art is dropped in. */
export const PLACEHOLDER_ART = `..::::::--------------------------------------
-:..::::::-----------------------------------=
=-::..:::::::----------------------===========
+=--::...::::::-------------------============
#----::::..:::------------------------=======+
==-::::::::...::::-----===================++++
-==-=-:::::::::::::::-----=====+++++====++===-
---::-=--:::::::::::::::::----------========--
-.::=-::::::::::::::::::::::----======+*==----
- :..----::::---------======-------=+==+++=-=*
-  : .:::::..      .-+*++-===--====++=====+===
-  :  : .......::::+@@@@@%=-:::----===----====
    ..-%+#*%=..:-:=-:--=+=--=%@@@===+#@@@+. =*
 =.=@:=@#*##::=*%*%@@#=-#@@@@@@@%*++*%%@@@%+:-
  .:-#@@@%::=%@@@@@@#@@#@@@@@@@#  =+######@@@*
  =+***++###**@%-#@@#*+-+#@@@@@@@@%+***#**##**
                 +@%::=@@@@@@@@@@@@---==-=====
             .  .*@@*+*@@@@@@@@@@@@-:------===
                 =%%@@@@@@@@@@@%:::::::---------
                .*#%@%. #@%%%-::::------------`

export default function AsciiMark({ art, className = '' }: { art: string; className?: string }) {
  return (
    <pre
      aria-hidden
      className={`pointer-events-none m-0 select-none ${className}`}
      style={{
        fontFamily: FONTS.mono,
        fontSize: '11px',
        lineHeight: '11px',
        letterSpacing: '0.5px',
        color: 'color-mix(in srgb, var(--color-ink) 40%, transparent)',
      }}
    >
      {art}
    </pre>
  )
}
