/*
  Itsy Bitsy Spider Teaches Home Row
  Runtime privacy notes:
  - No remote requests, analytics, cookies, or service workers.
  - The spider model is a bundled local asset (public/models/spider.glb); no CDN/remote fetch.
  - Progress is saved only with localStorage under STORAGE_KEY.
  - Three.js and Tone.js are bundled from npm by Vite.
*/

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const STORAGE_KEY = "itsy-bitsy-spider-home-row:v1";
const DEFAULT_SETTINGS = {
  sound: true,
  reducedMotion: false
};
const INTRO_DURATION_MS = 5200;
const PRE_WASH_MS = 720;
const WASH_DURATION_MS = 3300;
const MAX_PIXEL_RATIO = 1.75;
const KEY_FLASH_MS = 240;
const MISSED_REVIEW_LIMIT = 5;
const CELEBRATION_FIREWORK_INTERVAL_MS = 650;
const CELEBRATION_FIREWORK_BURSTS = 5;
const CELEBRATION_CAMERA_SWEEP_X = 1.45;
const FIREWORK_LIFE_MULTIPLIER = 1.5;
const FIREWORK_GRAVITY = 0.53;
const FIREWORK_TYPES = ["burst", "ring", "flower", "flower", "willow"];

// Baby spider GLB (see public/models/spider.glb). Clips:
// Idle, Crawl, LegTwitch, Jump, SpoutHold, SpoutCrawlLoop, SpoutCrawlUp.
const SPIDER_MODEL_URL = "/models/spider.glb";
const SPIDER_TARGET_HEIGHT = 0.47025; // world units; another 10% smaller
const SPIDER_FACING_OFFSET_Y = 0; // set to Math.PI if the model faces away from the camera
const SPIDER_SPOUT_OFFSET = 0.03; // distance from spout centerline so legs sit near the pipe surface

const LEVELS = [
  {
    id: 1,
    title: "F and J bumps",
    focus: "Rest your pointer fingers on F and J. Feel the little bumps, then type in order.",
    text: "ffff jjjj fjfj jfjf"
  },
  {
    id: 2,
    title: "Left home row",
    focus: "Left hand home row: A S D F. Keep fingers resting on their homes.",
    text: "aaaa ssss dddd ffff asdf fdsa"
  },
  {
    id: 3,
    title: "Right home row",
    focus: "Right hand home row: J K L ;. Keep J under your pointer finger.",
    text: "jjjj kkkk llll ;;;; jkl; ;lkj"
  },
  {
    id: 4,
    title: "All home row keys",
    focus: "Use both hands together. Watch the next key, not your hands.",
    text: "asdf jkl; asdf jkl; a; sl dk fj"
  },
  {
    id: 5,
    title: "Home row words",
    focus: "The spider climbs on short words made mostly from the home row.",
    text: "dad sad lad all fall ask flask salad"
  },
  {
    id: 6,
    title: "Tiny phrases",
    focus: "Add spaces between words. Space is part of the lesson.",
    text: "a lad asks dad as jill falls"
  },
  {
    id: 7,
    title: "Add E and I",
    focus: "Reach up for E and I, then return to home row after each reach.",
    text: "jill sees a seed fall"
  },
  {
    id: 8,
    title: "Add R and U",
    focus: "Reach up for R and U. The baby spider is learning to stretch.",
    text: "the spider feels the sun"
  },
  {
    id: 9,
    title: "Rain words",
    focus: "Keep the rhythm steady when the rain words get longer.",
    text: "rain runs down the old spout"
  },
  {
    id: 10,
    title: "Hold fast",
    focus: "Home row is your anchor while your fingers travel to other keys.",
    text: "the baby spider holds fast"
  },
  {
    id: 11,
    title: "Up the spout",
    focus: "Short repeated words help build flow and confidence.",
    text: "up up up goes the tiny spider"
  },
  {
    id: 12,
    title: "A wave to a moth",
    focus: "The spider imagines friendly faces near the roof.",
    text: "the spider will wave to a moth"
  },
  {
    id: 13,
    title: "Meet a snail",
    focus: "Longer phrases ask for calm hands and clear eyes.",
    text: "the spider hopes to meet a snail"
  },
  {
    id: 14,
    title: "Kind memories",
    focus: "Try to type smoothly without rushing. Kindness beats speed.",
    text: "the spider kindly recalls soft rain"
  },
  {
    id: 15,
    title: "Near the roof",
    focus: "The roof is getting closer. Let accuracy pull the spider upward.",
    text: "a friendly ant waits near the roof"
  },
  {
    id: 16,
    title: "Cozy web",
    focus: "Now type a whole sentence with a period at the end.",
    text: "the spider plans to build a cozy web."
  },
  {
    id: 17,
    title: "Shared snack",
    focus: "Comma practice appears in a friendly sentence.",
    text: "at the top, the spider will share a snack."
  },
  {
    id: 18,
    title: "Sun after rain",
    focus: "Longer sentences reward steady home-row returns.",
    text: "the sun dries the rain and warms the roof."
  },
  {
    id: 19,
    title: "Climb again",
    focus: "Last rainy climb. Stay calm through the whole sentence.",
    text: "friends cheer as the spider climbs again."
  },
  {
    id: 20,
    title: "Celebration at the roof",
    focus: "Final climb. This time the spider reaches the roof and stays there.",
    text: "the spider reaches the roof and dances with kind friends."
  }
];

const KEY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", "."],
  [" "]
];

const HOME_KEYS = new Set(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"]);
const BUMP_KEYS = new Set(["f", "j"]);

const dom = {
  sceneMount: document.getElementById("sceneMount"),
  levelSelectButton: document.getElementById("levelSelectButton"),
  endLevelSelectButton: document.getElementById("endLevelSelectButton"),
  restartButton: document.getElementById("restartButton"),
  soundToggleButton: document.getElementById("soundToggleButton"),
  motionToggleButton: document.getElementById("motionToggleButton"),
  pauseButton: document.getElementById("pauseButton"),
  skipIntroButton: document.getElementById("skipIntroButton"),
  cameraCaption: document.getElementById("cameraCaption"),
  levelLabel: document.getElementById("levelLabel"),
  levelTitle: document.getElementById("levelTitle"),
  lessonFocus: document.getElementById("lessonFocus"),
  timerDisplay: document.getElementById("timerDisplay"),
  bestDisplay: document.getElementById("bestDisplay"),
  progressBar: document.getElementById("progressBar"),
  targetKey: document.getElementById("targetKey"),
  nextChunk: document.getElementById("nextChunk"),
  feedback: document.getElementById("feedback"),
  lessonText: document.getElementById("lessonText"),
  mistakeCount: document.getElementById("mistakeCount"),
  accuracyDisplay: document.getElementById("accuracyDisplay"),
  wpmDisplay: document.getElementById("wpmDisplay"),
  streakDisplay: document.getElementById("streakDisplay"),
  remainingDisplay: document.getElementById("remainingDisplay"),
  keyboard: document.getElementById("keyboard"),
  levelModal: document.getElementById("levelModal"),
  closeLevelModal: document.getElementById("closeLevelModal"),
  closeLevelModalBottom: document.getElementById("closeLevelModalBottom"),
  levelGrid: document.getElementById("levelGrid"),
  clearScoresButton: document.getElementById("clearScoresButton"),
  endOverlay: document.getElementById("endOverlay"),
  endKicker: document.getElementById("endKicker"),
  endTitle: document.getElementById("endTitle"),
  endMessage: document.getElementById("endMessage"),
  endStats: document.getElementById("endStats"),
  endCoach: document.getElementById("endCoach"),
  endReview: document.getElementById("endReview"),
  retryButton: document.getElementById("retryButton"),
  nextButton: document.getElementById("nextButton")
};

const state = {
  mode: "loading",
  introPlayed: false,
  introStart: 0,
  levelIndex: 0,
  charIndex: 0,
  mistakes: 0,
  totalKeys: 0,
  streak: 0,
  bestStreak: 0,
  missedKeys: {},
  startTime: 0,
  paused: false,
  pauseStarted: 0,
  pausedMs: 0,
  finishMs: 0,
  newBest: false,
  slipPenaltyChars: 0,
  visualProgress: 0,
  washStart: 0,
  preWashStart: 0,
  celebrationStart: 0,
  lastFireworkAt: 0,
  lastFrameMs: 0,
  wrongFlashTimer: 0,
  save: {
    unlocked: 1,
    bestTimes: {},
    settings: { ...DEFAULT_SETTINGS }
  }
};

const world = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  house: null,
  spider: null,
  spiderMixer: null,
  spiderActions: null,
  spiderActiveAction: null,
  spiderJumpActive: false,
  spiderMoving: false,
  spiderStationarySince: null,
  spiderBodyLength: 0,
  friends: null,
  rain: null,
  rainPositions: null,
  rainDrops: [],
  washWater: null,
  sun: null,
  fireworks: [],
  spoutStart: null,
  spoutEnd: null,
  spoutAngle: 0,
  materials: {}
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function formatTime(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "--";
  return `${(ms / 1000).toFixed(2)}s`;
}

function displayChar(ch) {
  if (ch === " ") return "space";
  return ch;
}

function displayLessonChar(ch) {
  if (ch === " ") return "·";
  return ch;
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeKey(eventOrCharacter) {
  const raw = typeof eventOrCharacter === "string" ? eventOrCharacter : eventOrCharacter.key;
  if (raw === " " || raw === "Spacebar" || raw === "Space") return " ";
  if (!raw || raw.length !== 1) return "";
  return raw.toLowerCase();
}

function soundEnabled() {
  return state.save.settings.sound;
}

function reducedMotionEnabled() {
  return state.save.settings.reducedMotion;
}

function elapsedLevelMs(now = performance.now()) {
  if (!state.startTime) return 0;
  const activePauseMs = state.paused ? now - state.pauseStarted : 0;
  return Math.max(0, now - state.startTime - state.pausedMs - activePauseMs);
}

function currentWpm(now = performance.now()) {
  const elapsedMs = state.finishMs || elapsedLevelMs(now);
  if (!state.finishMs && elapsedMs < 1000) return 0;
  return Math.round((state.charIndex / 5) / (elapsedMs / 60000));
}

function nextChunkLabel(lesson, index) {
  if (index >= lesson.length) return "complete";

  const remaining = lesson.slice(index);
  if (remaining[0] === " ") {
    const nextWord = remaining.slice(1).trimStart().match(/^\S+/)?.[0] || "";
    return nextWord ? `space then ${nextWord}` : "space";
  }

  return remaining.match(/^\S+/)?.[0] || displayChar(remaining[0]);
}

function loadSave() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.save.unlocked = clamp(Number(parsed.unlocked) || 1, 1, LEVELS.length);
      state.save.bestTimes = parsed.bestTimes && typeof parsed.bestTimes === "object" ? parsed.bestTimes : {};
      const parsedSettings = parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {};
      state.save.settings = {
        sound: parsedSettings.sound !== false,
        reducedMotion: parsedSettings.reducedMotion === true
      };
    }
  } catch (error) {
    console.warn("Could not read saved typing progress:", error);
  }
}

