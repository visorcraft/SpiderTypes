import * as Tone from "tone";

/**
 * Calm music-box version of "Itsy Bitsy Spider" for a typing game.
 *
 * Main game usage:
 *
 *   const music = createItsyBitsyMusicBox();
 *
 *   startButton.addEventListener("click", async () => {
 *     await music.ready();
 *   });
 *
 *   // On correct key:
 *   music.playNextTypedNote();
 *
 *   // On wrong key:
 *   music.playGentleMiss();
 *
 *   // On level start:
 *   music.resetTypedMelody();
 *
 *   // On title screen or celebration:
 *   music.playFullSong();
 */

const BPM = 96;
const BEATS_PER_SECOND = BPM / 60;
const SONG_LENGTH_BEATS = 32;

function getTransport() {
  return typeof Tone.getTransport === "function"
    ? Tone.getTransport()
    : Tone.Transport;
}

function getDraw() {
  return typeof Tone.getDraw === "function" ? Tone.getDraw() : Tone.Draw;
}

function beatsToSeconds(beats) {
  return beats / BEATS_PER_SECOND;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function octaveUp(note, octaves = 1) {
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(note);
  if (!match) return note;
  return `${match[1]}${Number(match[2]) + octaves}`;
}

function scheduleUi(callback, audioTime) {
  const draw = getDraw();

  if (draw && typeof draw.schedule === "function") {
    draw.schedule(callback, audioTime);
    return;
  }

  window.setTimeout(callback, Math.max(0, (audioTime - Tone.now()) * 1000));
}

/**
 * Familiar Itsy Bitsy Spider contour, lifted into a prettier music-box range:
 *
 *   G C C C D E E | E D C D E C
 *   E E F G       | G F E F G E
 *   C C D E       | E D C D E C
 *   G G C C C D E E | E D C D E C
 */
const MELODY = [
  // Line 1: "The itsy bitsy spider went up the water spout."
  // A brief rest (beat 3.5-4.0) sits after "spider" before "went up the water spout".
  { beat: 0.0, dur: 0.5, note: "G4", text: "The", lineIndex: 0 },
  { beat: 0.5, dur: 0.5, note: "C5", text: "it-", lineIndex: 0 },
  { beat: 1.0, dur: 0.5, note: "C5", text: "sy", lineIndex: 0 },
  { beat: 1.5, dur: 0.5, note: "C5", text: "bit-", lineIndex: 0 },
  { beat: 2.0, dur: 0.5, note: "D5", text: "sy", lineIndex: 0 },
  { beat: 2.5, dur: 0.5, note: "E5", text: "spi-", lineIndex: 0 },
  { beat: 3.0, dur: 0.5, note: "E5", text: "der", lineIndex: 0 },
  // beat 3.5-4.0: brief delay after "spider"
  { beat: 4.0, dur: 0.5, note: "E5", text: "went", lineIndex: 0 },
  { beat: 4.5, dur: 0.5, note: "D5", text: "up", lineIndex: 0 },
  { beat: 5.0, dur: 0.5, note: "C5", text: "the", lineIndex: 0 },
  { beat: 5.5, dur: 0.5, note: "D5", text: "wa-", lineIndex: 0 },
  { beat: 6.0, dur: 0.5, note: "E5", text: "ter", lineIndex: 0 },
  { beat: 6.5, dur: 1.5, note: "C5", text: "spout.", lineIndex: 0 },

  // Line 2: "Down came the rain, and washed the spider out."
  // 0.10 gap after "Down"; "came the rain," together; ~0.75-beat pause after "rain,".
  // Closing "and washed the spider out" at 0.7/note (same pace as the line-3 closing).
  { beat: 8.0, dur: 0.5, note: "E5", text: "Down", lineIndex: 1 },
  // 0.10 gap after "Down"
  { beat: 8.6, dur: 0.5, note: "E5", text: "came", lineIndex: 1 },
  { beat: 9.1, dur: 0.5, note: "F5", text: "the", lineIndex: 1 },
  { beat: 9.6, dur: 0.5, note: "G5", text: "rain,", lineIndex: 1 },
  // ~0.75-beat pause after "rain"
  { beat: 10.35, dur: 0.7, note: "G5", text: "and", lineIndex: 1 },
  { beat: 11.05, dur: 0.7, note: "F5", text: "washed", lineIndex: 1 },
  { beat: 11.75, dur: 0.7, note: "E5", text: "the", lineIndex: 1 },
  { beat: 12.45, dur: 0.7, note: "F5", text: "spi-", lineIndex: 1 },
  { beat: 13.15, dur: 0.7, note: "G5", text: "der", lineIndex: 1 },
  { beat: 13.85, dur: 2.15, note: "E5", text: "out.", lineIndex: 1 },

  // Line 3: "Up came the sun, and dried up all the rain,"
  // Closing "and dried up all the rain" is drawn out (0.7/note) so "rain," lands ~1.5 beats before line 4.
  { beat: 16.0, dur: 0.5, note: "C5", text: "Up", lineIndex: 2 },
  { beat: 16.5, dur: 0.5, note: "C5", text: "came", lineIndex: 2 },
  { beat: 17.0, dur: 0.5, note: "D5", text: "the", lineIndex: 2 },
  { beat: 17.5, dur: 1.5, note: "E5", text: "sun,", lineIndex: 2 },
  { beat: 19.0, dur: 0.7, note: "E5", text: "and", lineIndex: 2 },
  { beat: 19.7, dur: 0.7, note: "D5", text: "dried", lineIndex: 2 },
  { beat: 20.4, dur: 0.7, note: "C5", text: "up", lineIndex: 2 },
  { beat: 21.1, dur: 0.7, note: "D5", text: "all", lineIndex: 2 },
  { beat: 21.8, dur: 0.7, note: "E5", text: "the", lineIndex: 2 },
  { beat: 22.5, dur: 1.5, note: "C5", text: "rain,", lineIndex: 2 },

  // Line 4: "and the itsy bitsy spider went up the spout again."
  // A brief rest (beat 28.0-28.5) sits after "spider" before "went up the spout again".
  { beat: 24.0, dur: 0.5, note: "G4", text: "and", lineIndex: 3 },
  { beat: 24.5, dur: 0.5, note: "G4", text: "the", lineIndex: 3 },
  { beat: 25.0, dur: 0.5, note: "C5", text: "it-", lineIndex: 3 },
  { beat: 25.5, dur: 0.5, note: "C5", text: "sy", lineIndex: 3 },
  { beat: 26.0, dur: 0.5, note: "C5", text: "bit-", lineIndex: 3 },
  { beat: 26.5, dur: 0.5, note: "D5", text: "sy", lineIndex: 3 },
  { beat: 27.0, dur: 0.5, note: "E5", text: "spi-", lineIndex: 3 },
  { beat: 27.5, dur: 0.5, note: "E5", text: "der", lineIndex: 3 },
  // beat 28.0-28.5: brief delay after "spider"
  { beat: 28.5, dur: 0.5, note: "E5", text: "went", lineIndex: 3 },
  { beat: 29.0, dur: 0.5, note: "D5", text: "up", lineIndex: 3 },
  { beat: 29.5, dur: 0.5, note: "C5", text: "the", lineIndex: 3 },
  { beat: 30.0, dur: 0.5, note: "D5", text: "spout", lineIndex: 3 },
  { beat: 30.5, dur: 0.5, note: "E5", text: "a-", lineIndex: 3 },
  { beat: 31.0, dur: 1.0, note: "C5", text: "gain.", lineIndex: 3 }
];

const HARMONY = [
  // Very light arpeggiated support. Sparse on purpose.
  { beat: 0, dur: 2, notes: ["C4", "G4", "E5"] },
  { beat: 2, dur: 2, notes: ["C4", "G4", "E5"] },
  { beat: 4, dur: 2, notes: ["G3", "D4", "B4"] },
  { beat: 6, dur: 2, notes: ["C4", "G4", "E5"] },

  { beat: 8, dur: 2, notes: ["C4", "G4", "E5"] },
  { beat: 10, dur: 2, notes: ["G3", "D4", "B4"] },
  { beat: 12, dur: 2, notes: ["G3", "D4", "B4"] },
  { beat: 14, dur: 2, notes: ["C4", "G4", "E5"] },

  { beat: 16, dur: 2, notes: ["C4", "G4", "E5"] },
  { beat: 18, dur: 2, notes: ["C4", "G4", "E5"] },
  { beat: 20, dur: 2, notes: ["G3", "D4", "B4"] },
  { beat: 22, dur: 2, notes: ["C4", "G4", "E5"] },

  { beat: 24, dur: 2, notes: ["G3", "D4", "B4"] },
  { beat: 26, dur: 2, notes: ["C4", "G4", "E5"] },
  { beat: 28, dur: 2, notes: ["G3", "D4", "B4"] },
  { beat: 30, dur: 2, notes: ["C4", "G4", "C5"] }
];

export function createItsyBitsyMusicBox(options = {}) {
  const {
    onSyllable = null,
    onProgress = null,
    onEnded = null,

    // Keep this subtle. Larger values sound drunk, not human.
    humanizeTimingSeconds = 0.018,
    humanizeVelocity = 0.08,

    // Synth fallback settings.
    melodyVolume = -9,
    shimmerVolume = -20,
    harmonyVolume = -24,

    // Room settings.
    dryGain = 0.72,
    fxGain = 0.48,
    reverbDecay = 3.4,
    reverbWet = 0.86,
    delayWet = 0.24,
    delayFeedback = 0.13,

    /**
     * Optional sampled mode.
     *
     * Pass self-hosted, license-cleared samples only:
     *
     *   sampleBaseUrl: "/samples/music-box/",
     *   sampleUrls: {
     *     C4: "C4.mp3",
     *     E4: "E4.mp3",
     *     G4: "G4.mp3",
     *     C5: "C5.mp3",
     *     E5: "E5.mp3",
     *     G5: "G5.mp3"
     *   }
     *
     * If omitted, this module uses the soft synthesized music-box voice.
     */
    sampleBaseUrl = "",
    sampleUrls = null
  } = options;

  const transport = getTransport();

  let disposed = false;
  let scheduledIds = [];
  let progressFrame = null;
  let typedNoteIndex = 0;

  const limiter = new Tone.Limiter(-1).toDestination();
  const master = new Tone.Volume(-3).connect(limiter);

  const dry = new Tone.Gain(dryGain).connect(master);

  const delay = new Tone.FeedbackDelay("8n", delayFeedback);
  delay.wet.value = delayWet;

  const reverb = new Tone.Reverb({
    decay: reverbDecay,
    preDelay: 0.025
  });
  reverb.wet.value = reverbWet;

  const fxSend = new Tone.Gain(fxGain);
  fxSend.chain(delay, reverb, master);

  const instrumentBus = new Tone.Gain(1);
  const mellowFilter = new Tone.Filter(6500, "lowpass");

  instrumentBus.connect(mellowFilter);
  mellowFilter.connect(dry);
  mellowFilter.connect(fxSend);

  const melodyBell = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.018,
      decay: 0.42,
      sustain: 0.08,
      release: 1.35
    }
  }).connect(instrumentBus);
  melodyBell.volume.value = melodyVolume;

  const shimmerBell = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.0,
      release: 1.1
    }
  }).connect(instrumentBus);
  shimmerBell.volume.value = shimmerVolume;

  const harmonyBell = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.025,
      decay: 0.5,
      sustain: 0.04,
      release: 1.45
    }
  }).connect(instrumentBus);
  harmonyBell.volume.value = harmonyVolume;

  let sampler = null;
  let samplesReady = Promise.resolve();

  if (sampleUrls) {
    samplesReady = new Promise((resolve) => {
      sampler = new Tone.Sampler({
        urls: sampleUrls,
        baseUrl: sampleBaseUrl,
        attack: 0.004,
        release: 1.2,
        onload: resolve
      }).connect(instrumentBus);
    });
  }

  function humanTime() {
    return randomRange(-humanizeTimingSeconds, humanizeTimingSeconds);
  }

  function humanVelocity(base = 0.78) {
    return clamp(
      base + randomRange(-humanizeVelocity, humanizeVelocity),
      0.15,
      1
    );
  }

  function triggerMusicBoxNote(note, durationSeconds, time, velocity = 0.78) {
    if (sampler) {
      sampler.triggerAttackRelease(note, durationSeconds, time, velocity);
      return;
    }

    melodyBell.triggerAttackRelease(note, durationSeconds, time, velocity);

    // Tiny upper-octave ping gives a music-box sparkle without going chiptune.
    shimmerBell.triggerAttackRelease(
      octaveUp(note, 1),
      durationSeconds * 0.55,
      time + 0.012,
      velocity * 0.35
    );
  }

  function triggerHarmonyArp(notes, durationSeconds, time, velocity = 0.28) {
    notes.forEach((note, index) => {
      const noteTime = time + index * 0.055 + randomRange(-0.006, 0.008);
      const noteDur = durationSeconds * randomRange(0.42, 0.58);
      const noteVelocity = velocity * randomRange(0.72, 1.05);

      if (sampler) {
        sampler.triggerAttackRelease(note, noteDur, noteTime, noteVelocity);
      } else {
        harmonyBell.triggerAttackRelease(note, noteDur, noteTime, noteVelocity);
      }
    });
  }

  function playMelodyEvent(event, scheduledAudioTime, optionsForEvent = {}) {
    const {
      includeSyllableCallback = true,
      forceNoNegativeHumanize = false
    } = optionsForEvent;

    const offset = forceNoNegativeHumanize
      ? randomRange(0.004, humanizeTimingSeconds)
      : humanTime();

    const time = scheduledAudioTime + offset;
    const duration = beatsToSeconds(event.dur) * randomRange(0.92, 1.04);
    const velocity = humanVelocity(event.dur >= 1 ? 0.72 : 0.82);

    triggerMusicBoxNote(event.note, duration, time, velocity);

    if (includeSyllableCallback && onSyllable) {
      scheduleUi(() => onSyllable(event), time);
    }
  }

  function clearScheduledEvents() {
    for (const id of scheduledIds) {
      transport.clear(id);
    }

    scheduledIds = [];
  }

  function stopProgressLoop() {
    if (progressFrame !== null) {
      cancelAnimationFrame(progressFrame);
      progressFrame = null;
    }
  }

  function startProgressLoop(startedAtMs) {
    stopProgressLoop();

    if (!onProgress) return;

    const tick = () => {
      const elapsedSeconds = (performance.now() - startedAtMs) / 1000;
      const beat = Math.min(SONG_LENGTH_BEATS, elapsedSeconds * BEATS_PER_SECOND);

      onProgress({
        beat,
        progress: beat / SONG_LENGTH_BEATS,
        elapsedSeconds
      });

      if (beat < SONG_LENGTH_BEATS) {
        progressFrame = requestAnimationFrame(tick);
      }
    };

    progressFrame = requestAnimationFrame(tick);
  }

  async function ready() {
    if (disposed) return;

    await Tone.start();
    await samplesReady;

    if (reverb.ready) {
      await reverb.ready;
    }
  }

  async function playFullSong() {
    if (disposed) return;

    await ready();
    stopFullSong();

    transport.bpm.value = BPM;
    transport.loop = false;
    transport.position = 0;

    for (const event of HARMONY) {
      const id = transport.schedule((time) => {
        triggerHarmonyArp(
          event.notes,
          beatsToSeconds(event.dur),
          time + randomRange(-0.012, 0.018),
          0.22
        );
      }, beatsToSeconds(event.beat));

      scheduledIds.push(id);
    }

    for (const event of MELODY) {
      const id = transport.schedule((time) => {
        playMelodyEvent(event, time);
      }, beatsToSeconds(event.beat));

      scheduledIds.push(id);
    }

    const endId = transport.schedule((time) => {
      scheduleUi(() => {
        stopFullSong();

        if (onEnded) {
          onEnded();
        }
      }, time);
    }, beatsToSeconds(SONG_LENGTH_BEATS + 0.25));

    scheduledIds.push(endId);

    const startedAt = performance.now();
    transport.start("+0.04", 0);
    startProgressLoop(startedAt);
  }

  function stopFullSong() {
    stopProgressLoop();
    clearScheduledEvents();

    transport.stop();
    transport.position = 0;
  }

  async function playNextTypedNote() {
    if (disposed) return null;

    await ready();

    const event = MELODY[typedNoteIndex % MELODY.length];
    const now = Tone.now();

    playMelodyEvent(event, now + 0.006, {
      forceNoNegativeHumanize: true
    });

    // Add a very occasional soft supporting note, not a chord on every key.
    // This keeps the keystroke feedback clean and encouraging.
    if (typedNoteIndex % 6 === 0) {
      const harmony = HARMONY.find(
        (item) => event.beat >= item.beat && event.beat < item.beat + item.dur
      );

      if (harmony) {
        triggerHarmonyArp(
          harmony.notes.slice(0, 2),
          beatsToSeconds(0.8),
          now + 0.035,
          0.13
        );
      }
    }

    typedNoteIndex += 1;
    return event;
  }

  async function playGentleMiss() {
    if (disposed) return;

    await ready();

    const now = Tone.now();

    // A soft downward hint. Not buzzy, not punitive.
    triggerMusicBoxNote("A4", 0.45, now + 0.006, 0.28);
    triggerMusicBoxNote("G4", 0.7, now + 0.13, 0.22);
  }

  function resetTypedMelody(startIndex = 0) {
    typedNoteIndex = startIndex;
  }

  function setRoomAmount(amount) {
    const safeAmount = clamp(amount, 0, 1);

    fxSend.gain.rampTo(0.18 + safeAmount * 0.48, 0.15);
    reverb.wet.rampTo(0.45 + safeAmount * 0.45, 0.15);
    delay.wet.rampTo(0.08 + safeAmount * 0.22, 0.15);
  }

  function dispose() {
    if (disposed) return;

    stopFullSong();
    disposed = true;

    melodyBell.dispose();
    shimmerBell.dispose();
    harmonyBell.dispose();

    if (sampler) {
      sampler.dispose();
    }

    instrumentBus.dispose();
    mellowFilter.dispose();
    dry.dispose();
    fxSend.dispose();
    delay.dispose();
    reverb.dispose();
    master.dispose();
    limiter.dispose();
  }

  return {
    ready,
    playFullSong,
    stopFullSong,
    playNextTypedNote,
    playGentleMiss,
    resetTypedMelody,
    setRoomAmount,
    dispose,

    bpm: BPM,
    melody: MELODY,
    lengthBeats: SONG_LENGTH_BEATS,
    lengthSeconds: beatsToSeconds(SONG_LENGTH_BEATS)
  };
}
