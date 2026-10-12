/**
 * A small felt piano for the Classic's Piano, synthesised (no samples to ship
 * or license). What makes it read as a piano rather than an organ:
 *
 *  - partials of a stiff string, stretched sharp as they climb (inharmonicity),
 *    each one decaying faster than the one below it;
 *  - two strings per note, a hair apart, so the tone beats and blooms;
 *  - a two-stage decay: a quick drop from the strike (the "prompt" sound),
 *    then a long, quiet aftersound;
 *  - a felt hammer: brightness that depends on how hard the note is played,
 *    closing down as the note rings, plus a short thump of filtered noise;
 *  - a damper on release, and a room: a convolution reverb from a generated
 *    impulse (stereo noise, decaying, darkening as it goes).
 *
 * Everything feeds one compressor, so a fistful of notes stays polite.
 */

export type Piano = {
  noteOn(midi: number, velocity?: number): void
  noteOff(midi: number): void
  allOff(): void
  dispose(): void
}

type Voice = { gain: GainNode; oscs: OscillatorNode[]; until: number }

/** Stereo decaying noise, low-passed a little more as it decays: a small, warm room. */
function roomImpulse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const n = Math.round(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let lp = 0
    for (let i = 0; i < n; i++) {
      const t = i / n
      const k = 0.55 + 0.4 * t // the one-pole low-pass closes as the tail goes on
      lp = lp * k + (Math.random() * 2 - 1) * (1 - k)
      d[i] = lp * Math.pow(1 - t, decay) * 2.2
    }
  }
  return buf
}

export function createPiano(ctx: AudioContext, out: AudioNode): Piano {
  const bus = ctx.createGain()
  bus.gain.value = 0.42
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.knee.value = 12
  comp.ratio.value = 3
  comp.attack.value = 0.004
  comp.release.value = 0.3
  const verb = ctx.createConvolver()
  verb.buffer = roomImpulse(ctx, 2.4, 3.2)
  const wet = ctx.createGain()
  wet.gain.value = 0.26
  bus.connect(comp)
  bus.connect(verb)
  verb.connect(wet)
  wet.connect(comp)
  comp.connect(out)

  // one short buffer of noise for the hammers
  const noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.08), ctx.sampleRate)
  {
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }

  const voices = new Map<number, Voice>()

  const release = (v: Voice, at: number, tau: number) => {
    v.gain.gain.cancelScheduledValues(at)
    v.gain.gain.setValueAtTime(v.gain.gain.value, at)
    v.gain.gain.setTargetAtTime(0, at, tau)
    const end = at + tau * 8
    for (const o of v.oscs) {
      try {
        o.stop(end)
      } catch {
        /* already stopped */
      }
    }
    v.until = end
  }

  const noteOff = (midi: number) => {
    const v = voices.get(midi)
    if (!v) return
    voices.delete(midi)
    // the damper comes down: quick, but not a click
    release(v, ctx.currentTime, 0.07)
  }

  const noteOn = (midi: number, velocity = 0.75) => {
    const old = voices.get(midi)
    if (old) {
      voices.delete(midi)
      release(old, ctx.currentTime, 0.02)
    }
    const t = ctx.currentTime + 0.004
    const f0 = 440 * 2 ** ((midi - 69) / 12)
    const vel = Math.max(0.15, Math.min(1, velocity))

    const gain = ctx.createGain()
    gain.gain.value = 1
    // low notes a little left, high a little right, as if sitting at it
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.max(-0.45, Math.min(0.45, (midi - 64) / 40))
    gain.connect(pan).connect(bus)

    // the felt: bright at the strike, closing as the note rings; harder is brighter
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 0.6
    const open = Math.min(14000, f0 * (5 + 12 * vel * vel))
    lp.frequency.setValueAtTime(open, t)
    lp.frequency.setTargetAtTime(Math.max(f0 * 2.2, 500), t + 0.02, 0.9)
    lp.connect(gain)

    // how long a note sings: the bass rings for seconds, the top a fraction of that
    const ring = 3.2 * Math.pow(0.5, (midi - 48) / 22)
    const B = midi < 45 ? 0.0004 : 0.00015 // inharmonicity: thicker strings are stiffer
    const oscs: OscillatorNode[] = []
    const level = 0.11 * (0.35 + 0.65 * vel)
    for (let n = 1; n <= 9; n++) {
      const fn = f0 * n * Math.sqrt(1 + B * n * n)
      if (fn > 15000) break
      // a struck string a seventh of the way along: some partials weak, the rest falling away
      const amp = (level / Math.pow(n, 1.15)) * (n === 7 ? 0.25 : 1) * (n > 1 ? 0.5 + 0.5 * vel : 1)
      const life = ring / (1 + 0.45 * (n - 1))
      for (const cents of [-0.9, 0.9]) {
        const o = ctx.createOscillator()
        o.type = 'sine'
        o.frequency.value = fn * 2 ** (cents / 1200)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(amp, t + 0.003)
        // the prompt sound drops away fast...
        g.gain.setTargetAtTime(amp * 0.32, t + 0.003, Math.max(0.05, life * 0.09))
        // ...and the aftersound lingers
        g.gain.setTargetAtTime(0, t + 0.003 + life * 0.25, life)
        o.connect(g).connect(lp)
        o.start(t)
        o.stop(t + 0.003 + life * 7)
        oscs.push(o)
      }
    }
    // the hammer: a short, soft knock under the note
    const knock = ctx.createBufferSource()
    knock.buffer = noise
    const kf = ctx.createBiquadFilter()
    kf.type = 'bandpass'
    kf.frequency.value = Math.min(4000, f0 * 3)
    kf.Q.value = 1.2
    const kg = ctx.createGain()
    kg.gain.setValueAtTime(0, t)
    kg.gain.linearRampToValueAtTime(0.05 * vel, t + 0.002)
    kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    knock.connect(kf).connect(kg).connect(gain)
    knock.start(t)
    knock.stop(t + 0.07)

    voices.set(midi, { gain, oscs, until: Infinity })
  }

  return {
    noteOn,
    noteOff,
    allOff() {
      for (const m of [...voices.keys()]) noteOff(m)
    },
    dispose() {
      for (const v of voices.values()) release(v, ctx.currentTime, 0.02)
      voices.clear()
      bus.disconnect()
      comp.disconnect()
    },
  }
}