function saveProgress() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
  } catch (error) {
    console.warn("Could not save typing progress:", error);
  }
}

// --- Music box: the full song loops quietly in the background while a level is being played, and
// stops when the level is done. Constructed at boot so its reverb impulse is ready before playback. ---
let musicBox = null;
let musicLoadPromise = null;
let musicActive = false;
let musicLoopTimer = null;
const MUSIC_LOOP_GAP_MS = 5000;

async function loadMusic() {
  if (musicBox) return musicBox;
  try {
    const { createItsyBitsyMusicBox } = await import("./spiderMusicBox.js");
    // Loop for the duration of the level, with a 5s silence between repeats.
    musicBox = createItsyBitsyMusicBox({
      onEnded: () => {
        if (!musicActive || !soundEnabled()) return;
        musicLoopTimer = window.setTimeout(() => {
          musicLoopTimer = null;
          if (musicActive && soundEnabled()) musicBox.playFullSong().catch(() => {});
        }, MUSIC_LOOP_GAP_MS);
      }
    });
    return musicBox;
  } catch (error) {
    console.warn("Music unavailable:", error);
    return null;
  }
}

function ensureMusicLoaded() {
  if (musicBox) return Promise.resolve(musicBox);
  if (!musicLoadPromise) {
    musicLoadPromise = loadMusic().finally(() => {
      if (!musicBox) musicLoadPromise = null;
    });
  }
  return musicLoadPromise;
}

function startLevelMusic() {
  if (musicActive || !soundEnabled() || state.paused) return;
  musicActive = true;
  ensureMusicLoaded().then((box) => {
    if (!box || !musicActive || !soundEnabled() || state.paused) return;
    // playFullSong() awaits Tone.start() internally; called from a user action so audio is permitted.
    box.playFullSong().catch(() => {});
  });
}

function stopLevelMusic() {
  musicActive = false;
  if (!musicBox) return;
  if (musicLoopTimer !== null) {
    window.clearTimeout(musicLoopTimer);
    musicLoopTimer = null;
  }
  musicBox.stopFullSong();
}

function bootstrap() {
  loadSave();
  buildKeyboard();
  bindEvents();
  applySettings();
  initThree();
  buildWorld();
  initLevel(0, { playIntro: true });
  requestAnimationFrame(animate);
}

function bindEvents() {
  window.addEventListener("keydown", (event) => {
    if (!dom.levelModal.classList.contains("hidden")) {
      if (event.key === "Escape") closeLevelModal();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = normalizeKey(event);
    if (!key) return;
    event.preventDefault();
    if (event.repeat) return;
    handleTypedKey(key);
  });

  window.addEventListener("resize", resizeRenderer);

  dom.keyboard.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-key]");
    if (!button) return;
    handleTypedKey(button.dataset.key);
  });

  dom.levelSelectButton.addEventListener("click", openLevelModal);
  dom.endLevelSelectButton.addEventListener("click", openLevelModal);
  dom.restartButton.addEventListener("click", () => {
    initLevel(state.levelIndex, { playIntro: false });
  });
  dom.pauseButton.addEventListener("click", togglePause);
  dom.soundToggleButton.addEventListener("click", () => {
    state.save.settings.sound = !state.save.settings.sound;
    saveProgress();
    applySettings();
    if (soundEnabled() && state.mode === "playing" && state.startTime && !state.paused) {
      startLevelMusic();
    }
  });
  dom.motionToggleButton.addEventListener("click", () => {
    state.save.settings.reducedMotion = !state.save.settings.reducedMotion;
    saveProgress();
    applySettings();
    if (reducedMotionEnabled()) clearFireworks();
  });
  dom.closeLevelModal.addEventListener("click", closeLevelModal);
  dom.closeLevelModalBottom.addEventListener("click", closeLevelModal);

  dom.levelModal.addEventListener("click", (event) => {
    if (event.target === dom.levelModal) closeLevelModal();
  });

  dom.endOverlay.addEventListener("click", (event) => {
    if (event.target === dom.endOverlay) {
      // Keep the completion choice visible. Children often click outside by accident.
      return;
    }
  });

  dom.retryButton.addEventListener("click", () => {
    initLevel(state.levelIndex, { playIntro: false });
  });

  dom.nextButton.addEventListener("click", () => {
    if (state.levelIndex >= LEVELS.length - 1) {
      // Final level: dismiss the overlay so the celebration scene is visible.
      dom.endOverlay.classList.add("hidden");
      return;
    }
    const nextIndex = clamp(state.levelIndex + 1, 0, LEVELS.length - 1);
    initLevel(nextIndex, { playIntro: false });
  });

  dom.clearScoresButton.addEventListener("click", () => {
    const shouldClear = window.confirm("Clear all saved personal best times and locked-level progress?");
    if (!shouldClear) return;
    state.save = { unlocked: 1, bestTimes: {} };
    saveProgress();
    renderLevelModal();
    renderHud();
  });

  dom.skipIntroButton.addEventListener("click", () => {
    if (state.mode === "intro") {
      state.introPlayed = true;
      state.mode = "playing";
      dom.skipIntroButton.style.display = "none";
      dom.cameraCaption.textContent = "Type the glowing key to help the baby spider climb.";
      updateTopControls();
    }
  });
}

function applySettings() {
  document.body.classList.toggle("reduce-motion", reducedMotionEnabled());
  updateTopControls();
  if (!soundEnabled()) stopLevelMusic();
}

function updateTopControls() {
  dom.soundToggleButton.textContent = soundEnabled() ? "Sound On" : "Sound Off";
  dom.soundToggleButton.setAttribute("aria-pressed", String(soundEnabled()));

  dom.motionToggleButton.textContent = reducedMotionEnabled() ? "Motion Low" : "Motion On";
  dom.motionToggleButton.setAttribute("aria-pressed", String(reducedMotionEnabled()));

  const canPause = state.mode === "playing";
  dom.pauseButton.disabled = !canPause;
  dom.pauseButton.textContent = state.paused ? "Resume" : "Pause";
  dom.pauseButton.setAttribute("aria-pressed", String(state.paused));
  document.body.classList.toggle("is-paused", state.paused);
}

function togglePause() {
  if (state.mode !== "playing") return;

  const now = performance.now();
  if (state.paused) {
    state.paused = false;
    state.pausedMs += now - state.pauseStarted;
    state.pauseStarted = 0;
    dom.feedback.className = "feedback";
    dom.feedback.textContent = "Keep climbing.";
    if (state.startTime) startLevelMusic();
  } else {
    state.paused = true;
    state.pauseStarted = now;
    stopLevelMusic();
    dom.feedback.className = "feedback";
    dom.feedback.textContent = "Paused.";
  }

  updateTopControls();
  updateTimerDisplay();
}

function buildKeyboard() {
  dom.keyboard.innerHTML = "";

  KEY_ROWS.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "key-row";

    row.forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.key = key;
      button.className = "key";
      if (key === " ") button.classList.add("space");
      if (HOME_KEYS.has(key)) button.classList.add("home");
      if (BUMP_KEYS.has(key)) button.classList.add("bump");
      button.textContent = key === " " ? "space" : key;
      button.setAttribute("aria-label", key === " " ? "space" : `key ${key}`);
      rowElement.appendChild(button);
    });

    dom.keyboard.appendChild(rowElement);
  });
}

function initThree() {
  world.clock = new THREE.Clock();
  world.scene = new THREE.Scene();
  world.scene.background = new THREE.Color(0x0c1627);
  world.scene.fog = new THREE.Fog(0x0c1627, 11, 28);

  world.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  world.camera.position.set(0, 14.8, 4.5);

  world.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  world.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  world.renderer.shadowMap.enabled = true;
  world.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ("outputColorSpace" in world.renderer) {
    world.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  world.renderer.setClearColor(0x0c1627, 1);
  dom.sceneMount.appendChild(world.renderer.domElement);

  resizeRenderer();
}

function resizeRenderer() {
  if (!world.renderer || !world.camera) return;
  const rect = dom.sceneMount.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  world.camera.aspect = width / height;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(width, height, false);
}

function makeMaterial(name, parameters) {
  const material = new THREE.MeshStandardMaterial(parameters);
  world.materials[name] = material;
  return material;
}

function buildWorld() {
  const scene = world.scene;

  world.materials.wall = makeMaterial("wall", { color: 0x5f5548, roughness: 0.95, metalness: 0.02 });
  world.materials.wallDark = makeMaterial("wallDark", { color: 0x3b352f, roughness: 1 });
  world.materials.roof = makeMaterial("roof", { color: 0x4b2b28, roughness: 0.9 });
  world.materials.roofDark = makeMaterial("roofDark", { color: 0x1b1415, roughness: 1 });
  world.materials.wood = makeMaterial("wood", { color: 0x775337, roughness: 0.86 });
  world.materials.spout = makeMaterial("spout", { color: 0x9aa8ae, roughness: 0.45, metalness: 0.38 });
  world.materials.spoutDark = makeMaterial("spoutDark", { color: 0x6e7a80, roughness: 0.55, metalness: 0.2 });
  world.materials.ground = makeMaterial("ground", { color: 0x293923, roughness: 1 });
  world.materials.path = makeMaterial("path", { color: 0x453c2e, roughness: 1 });
  world.materials.spider = makeMaterial("spider", { color: 0x2f262b, roughness: 0.85 });
  world.materials.eye = makeMaterial("eye", { color: 0xf6fbff, roughness: 0.3 });
  world.materials.pupil = makeMaterial("pupil", { color: 0x111111, roughness: 0.6 });
  world.materials.water = makeMaterial("water", { color: 0x54a9ff, transparent: true, opacity: 0.52, roughness: 0.25, metalness: 0.05 });
  world.materials.sun = makeMaterial("sun", { color: 0xffd36a, emissive: 0xffb84d, emissiveIntensity: 1.3, roughness: 0.4 });

  const hemi = new THREE.HemisphereLight(0xb8dcff, 0x293923, 1.6);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(0xb7d1ff, 2.15);
  moon.position.set(-5, 8, 7);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.near = 0.5;
  moon.shadow.camera.far = 30;
  moon.shadow.camera.left = -10;
  moon.shadow.camera.right = 10;
  moon.shadow.camera.top = 10;
  moon.shadow.camera.bottom = -10;
  scene.add(moon);

  const warm = new THREE.PointLight(0xffd36a, 0.8, 20);
  warm.position.set(-5.5, 5.5, 3);
  scene.add(warm);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 1, 1), world.materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 11), world.materials.path);
  path.rotation.x = -Math.PI / 2;
  path.rotation.z = -0.12;
  path.position.set(2.2, 0.012, 6.1);
  path.receiveShadow = true;
  scene.add(path);

  addPebbles(scene);
  buildHouse(scene);
  buildSpout(scene);
  buildSpiderCharacters(scene);
  buildRain(scene);
  buildSun(scene);
}

function addPebbles(scene) {
  const pebbleMaterial = makeMaterial("pebble", { color: 0x66706a, roughness: 1 });
  const geometry = new THREE.SphereGeometry(0.06, 8, 6);
  for (let i = 0; i < 42; i += 1) {
    const pebble = new THREE.Mesh(geometry, pebbleMaterial);
    pebble.position.set(
      2.2 + (Math.random() - 0.5) * 5.5,
      0.055,
      2.4 + Math.random() * 7.5
    );
    pebble.scale.set(1 + Math.random() * 1.4, 0.35, 0.7 + Math.random() * 1.2);
    pebble.rotation.y = Math.random() * Math.PI;
    pebble.castShadow = true;
    scene.add(pebble);
  }
}

function buildHouse(scene) {
  const house = new THREE.Group();
  house.name = "old abandoned single-story house";

  const body = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.05, 6.1), world.materials.wall);
  body.position.set(0, 1.52, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  for (let y = 0.35; y <= 2.9; y += 0.34) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(8.34, 0.035, 0.06), world.materials.wallDark);
    board.position.set(0, y, 3.085);
    board.castShadow = false;
    house.add(board);
  }

  const windowMat = makeMaterial("window", { color: 0x172437, roughness: 0.55, metalness: 0.05, emissive: 0x08111d, emissiveIntensity: 0.35 });
  const trimMat = makeMaterial("trim", { color: 0x2f2923, roughness: 1 });
  addWindow(house, -2.35, 1.82, 3.12, windowMat, trimMat);
  addWindow(house, 0.2, 1.72, 3.12, windowMat, trimMat);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.22, 2.18, 0.09), world.materials.wood);
  door.position.set(-3.35, 1.09, 3.14);
  door.castShadow = true;
  house.add(door);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), world.materials.spout);
  knob.position.set(-2.95, 1.08, 3.2);
  house.add(knob);

  const frontRoof = new THREE.Group();
  const frontRoofPlane = new THREE.Mesh(new THREE.BoxGeometry(8.95, 0.28, 3.55), world.materials.roof);
  frontRoofPlane.castShadow = true;
  frontRoofPlane.receiveShadow = true;
  frontRoof.add(frontRoofPlane);
  frontRoof.position.set(0, 3.47, 1.2);
  frontRoof.rotation.x = 0.34;
  house.add(frontRoof);

  const backRoof = new THREE.Group();
  const backRoofPlane = new THREE.Mesh(new THREE.BoxGeometry(8.95, 0.28, 3.55), world.materials.roof);
  backRoofPlane.castShadow = true;
  backRoofPlane.receiveShadow = true;
  backRoof.add(backRoofPlane);
  backRoof.position.set(0, 3.47, -1.2);
  backRoof.rotation.x = -0.34;
  house.add(backRoof);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(9.05, 0.22, 0.24), world.materials.roofDark);
  ridge.position.set(0, 4.05, 0);
  ridge.castShadow = true;
  house.add(ridge);

  addRoofDamage(frontRoof);
  addRoofDamage(backRoof);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.35, 0.78), world.materials.wallDark);
  chimney.position.set(-2.8, 4.25, -0.6);
  chimney.castShadow = true;
  house.add(chimney);

  const chimneyTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 1.0), world.materials.roofDark);
  chimneyTop.position.set(-2.8, 4.98, -0.6);
  chimneyTop.castShadow = true;
  house.add(chimneyTop);

  scene.add(house);
  world.house = house;
}

function addWindow(parent, x, y, z, windowMat, trimMat) {
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.12), trimMat);
  frame.position.set(x, y, z);
  frame.castShadow = true;
  parent.add(frame);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.03, 0.74, 0.14), windowMat);
  glass.position.set(x, y, z + 0.045);
  parent.add(glass);

  const crossA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.16), trimMat);
  crossA.position.set(x, y, z + 0.12);
  parent.add(crossA);

  const crossB = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.16), trimMat);
  crossB.position.set(x, y, z + 0.12);
  parent.add(crossB);
}

function addRoofDamage(roofGroup) {
  const holes = [
    { x: -1.2, z: 0.55, sx: 1.0, sz: 0.62, r: 0.06 },
    { x: 2.1, z: -0.35, sx: 0.78, sz: 0.5, r: -0.18 },
    { x: 3.45, z: 0.65, sx: 0.58, sz: 0.32, r: 0.22 }
  ];

  holes.forEach((hole) => {
    const dark = new THREE.Mesh(new THREE.BoxGeometry(hole.sx, 0.045, hole.sz), world.materials.roofDark);
    dark.position.set(hole.x, -0.17, hole.z);
    dark.rotation.y = hole.r;
    roofGroup.add(dark);
  });

  for (let i = 0; i < 8; i += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.18 + Math.random() * 0.24, 0.06, 0.8 + Math.random() * 0.8), world.materials.wood);
    plank.position.set(-3.7 + i * 1.05, -0.22, -1.2 + Math.random() * 2.2);
    plank.rotation.y = -0.35 + Math.random() * 0.7;
    plank.castShadow = true;
    roofGroup.add(plank);
  }
}

function buildSpout(scene) {
  world.spoutStart = new THREE.Vector3(3.15, 0.26, 3.5);
  world.spoutEnd = new THREE.Vector3(2.12, 3.88, 3.12);
  const direction = new THREE.Vector3().subVectors(world.spoutEnd, world.spoutStart).normalize();
  world.spoutDirection = direction;
  // The spider's body is aligned along the spout, with its face pointing toward the camera (+Z).
  world.spoutOutward = new THREE.Vector3(0, 0, 1).projectOnPlane(direction).normalize();
  world.spoutAngle = Math.atan2(-direction.x, direction.y);

  const gutter = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.16, 0.18), world.materials.spoutDark);
  gutter.position.set(0, 3.35, 3.38);
  gutter.rotation.x = -0.05;
  gutter.castShadow = true;
  scene.add(gutter);

  const spoutBack = createCylinderBetween(world.spoutStart, world.spoutEnd, 0.125, world.materials.spoutDark, 18);
  spoutBack.castShadow = true;
  spoutBack.receiveShadow = true;
  scene.add(spoutBack);

  const spoutFront = createCylinderBetween(
    world.spoutStart.clone().add(new THREE.Vector3(0, 0, 0.028)),
    world.spoutEnd.clone().add(new THREE.Vector3(0, 0, 0.028)),
    0.085,
    world.materials.spout,
    18
  );
  spoutFront.castShadow = true;
  spoutFront.receiveShadow = true;
  scene.add(spoutFront);

  const elbow = createCylinderBetween(
    world.spoutStart.clone().add(new THREE.Vector3(0.0, -0.02, 0.02)),
    world.spoutStart.clone().add(new THREE.Vector3(0.7, 0.02, 0.35)),
    0.09,
    world.materials.spout,
    14
  );
  elbow.castShadow = true;
  scene.add(elbow);

  const water = createCylinderBetween(world.spoutStart, world.spoutEnd, 0.15, world.materials.water, 18);
  water.visible = false;
  water.name = "wash water";
  scene.add(water);
  world.washWater = water;
}

function createCylinderBetween(start, end, radius, material, radialSegments = 12, radiusEnd = radius) {
  const length = start.distanceTo(end);
  // +Y end of the cylinder points toward `end`, so radiusEnd is the radius at `end`.
  const geometry = new THREE.CylinderGeometry(radiusEnd, radius, length, radialSegments, 1, false);
  const mesh = new THREE.Mesh(geometry, material);
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  return mesh;
}

function buildSpiderCharacters(scene) {
  // The anchor follows the spout: local +Y points up the pipe and the spider
  // sits on the local -Z side. The GLB animations are authored for this frame.
  const anchor = new THREE.Object3D();
  anchor.name = "baby spider anchor";

  const fallback = createSpider(0x554450, 1.0);
  fallback.name = "baby spider (procedural)";
  // The procedural placeholder is upright (+Y body), so it aligns with the
  // anchor's +Y spout direction without extra rotation. Hide it until the
  // real GLB loads; if loading fails it will be shown as a backup.
  fallback.position.z = -SPIDER_SPOUT_OFFSET;
  fallback.visible = false;
  anchor.add(fallback);

  world.spider = anchor;
  scene.add(anchor);
  positionSpider(0);
  loadSpiderModel();

  const friends = new THREE.Group();
  friends.visible = false;
  const friendSpecs = [
    { color: 0x5a6bd6, x: -0.8, y: 0.0, scale: 0.72 },
    { color: 0x5b9d63, x: 0.05, y: 0.12, scale: 0.64 },
    { color: 0xc06f5a, x: 0.82, y: 0.0, scale: 0.68 }
  ];
  friendSpecs.forEach((spec) => {
    const friend = createSpider(spec.color, spec.scale);
    friend.position.set(world.spoutEnd.x + spec.x, world.spoutEnd.y + 0.08 + spec.y, world.spoutEnd.z + 0.48);
    friend.rotation.z = world.spoutAngle + (Math.random() - 0.5) * 0.8;
    friend.rotation.y = (Math.random() - 0.5) * 0.45;
    friends.add(friend);
  });
  scene.add(friends);
  world.friends = friends;
}

function createSpider(color, scale) {
  const spider = new THREE.Group();
  spider.scale.setScalar(scale);

  // Soft, slightly glossy body that catches the light instead of reading as a flat blob.
  const bodyMat = makeMaterial(`spider-${color}-${scale}-${Math.random()}`, {
    color,
    roughness: 0.48,
    metalness: 0.08,
    emissive: color,
    emissiveIntensity: 0.07
  });
  const legMat = bodyMat;

  // Abdomen: the round rear bulb.
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), bodyMat);
  abdomen.scale.set(1.0, 0.96, 0.92);
  abdomen.position.set(0, -0.03, -0.05);
  abdomen.castShadow = true;
  spider.add(abdomen);

  // Cephalothorax: smaller front segment that carries the face.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 28, 20), bodyMat);
  head.position.set(0, 0.22, 0.07);
  head.scale.set(0.98, 0.94, 0.92);
  head.castShadow = true;
  spider.add(head);

  // Big friendly eyes with pupils and a catchlight.
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), world.materials.eye);
  eyeLeft.position.set(-0.066, 0.305, 0.145);
  spider.add(eyeLeft);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.066;
  spider.add(eyeRight);

  const pupilLeft = new THREE.Mesh(new THREE.SphereGeometry(0.027, 12, 8), world.materials.pupil);
  pupilLeft.position.set(-0.066, 0.31, 0.185);
  spider.add(pupilLeft);
  const pupilRight = pupilLeft.clone();
  pupilRight.position.x = 0.066;
  spider.add(pupilRight);

  const glintLeft = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), world.materials.eye);
  glintLeft.position.set(-0.05, 0.33, 0.205);
  spider.add(glintLeft);
  const glintRight = glintLeft.clone();
  glintRight.position.x = 0.078;
  spider.add(glintRight);

  // Eight jointed legs: hip -> raised knee -> foot, tapering to the tip.
  const legPairs = [
    { y: 0.14, out: 0.40, foot: 0.30, bend: 0.15 },
    { y: 0.04, out: 0.46, foot: 0.12, bend: 0.17 },
    { y: -0.07, out: 0.46, foot: -0.12, bend: 0.17 },
    { y: -0.17, out: 0.40, foot: -0.30, bend: 0.15 }
  ];

  legPairs.forEach((leg) => {
    [-1, 1].forEach((side) => {
      const hip = new THREE.Vector3(side * 0.14, leg.y, 0.0);
      const foot = new THREE.Vector3(side * leg.out, leg.foot, 0.05);
      const knee = new THREE.Vector3(side * leg.out * 0.62, (leg.y + leg.foot) / 2 + leg.bend, 0.04);

      const upper = createCylinderBetween(hip, knee, 0.025, legMat, 8, 0.02);
      upper.castShadow = true;
      spider.add(upper);

      const lower = createCylinderBetween(knee, foot, 0.02, legMat, 8, 0.01);
      lower.castShadow = true;
      spider.add(lower);

      const kneeBall = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), legMat);
      kneeBall.position.copy(knee);
      spider.add(kneeBall);

      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), legMat);
      toe.position.copy(foot);
      spider.add(toe);
    });
  });

  // Warm little smile.
  const smileMat = makeMaterial(`smile-${color}-${scale}-${Math.random()}`, {
    color: 0xffd36a,
    roughness: 0.4,
    emissive: 0x7a4b12,
    emissiveIntensity: 0.12
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.009, 10, 22, Math.PI), smileMat);
  smile.position.set(0, 0.25, 0.18);
  smile.rotation.set(Math.PI / 2, 0, Math.PI);
  spider.add(smile);

  return spider;
}

function loadSpiderModel() {
  const loader = new GLTFLoader();
  loader.load(
    SPIDER_MODEL_URL,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      // Normalize: scale to a fixed height (bind-pose height).
      const bindBox = new THREE.Box3().setFromObject(model);
      const bindSize = new THREE.Vector3();
      bindBox.getSize(bindSize);
      const safeHeight = Math.max(bindSize.y, 0.0001);
      const scale = SPIDER_TARGET_HEIGHT / safeHeight;
      model.scale.setScalar(scale);

      // The spout animations rotate the internal SpiderRoot so the body aligns
      // with the anchor's +Y (spout direction). Sample that pose at time 0 so
      // we can place the spider by its real underside instead of guessing.
      const clips = gltf.animations || [];
      const find = (name) => THREE.AnimationClip.findByName(clips, name);
      const sampleClip = find("SpoutHold") || find("SpoutCrawlLoop") || find("SpoutCrawlUp") || clips[0] || null;
      const sampleMixer = new THREE.AnimationMixer(model);
      if (sampleClip) {
        sampleMixer.clipAction(sampleClip).play();
        sampleMixer.update(0);
      }
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const min = box.min;
      world.spiderBodyLength = size.y;
      model.position.set(
        -center.x,
        -min.y,
        -SPIDER_SPOUT_OFFSET - center.z
      );
      // The spout animations (SpoutHold / SpoutCrawlLoop / SpoutCrawlUp) already
      // rotate the internal SpiderRoot so the body aligns with the spout. Do not
      // add an extra rotation here — SPIDER_FACING_OFFSET_Y can spin around the
      // pipe if the spider ends up on the wrong side.
      model.rotation.set(0, SPIDER_FACING_OFFSET_Y, 0);

      // Swap the procedural fallback for the loaded GLB, keeping the anchor.
      const anchor = world.spider;
      if (anchor) {
        for (let i = anchor.children.length - 1; i >= 0; i -= 1) {
          anchor.remove(anchor.children[i]);
        }
        anchor.add(model);
      } else {
        const newAnchor = new THREE.Object3D();
        newAnchor.name = "baby spider anchor";
        newAnchor.add(model);
        world.spider = newAnchor;
        world.scene.add(newAnchor);
      }

      // AnimationMixer + clip lookup. Missing clips degrade gracefully.
      const mixer = new THREE.AnimationMixer(model);
      const actions = {
        idle: find("Idle") ? mixer.clipAction(find("Idle")) : null,
        crawl: find("Crawl") ? mixer.clipAction(find("Crawl")) : null,
        legTwitch: find("LegTwitch") ? mixer.clipAction(find("LegTwitch")) : null,
        jump: find("Jump") ? mixer.clipAction(find("Jump")) : null,
        spoutHold: find("SpoutHold") ? mixer.clipAction(find("SpoutHold")) : null,
        spoutCrawlLoop: find("SpoutCrawlLoop") ? mixer.clipAction(find("SpoutCrawlLoop")) : null,
        spoutCrawlUp: find("SpoutCrawlUp") ? mixer.clipAction(find("SpoutCrawlUp")) : null
      };
      if (actions.jump) {
        actions.jump.setLoop(THREE.LoopOnce, 1);
        actions.jump.clampWhenFinished = true;
      }
      if (actions.spoutCrawlUp) {
        actions.spoutCrawlUp.setLoop(THREE.LoopOnce, 1);
        actions.spoutCrawlUp.clampWhenFinished = true;
      }

      let initial = actions.spoutHold || actions.idle || actions.crawl || null;
      Object.values(actions).forEach((a) => {
        if (!a || a === initial) return;
        a.enabled = false;
      });
      if (initial) {
        initial.enabled = true;
        initial.play();
        world.spiderActiveAction = initial;
      }
      world.spiderJumpActive = false;
      world.spiderMixer = mixer;
      world.spiderActions = actions;

      positionSpider(state.visualProgress || 0, performance.now());
    },
    undefined,
    (err) => {
      console.error("[spider] failed to load", SPIDER_MODEL_URL, err);
      const anchor = world.spider;
      const fallback = anchor && anchor.getObjectByName("baby spider (procedural)");
      if (fallback) fallback.visible = true;
    }
  );
}

function crossfadeSpiderAction(next, fadeSeconds = 0.25) {
  const actions = world.spiderActions;
  if (!actions || !next) return;
  const others = Object.values(actions).filter((a) => a && a !== next);
  others.forEach((a) => a.fadeOut(fadeSeconds));
  next.enabled = true;
  next.reset().play().fadeIn(fadeSeconds);
}

function updateSpiderAnimation(nowMs = performance.now()) {
  const actions = world.spiderActions;
  if (!actions) return;

  // Let a one-shot jump finish before switching back to a loop.
  if (world.spiderJumpActive && actions.jump && actions.jump.isRunning()) return;
  world.spiderJumpActive = false;

  const canCrawl = state.mode === "playing" && actions.spoutCrawlLoop;
  if (canCrawl && world.spiderMoving) {
    // Start crawling immediately when the spider needs to move.
    world.spiderStationarySince = null;
    if (actions.spoutCrawlLoop !== world.spiderActiveAction) {
      world.spiderActiveAction = actions.spoutCrawlLoop;
      crossfadeSpiderAction(actions.spoutCrawlLoop);
    }
    return;
  }

  // Wait a short beat after stopping before returning to the hold pose so the
  // legs don't flip back and forth between crawl and hold on every tiny pause.
  if (world.spiderStationarySince === null) world.spiderStationarySince = nowMs;
  const HOLD_DELAY_MS = 180;
  if (nowMs - world.spiderStationarySince < HOLD_DELAY_MS) return;

  const want = actions.spoutHold || actions.idle || actions.crawl || null;
  if (!want || want === world.spiderActiveAction) return;
  world.spiderActiveAction = want;
  crossfadeSpiderAction(want, 0.18);
}

function playSpiderJump() {
  const actions = world.spiderActions;
  if (!actions || !actions.jump) return;
  world.spiderJumpActive = true;
  crossfadeSpiderAction(actions.jump, 0.12);
}

function buildRain(scene) {
  const count = 150;
  const positions = new Float32Array(count * 2 * 3);
  world.rainDrops = [];

  for (let i = 0; i < count; i += 1) {
    const drop = {
      x: -5 + Math.random() * 10,
      y: Math.random() * 7.5,
      z: 0.3 + Math.random() * 6.3,
      speed: 4.5 + Math.random() * 3.5,
      lean: -0.18 + Math.random() * 0.1
    };
    world.rainDrops.push(drop);
    writeRainDrop(positions, i, drop);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x90c9ff, transparent: true, opacity: 0.0 });
  const rain = new THREE.LineSegments(geometry, material);
  rain.visible = false;
  scene.add(rain);
  world.rain = rain;
  world.rainPositions = positions;
}

function writeRainDrop(positions, index, drop) {
  const base = index * 6;
  positions[base + 0] = drop.x;
  positions[base + 1] = drop.y;
  positions[base + 2] = drop.z;
  positions[base + 3] = drop.x + drop.lean;
  positions[base + 4] = drop.y - 0.42;
  positions[base + 5] = drop.z;
}

function buildSun(scene) {
  const sun = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 18), world.materials.sun);
  sphere.castShadow = false;
  sun.add(sphere);

  const rayMat = makeMaterial("sunRay", { color: 0xffd36a, emissive: 0xffb84d, emissiveIntensity: 0.85, transparent: true, opacity: 0.7, roughness: 0.5 });
  for (let i = 0; i < 12; i += 1) {
    const ray = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.04), rayMat);
    ray.position.y = 0.95;
    ray.rotation.z = (i / 12) * Math.PI * 2;
    sun.add(ray);
  }

  sun.position.set(-5.4, 5.6, 1.5);
  sun.scale.setScalar(0.9);
  sun.visible = false;
  scene.add(sun);
  world.sun = sun;
}

function initLevel(index, options = {}) {
  stopLevelMusic(); // stop the previous level's music when (re)starting or switching levels
  const playIntro = Boolean(options.playIntro && !state.introPlayed);
  state.levelIndex = clamp(index, 0, LEVELS.length - 1);
  state.charIndex = 0;
  state.mistakes = 0;
  state.totalKeys = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.missedKeys = {};
  state.startTime = 0;
  state.paused = false;
  state.pauseStarted = 0;
  state.pausedMs = 0;
  state.finishMs = 0;
  state.newBest = false;
  state.slipPenaltyChars = 0;
  state.visualProgress = 0;
  state.preWashStart = 0;
  state.washStart = 0;
  state.celebrationStart = 0;
  state.lastFireworkAt = 0;
  state.wrongFlashTimer = 0;
  state.mode = playIntro ? "intro" : "playing";
  state.introStart = performance.now();
  musicBox?.resetTypedMelody();

  dom.endOverlay.classList.add("hidden");
  dom.endCoach.replaceChildren();
  dom.endReview.classList.add("hidden");
  dom.feedback.className = "feedback";
  dom.feedback.textContent = playIntro
    ? "Watch the camera follow the water spout down to the baby spider."
    : "Type the glowing key to help the baby spider climb.";
  dom.skipIntroButton.style.display = playIntro ? "inline-flex" : "none";
  dom.cameraCaption.textContent = playIntro
    ? "Bird's-eye view: finding the old roof and water spout..."
    : "Type the glowing key to help the baby spider climb.";

  if (world.rain) {
    world.rain.visible = false;
    world.rain.material.opacity = 0;
  }
  if (world.washWater) world.washWater.visible = false;
  if (world.sun) world.sun.visible = false;
  if (world.friends) world.friends.visible = false;
  clearFireworks();
  positionSpider(0);
  updateTopControls();
  renderHud();
}

function currentLevel() {
  return LEVELS[state.levelIndex];
}

function currentText() {
  return currentLevel().text;
}

function handleTypedKey(key) {
  if (state.mode === "intro") return;
  if (state.mode !== "playing") return;
  if (state.paused) return;

  const lesson = currentText();
  const expected = lesson[state.charIndex];
  if (!expected) return;

  if (!state.startTime) {
    state.startTime = performance.now();
    startLevelMusic(); // first keystroke starts the looping background song (user gesture allows audio)
  }
  state.totalKeys += 1;

  if (key === expected) {
    flashKeyboardKey(key, "hit");
    state.charIndex += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.slipPenaltyChars = Math.max(0, state.slipPenaltyChars - 0.72);
    dom.feedback.className = "feedback good";
    dom.feedback.textContent = encouragementForProgress();
    pulsePanel("good-pop");
    if (state.charIndex >= lesson.length) {
      completeLevel();
    }
  } else {
    flashKeyboardKey(key, "miss");
    state.mistakes += 1;
    state.streak = 0;
    state.missedKeys[expected] = (state.missedKeys[expected] || 0) + 1;
    state.slipPenaltyChars = Math.min(lesson.length * 0.24, state.slipPenaltyChars + Math.max(1.2, lesson.length * 0.035));
    state.wrongFlashTimer = performance.now();
    dom.feedback.className = "feedback bad";
    dom.feedback.textContent = `Oops. The spider slipped. Type ${displayChar(expected)} next.`;
    if (soundEnabled()) {
      ensureMusicLoaded().then((box) => box?.playGentleMiss().catch(() => {}));
    }
    pulsePanel("bad-shake");
  }

  renderHud();
}

function pulsePanel(className) {
  const panel = document.querySelector(".lesson-panel");
  panel.classList.remove("good-pop", "bad-shake");
  // Force the animation to restart.
  void panel.offsetWidth;
  panel.classList.add(className);
}

function flashKeyboardKey(key, result) {
  const button = Array.from(dom.keyboard.querySelectorAll("button[data-key]"))
    .find((candidate) => candidate.dataset.key === key);
  if (!button) return;

  window.clearTimeout(button._flashTimer);
  button.classList.remove("hit-press", "miss-press");
  void button.offsetWidth;
  button.classList.add(result === "hit" ? "hit-press" : "miss-press");
  button._flashTimer = window.setTimeout(() => {
    button.classList.remove("hit-press", "miss-press");
  }, KEY_FLASH_MS);
}

function encouragementForProgress() {
  const progress = state.charIndex / currentText().length;
  if (progress >= 1) return "Top of the spout!";
  if (progress > 0.78) return "Almost there. Keep your fingers anchored.";
  if (progress > 0.5) return "Halfway up the spout.";
  if (progress > 0.24) return "Nice climbing.";
  return "Good key. Up the spider goes.";
}

function completeLevel() {
  stopLevelMusic();
  const now = performance.now();
  state.finishMs = Math.max(1, elapsedLevelMs(now));

  const key = String(currentLevel().id);
  const previousBest = Number(state.save.bestTimes[key]) || 0;
  state.newBest = previousBest === 0 || state.finishMs < previousBest;
  if (state.newBest) state.save.bestTimes[key] = Math.round(state.finishMs);
  if (state.levelIndex + 1 < LEVELS.length) {
    state.save.unlocked = Math.max(state.save.unlocked, state.levelIndex + 2);
  }
  saveProgress();

  state.slipPenaltyChars = 0;
  state.visualProgress = 1;
  positionSpider(1);

  if (state.levelIndex < LEVELS.length - 1) {
    state.mode = "preWash";
    state.preWashStart = now;
    dom.feedback.className = "feedback good";
    dom.feedback.textContent = "The spider reached the top. Clouds are gathering...";
    dom.cameraCaption.textContent = "The spider reached the roof, but the rain is coming.";
  } else {
    startCelebration(now);
  }

  renderHud();
}

function startWash(now) {
  state.mode = "washing";
  state.washStart = now;
  if (world.rain) {
    world.rain.visible = true;
    world.rain.material.opacity = 0.85;
  }
  if (world.washWater) {
    world.washWater.visible = true;
    world.washWater.material.opacity = 0.62;
  }
  if (world.sun) world.sun.visible = false;
  dom.feedback.className = "feedback bad";
  dom.feedback.textContent = "Down came the rain and washed the spider out.";
  dom.cameraCaption.textContent = "Down came the rain, and washed the spider out.";
}

function finishWash() {
  state.mode = "complete";
  state.visualProgress = 0;
  positionSpider(0);
  if (world.rain) world.rain.material.opacity = 0.38;
  if (world.washWater) world.washWater.visible = false;
  if (world.sun) world.sun.visible = true;
  dom.cameraCaption.textContent = "Up came the sun, and dried up all the rain.";
  updateTopControls();
  showEndOverlay(false);
}

function startCelebration(now) {
  state.mode = "celebrating";
  state.celebrationStart = now;
  if (world.rain) world.rain.visible = false;
  if (world.washWater) world.washWater.visible = false;
  if (world.sun) world.sun.visible = true;
  if (world.friends) world.friends.visible = true;
  playSpiderJump();
  dom.feedback.className = "feedback good";
  dom.feedback.textContent = "The spider made it! Friends are celebrating at the roof.";
  dom.cameraCaption.textContent = "The spider finally made it. Friends and fireworks fill the roof.";
  if (soundEnabled()) {
    ensureMusicLoaded().then((box) => box?.playFullSong().catch(() => {})); // the full music-box song plays the spider home
  }
  updateTopControls();
  showEndOverlay(true);
}

function showEndOverlay(isFinal) {
  const accuracy = state.totalKeys > 0 ? Math.round((state.charIndex / state.totalKeys) * 100) : 100;
  const levelNumber = currentLevel().id;
  const wpm = state.finishMs > 0 ? Math.round((state.charIndex / 5) / (state.finishMs / 60000)) : 0;

  dom.endKicker.textContent = isFinal ? "Celebration!" : "Washed out!";
  dom.endTitle.textContent = isFinal ? "The spider finally made it!" : `Level ${levelNumber} complete`;
  dom.endMessage.textContent = isFinal
    ? "No rain washes the spider away this time. Friends cheer from the roof while fireworks sparkle behind the house."
    : "Down came the rain and washed the spider out. Retry for a better time, or go to the next climb.";

  dom.endStats.innerHTML = [
    `<div class="end-stat"><strong>${formatTime(state.finishMs)}</strong><span>time</span></div>`,
    `<div class="end-stat"><strong>${wpm}</strong><span>wpm</span></div>`,
    `<div class="end-stat"><strong>${state.mistakes}</strong><span>misses</span></div>`,
    `<div class="end-stat"><strong>${accuracy}%</strong><span>accuracy</span></div>`,
    `<div class="end-stat"><strong>${state.bestStreak}</strong><span>best streak</span></div>`,
    `<div class="end-stat"><strong>${state.newBest ? "yes" : "no"}</strong><span>new PB</span></div>`
  ].join("");

  const missed = Object.entries(state.missedKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MISSED_REVIEW_LIMIT);
  renderCoachNote({ accuracy, wpm, missed, isFinal });
  if (missed.length > 0) {
    const keys = missed
      .map(([key, count]) => `<span>${htmlEscape(displayChar(key))}${count > 1 ? ` x${count}` : ""}</span>`)
      .join("");
    dom.endReview.innerHTML = `<strong>Practice next</strong><div>${keys}</div>`;
    dom.endReview.classList.remove("hidden");
  } else {
    dom.endReview.innerHTML = "";
    dom.endReview.classList.add("hidden");
  }

  dom.nextButton.textContent = isFinal ? "Watch Celebration" : "Next Level";
  dom.endOverlay.classList.remove("hidden");
}

function renderCoachNote({ accuracy, wpm, missed, isFinal }) {
  const hardestKey = missed.length > 0 ? displayChar(missed[0][0]) : "";
  const note = {
    title: "Steady climb",
    body: "Keep your eyes on the glowing key and let accuracy pull the spider upward.",
    kind: "steady"
  };

  if (state.mistakes === 0) {
    note.title = "Clean climb";
    note.body = state.newBest
      ? "No misses and a new personal best. Move on while the rhythm is fresh."
      : "No misses this time. Try the next level or replay once for a smoother rhythm.";
    note.kind = "strong";
  } else if (accuracy >= 92 && state.bestStreak >= Math.ceil(currentText().length * 0.45)) {
    note.title = "Strong rhythm";
    note.body = hardestKey
      ? `Great streak work. Give ${hardestKey} one calm look before the next climb.`
      : "Great streak work. Carry that same pace into the next climb.";
    note.kind = "strong";
  } else if (accuracy < 82) {
    note.title = "Accuracy first";
    note.body = hardestKey
      ? `Slow down and watch ${hardestKey}; one clean key matters more than speed.`
      : "Slow down and make each key deliberate before trying for speed.";
    note.kind = "focus";
  } else if (wpm > 0 && wpm < 8) {
    note.title = "Build flow";
    note.body = "The keys are landing. Next time, keep a gentle rhythm between letters.";
  } else if (hardestKey) {
    note.title = "Next tiny goal";
    note.body = `Start the next climb by finding ${hardestKey} before you type.`;
    note.kind = "focus";
  }

  if (isFinal && state.mistakes === 0) {
    note.body = "No misses on the final climb. The spider earned a calm celebration.";
  }

  dom.endCoach.className = `end-coach ${note.kind}`;
  dom.endCoach.replaceChildren();

  const title = document.createElement("strong");
  title.textContent = note.title;
  const body = document.createElement("span");
  body.textContent = note.body;
  dom.endCoach.append(title, body);
}

function renderHud() {
  const level = currentLevel();
  const lesson = currentText();
  const expected = lesson[state.charIndex] || "";
  const best = Number(state.save.bestTimes[String(level.id)]) || 0;
  const totalTyped = Math.max(1, state.totalKeys);
  const accuracy = state.totalKeys === 0 ? 100 : Math.round((state.charIndex / totalTyped) * 100);
  const remaining = Math.max(0, lesson.length - state.charIndex);

  dom.levelLabel.textContent = `Level ${level.id} / ${LEVELS.length}`;
  dom.levelTitle.textContent = level.title;
  dom.lessonFocus.textContent = level.focus;
  dom.bestDisplay.textContent = `PB: ${formatTime(best)}`;
  dom.targetKey.textContent = displayChar(expected || "✓");
  dom.nextChunk.textContent = nextChunkLabel(lesson, state.charIndex);
  dom.mistakeCount.textContent = String(state.mistakes);
  dom.accuracyDisplay.textContent = `${accuracy}%`;
  dom.wpmDisplay.textContent = String(currentWpm());
  dom.streakDisplay.textContent = String(state.streak);
  dom.remainingDisplay.textContent = String(remaining);
  dom.progressBar.style.width = `${Math.round((state.charIndex / lesson.length) * 100)}%`;

  updateTimerDisplay();
  updateTopControls();
  renderLessonText();
  updateKeyboardHighlight(expected);
}

function renderLessonText() {
  const lesson = currentText();
  let html = "";
  for (let i = 0; i < lesson.length; i += 1) {
    const ch = lesson[i];
    const classes = [];
    if (i < state.charIndex) classes.push("done");
    else if (i === state.charIndex) classes.push("current");
    else classes.push("upcoming");
    if (ch === " ") classes.push("space-char");
    html += `<span class="${classes.join(" ")}" data-index="${i}" aria-label="${ch === " " ? "space" : htmlEscape(ch)}">${htmlEscape(displayLessonChar(ch))}</span>`;
  }
  dom.lessonText.innerHTML = html;
  scrollCurrentCharacterIntoView();
}

function scrollCurrentCharacterIntoView() {
  const current = dom.lessonText.querySelector(".current");
  if (!current) return;
  const scroller = current.closest(".lesson-text-card");
  if (!scroller) return;

  const targetLeft = Math.max(0, current.offsetLeft - (scroller.clientWidth - current.clientWidth) / 2);
  const targetTop = Math.max(0, current.offsetTop - (scroller.clientHeight - current.clientHeight) / 2);
  scroller.scrollTo({
    left: targetLeft,
    top: targetTop,
    behavior: reducedMotionEnabled() ? "auto" : "smooth"
  });
}

function updateKeyboardHighlight(expected) {
  const buttons = dom.keyboard.querySelectorAll("button[data-key]");
  buttons.forEach((button) => {
    button.classList.toggle("current", button.dataset.key === expected);
    button.classList.toggle("missed", Boolean(state.missedKeys[button.dataset.key]));
    button.setAttribute("aria-current", button.dataset.key === expected ? "true" : "false");
  });
}

function updateTimerDisplay() {
  if (state.startTime && state.mode === "playing") {
    dom.timerDisplay.textContent = formatTime(elapsedLevelMs());
  } else if (state.finishMs) {
    dom.timerDisplay.textContent = formatTime(state.finishMs);
  } else {
    dom.timerDisplay.textContent = "0.00s";
  }

  dom.wpmDisplay.textContent = String(currentWpm());
}

function openLevelModal() {
  renderLevelModal();
  dom.levelModal.classList.remove("hidden");
}

function closeLevelModal() {
  dom.levelModal.classList.add("hidden");
}

function renderLevelModal() {
  dom.levelGrid.innerHTML = "";
  LEVELS.forEach((level, index) => {
    const unlocked = level.id <= state.save.unlocked;
    const best = Number(state.save.bestTimes[String(level.id)]) || 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-choice";
    if (index === state.levelIndex) button.classList.add("current-level");
    button.disabled = !unlocked;
    button.innerHTML = `
      <strong>Level ${level.id}: ${htmlEscape(level.title)}</strong>
      <span>${htmlEscape(level.focus)}</span>
      <small>${unlocked ? `PB: ${formatTime(best)}` : "Locked"}</small>
    `;
    button.addEventListener("click", () => {
      initLevel(index, { playIntro: false });
      closeLevelModal();
    });
    dom.levelGrid.appendChild(button);
  });
}

function animate(nowMs) {
  const dt = Math.min(0.05, state.lastFrameMs ? (nowMs - state.lastFrameMs) / 1000 : 0.016);
  state.lastFrameMs = nowMs;

  updateMode(nowMs, dt);
  updateSpider(dt, nowMs);
  updateSpiderAnimation(nowMs);
  if (world.spiderMixer) world.spiderMixer.update(dt);
  updateCamera(nowMs, dt);
  updateRain(dt);
  updateCelebration(nowMs, dt);
  updateTimerDisplay();

  world.renderer.render(world.scene, world.camera);
  requestAnimationFrame(animate);
}

function updateMode(nowMs) {
  if (state.mode === "intro") {
    const t = clamp((nowMs - state.introStart) / INTRO_DURATION_MS, 0, 1);
    if (t >= 1) {
      state.introPlayed = true;
      state.mode = "playing";
      dom.skipIntroButton.style.display = "none";
      dom.feedback.className = "feedback";
      dom.feedback.textContent = "Type the glowing key to help the baby spider climb.";
      dom.cameraCaption.textContent = "The camera found the baby spider. Start typing to climb.";
      updateTopControls();
    } else if (t > 0.66) {
      dom.cameraCaption.textContent = "Following the slanted water spout down to the ground...";
    } else if (t > 0.3) {
      dom.cameraCaption.textContent = "There is the torn roof. The water spout runs down the wall.";
    }
  }

  if (state.mode === "preWash" && nowMs - state.preWashStart >= PRE_WASH_MS) {
    startWash(nowMs);
  }

  if (state.mode === "washing") {
    const washT = clamp((nowMs - state.washStart) / WASH_DURATION_MS, 0, 1);
    if (washT >= 1) finishWash();
  }
}

function updateSpider(dt, nowMs) {
  let targetProgress;
  if (state.mode === "washing") {
    const washT = clamp((nowMs - state.washStart) / WASH_DURATION_MS, 0, 1);
    targetProgress = 1 - easeInOutCubic(washT);
  } else if (state.mode === "celebrating" || state.mode === "preWash" || state.mode === "complete") {
    targetProgress = state.mode === "complete" ? 0 : 1;
  } else {
    const lesson = currentText();
    targetProgress = clamp((state.charIndex - state.slipPenaltyChars) / lesson.length, 0, 1);
  }

  const responsiveness = state.mode === "washing" ? 0.24 : 0.14;
  state.visualProgress += (targetProgress - state.visualProgress) * Math.min(1, responsiveness + dt * 2.8);

  if (Math.abs(state.visualProgress - targetProgress) < 0.001) state.visualProgress = targetProgress;
  world.spiderMoving = Math.abs(targetProgress - state.visualProgress) > 0.005;
  positionSpider(state.visualProgress, nowMs);
}

function positionSpider(progress, nowMs = 0) {
  if (!world.spider || !world.spoutStart || !world.spoutEnd || !world.spoutDirection) return;
  const p = clamp(progress, 0, 1);
  const direction = world.spoutDirection;

  // Stop the travel so the spider's center reaches the top of the spout.
  // This keeps the body visible around the roof instead of dangling entirely
  // above the spout end.
  const bodyLength = world.spiderBodyLength || 0;
  const topAnchor = world.spoutEnd.clone().sub(direction.clone().multiplyScalar(bodyLength * 0.5));
  const pos = world.spoutStart.clone().lerp(topAnchor, p);

  const time = nowMs || performance.now();
  const outward = world.spoutOutward;
  const reduceMotion = reducedMotionEnabled();

  // The anchor origin stays on the spout centerline; the model itself is offset
  // along the anchor's local -Z so the spider sits on the visible side of the pipe.
  const bob = reduceMotion ? 0 : Math.sin(time * 0.012) * 0.015;
  world.spider.position.copy(pos).add(outward.clone().multiplyScalar(bob));

  // Align anchor +Y with the spout direction and anchor -Z with outward (camera).
  const xAxis = new THREE.Vector3().crossVectors(outward, world.spoutDirection).normalize();
  const base = new THREE.Matrix4().makeBasis(xAxis, world.spoutDirection, outward.clone().negate());
  const q = new THREE.Quaternion().setFromRotationMatrix(base);

  // Tiny wiggle around the spout axis (local Y) and toward/away from the pipe (local X).
  const roll = reduceMotion ? 0 : Math.sin(time * 0.007) * 0.03;
  const pitch = reduceMotion ? 0 : Math.sin(time * 0.004) * 0.035;
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roll));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch));

  world.spider.quaternion.copy(q);
}

function updateCamera(nowMs, dt) {
  const camera = world.camera;
  const lookAt = new THREE.Vector3();
  const desired = new THREE.Vector3();

  if (state.mode === "intro") {
    const rawT = clamp((nowMs - state.introStart) / INTRO_DURATION_MS, 0, 1);
    const t = easeInOutCubic(rawT);
    const startPos = new THREE.Vector3(0, 15.6, 3.8);
    const midPos = new THREE.Vector3(0.5, 8.5, 7.3);
    const endPos = new THREE.Vector3(3.6, 2.25, 8.85);
    const topLook = world.spoutEnd.clone().add(new THREE.Vector3(-0.5, -0.3, 0.0));
    const bottomLook = world.spoutStart.clone().add(new THREE.Vector3(0, 0.45, 0.0));

    if (t < 0.52) {
      const a = easeInOutCubic(t / 0.52);
      desired.copy(startPos).lerp(midPos, a);
      lookAt.copy(new THREE.Vector3(0, 2.4, 1.1)).lerp(topLook, a);
    } else {
      const a = easeInOutCubic((t - 0.52) / 0.48);
      desired.copy(midPos).lerp(endPos, a);
      lookAt.copy(topLook).lerp(bottomLook, a);
    }

    camera.position.copy(desired);
    camera.lookAt(lookAt);
    return;
  }

  const follow = clamp(state.visualProgress, 0, 1);
  const focusPoint = world.spoutStart.clone().lerp(world.spoutEnd, follow).add(new THREE.Vector3(-0.15, 0.36, 0.15));

  if (state.mode === "celebrating") {
    const celebrationSeconds = (nowMs - state.celebrationStart) / 1000;
    const sweep = reducedMotionEnabled() ? 0 : Math.sin(celebrationSeconds * 0.52);
    const drift = reducedMotionEnabled() ? 0 : Math.cos(celebrationSeconds * 0.34);
    desired.set(1.3 + sweep * CELEBRATION_CAMERA_SWEEP_X, 4.15 + Math.sin(celebrationSeconds * 0.76) * 0.12, 8.15 + drift * 0.28);
    lookAt.copy(world.spoutEnd).add(new THREE.Vector3(-0.05 + sweep * 0.32, 0.25, 0.25));
  } else if (state.mode === "complete") {
    desired.set(3.4, 2.0, 8.4);
    lookAt.copy(world.spoutStart).add(new THREE.Vector3(0, 0.45, 0.2));
  } else {
    desired.set(3.65 - follow * 1.15, 2.18 + follow * 1.85, 8.85 - follow * 0.78);
    lookAt.copy(focusPoint);
  }

  const smoothing = 1 - Math.pow(0.001, dt);
  camera.position.lerp(desired, smoothing * 0.55);
  const currentLook = getCameraLookAtApproximation();
  currentLook.lerp(lookAt, smoothing * 0.72);
  camera.lookAt(currentLook);
}

function getCameraLookAtApproximation() {
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(world.camera.quaternion);
  return world.camera.position.clone().add(direction.multiplyScalar(8));
}

function updateRain(dt) {
  if (!world.rain || !world.rain.visible) return;
  for (let i = 0; i < world.rainDrops.length; i += 1) {
    const drop = world.rainDrops[i];
    drop.y -= drop.speed * dt;
    drop.x += drop.lean * dt * 1.8;
    if (drop.y < 0) {
      drop.y = 5.5 + Math.random() * 2.8;
      drop.x = -5 + Math.random() * 10;
      drop.z = 0.3 + Math.random() * 6.3;
    }
    writeRainDrop(world.rainPositions, i, drop);
  }
  world.rain.geometry.attributes.position.needsUpdate = true;

  if (state.mode !== "washing" && world.rain.material.opacity > 0) {
    world.rain.material.opacity = Math.max(0, world.rain.material.opacity - dt * 0.25);
    if (world.rain.material.opacity <= 0.02) world.rain.visible = false;
  }
}

function updateCelebration(nowMs, dt) {
  const reduceMotion = reducedMotionEnabled();

  if (world.sun) {
    const pulse = reduceMotion ? 1 : 1 + Math.sin(nowMs * 0.0025) * 0.035;
    world.sun.scale.setScalar((state.mode === "celebrating" ? 1.2 : 0.95) * pulse);
    if (!reduceMotion) world.sun.rotation.z += dt * 0.35;
  }

  if (world.friends && world.friends.visible && !reduceMotion) {
    world.friends.children.forEach((friend, index) => {
      friend.position.y += Math.sin(nowMs * 0.006 + index * 1.7) * 0.0009;
      friend.rotation.z += Math.sin(nowMs * 0.004 + index) * 0.0009;
    });
  }

  if (state.mode === "celebrating" && !reducedMotionEnabled()) {
    if (nowMs - state.lastFireworkAt > CELEBRATION_FIREWORK_INTERVAL_MS) {
      for (let i = 0; i < CELEBRATION_FIREWORK_BURSTS; i += 1) {
        spawnFirework();
      }
      state.lastFireworkAt = nowMs;
    }
  }

  updateFireworks(dt);
}

function spawnFirework() {
  const colors = [0xffd36a, 0x73e0ff, 0xff7f86, 0xb5ff8a, 0xd7a4ff];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const type = FIREWORK_TYPES[Math.floor(Math.random() * FIREWORK_TYPES.length)];
  const petalCount = 5 + Math.floor(Math.random() * 3);
  const rotation = Math.random() * Math.PI * 2;
  const origin = new THREE.Vector3(-3.6 + Math.random() * 7.2, 5.2 + Math.random() * 1.8, 0.4 + Math.random() * 2.2);
  const count = fireworkParticleCount(type);
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i += 1) {
    positions[i * 3 + 0] = origin.x;
    positions[i * 3 + 1] = origin.y;
    positions[i * 3 + 2] = origin.z;
    velocities.push(fireworkVelocity(type, i, count, petalCount, rotation));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: type === "flower" ? 0.082 : 0.075,
    transparent: true,
    opacity: 1,
    depthWrite: false
  });
  const points = new THREE.Points(geometry, material);
  world.scene.add(points);
  world.fireworks.push({
    points,
    positions,
    velocities,
    age: 0,
    life: (1.35 + Math.random() * 0.45) * FIREWORK_LIFE_MULTIPLIER,
    gravity: type === "willow" ? FIREWORK_GRAVITY * 0.72 : FIREWORK_GRAVITY
  });
}

function fireworkParticleCount(type) {
  if (type === "flower") return 104;
  if (type === "ring") return 78;
  if (type === "willow") return 64;
  return 54;
}

function fireworkVelocity(type, index, count, petalCount, rotation) {
  if (type === "ring") {
    const theta = (index / count) * Math.PI * 2 + rotation + (Math.random() - 0.5) * 0.08;
    const speed = 1.35 + Math.random() * 0.38;
    return new THREE.Vector3(Math.cos(theta) * speed, Math.sin(theta) * speed * 0.84, (Math.random() - 0.5) * 0.42);
  }

  if (type === "flower") {
    const centerCount = 14;
    if (index < centerCount) {
      const theta = (index / centerCount) * Math.PI * 2 + rotation;
      const speed = 0.2 + Math.random() * 0.2;
      return new THREE.Vector3(Math.cos(theta) * speed, Math.sin(theta) * speed, (Math.random() - 0.5) * 0.18);
    }

    const petalIndex = (index - centerCount) % petalCount;
    const samplesPerPetal = Math.max(1, Math.floor((count - centerCount) / petalCount));
    const sampleIndex = Math.floor((index - centerCount) / petalCount);
    const petalTheta = rotation + (petalIndex / petalCount) * Math.PI * 2;
    const localTheta = (sampleIndex / samplesPerPetal) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const petalX = Math.cos(petalTheta) * 0.98 + Math.cos(localTheta) * 0.34;
    const petalY = Math.sin(petalTheta) * 0.88 + Math.sin(localTheta) * 0.29;
    const speed = 1.25 + Math.random() * 0.12;
    return new THREE.Vector3(petalX * speed, petalY * speed, (Math.random() - 0.5) * 0.28);
  }

  if (type === "willow") {
    const theta = (index / count) * Math.PI * 2 + rotation + (Math.random() - 0.5) * 0.35;
    const speed = 0.72 + Math.random() * 1.12;
    return new THREE.Vector3(Math.cos(theta) * speed * 0.9, 0.8 + Math.random() * 0.75, Math.sin(theta) * speed * 0.56);
  }

  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const speed = 0.8 + Math.random() * 2.15;
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta) * speed,
    Math.cos(phi) * speed * 0.85,
    Math.sin(phi) * Math.sin(theta) * speed * 0.75
  );
}

function updateFireworks(dt) {
  for (let i = world.fireworks.length - 1; i >= 0; i -= 1) {
    const firework = world.fireworks[i];
    firework.age += dt;
    for (let j = 0; j < firework.velocities.length; j += 1) {
      const v = firework.velocities[j];
      v.y -= dt * firework.gravity;
      firework.positions[j * 3 + 0] += v.x * dt;
      firework.positions[j * 3 + 1] += v.y * dt;
      firework.positions[j * 3 + 2] += v.z * dt;
    }
    firework.points.geometry.attributes.position.needsUpdate = true;
    firework.points.material.opacity = clamp(1 - firework.age / firework.life, 0, 1);
    if (firework.age >= firework.life) {
      world.scene.remove(firework.points);
      firework.points.geometry.dispose();
      firework.points.material.dispose();
      world.fireworks.splice(i, 1);
    }
  }
}

function clearFireworks() {
  if (!world.scene) return;
  world.fireworks.forEach((firework) => {
    world.scene.remove(firework.points);
    firework.points.geometry.dispose();
    firework.points.material.dispose();
  });
  world.fireworks = [];
}

bootstrap();
