import { createBlankFrame, createEmptyLesson, createEmptyScenario, defaultLessons } from "../data/defaultLessons";

const STORAGE_KEY = "soccer-iq-studio-library";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizePoint(value, fallback) {
  if (!isRecord(value)) {
    return fallback;
  }

  const x = Number(value.x);
  const y = Number(value.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
}

function normalizeArrow(value, index) {
  if (!isRecord(value)) {
    return null;
  }

  const x1 = Number(value.x1);
  const y1 = Number(value.y1);
  const x2 = Number(value.x2);
  const y2 = Number(value.y2);

  if (![x1, y1, x2, y2].every(Number.isFinite)) {
    return null;
  }

  return {
    id: typeof value.id === "string" && value.id ? value.id : `arrow-${index + 1}`,
    x1,
    y1,
    x2,
    y2,
    color: typeof value.color === "string" && value.color ? value.color : "#f8fafc",
  };
}

function normalizePlayers(players, fallbackPlayers) {
  if (!Array.isArray(players)) {
    return fallbackPlayers;
  }

  return fallbackPlayers.map((fallbackPlayer, index) => {
    const candidate = players[index];
    if (!isRecord(candidate)) {
      return fallbackPlayer;
    }

    return {
      ...fallbackPlayer,
      id: typeof candidate.id === "string" && candidate.id ? candidate.id : fallbackPlayer.id,
      label:
        typeof candidate.label === "string" && candidate.label ? candidate.label : fallbackPlayer.label,
      name: typeof candidate.name === "string" && candidate.name ? candidate.name : fallbackPlayer.name,
      ...normalizePoint(candidate, fallbackPlayer),
    };
  });
}

function normalizeFrame(frame, index) {
  const fallbackFrame = createBlankFrame(`Frame ${index + 1}`);
  if (!isRecord(frame)) {
    return fallbackFrame;
  }

  return {
    ...fallbackFrame,
    id: typeof frame.id === "string" && frame.id ? frame.id : fallbackFrame.id,
    label: typeof frame.label === "string" && frame.label ? frame.label : fallbackFrame.label,
    ball: normalizePoint(frame.ball, fallbackFrame.ball),
    homePlayers: normalizePlayers(frame.homePlayers, fallbackFrame.homePlayers),
    awayPlayers: normalizePlayers(frame.awayPlayers, fallbackFrame.awayPlayers),
    arrows: Array.isArray(frame.arrows)
      ? frame.arrows.map(normalizeArrow).filter(Boolean)
      : fallbackFrame.arrows,
    notes: Array.isArray(frame.notes)
      ? frame.notes.filter((note) => typeof note === "string")
      : fallbackFrame.notes,
  };
}

function normalizeScenario(scenario, index) {
  const fallbackScenario = createEmptyScenario(`Scenario ${index + 1}`);
  if (!isRecord(scenario)) {
    return fallbackScenario;
  }

  const frames = Array.isArray(scenario.frames) ? scenario.frames.map(normalizeFrame) : [];

  return {
    ...fallbackScenario,
    id: typeof scenario.id === "string" && scenario.id ? scenario.id : fallbackScenario.id,
    title: typeof scenario.title === "string" && scenario.title ? scenario.title : fallbackScenario.title,
    description:
      typeof scenario.description === "string" ? scenario.description : fallbackScenario.description,
    summary: Array.isArray(scenario.summary)
      ? scenario.summary.filter((item) => typeof item === "string")
      : fallbackScenario.summary,
    frames: frames.length > 0 ? frames : fallbackScenario.frames,
  };
}

function normalizeLesson(lesson, index) {
  const fallbackLesson = createEmptyLesson(`Concept ${index + 1}`);
  if (!isRecord(lesson)) {
    return fallbackLesson;
  }

  const scenarios = Array.isArray(lesson.scenarios) ? lesson.scenarios.map(normalizeScenario) : [];

  return {
    ...fallbackLesson,
    id: typeof lesson.id === "string" && lesson.id ? lesson.id : fallbackLesson.id,
    section: typeof lesson.section === "string" && lesson.section ? lesson.section : fallbackLesson.section,
    title: typeof lesson.title === "string" && lesson.title ? lesson.title : fallbackLesson.title,
    keyPhrase:
      typeof lesson.keyPhrase === "string" ? lesson.keyPhrase : fallbackLesson.keyPhrase,
    summaryBullets: Array.isArray(lesson.summaryBullets)
      ? lesson.summaryBullets.filter((item) => typeof item === "string")
      : fallbackLesson.summaryBullets,
    scenarios: scenarios.length > 0 ? scenarios : fallbackLesson.scenarios,
  };
}

export function normalizeLibrary(library) {
  if (!Array.isArray(library) || library.length === 0) {
    return cloneLibrary(defaultLessons);
  }

  return library.map(normalizeLesson);
}

export function cloneLibrary(library) {
  if (typeof structuredClone === "function") {
    return structuredClone(library);
  }

  return JSON.parse(JSON.stringify(library));
}

export function loadLibrary() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return cloneLibrary(defaultLessons);
  }

  try {
    return normalizeLibrary(JSON.parse(saved));
  } catch {
    return cloneLibrary(defaultLessons);
  }
}

export function saveLibrary(library) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function resetLibrary() {
  return cloneLibrary(defaultLessons);
}

export function addLesson(library) {
  const next = cloneLibrary(library);
  next.push(createEmptyLesson(`Concept ${next.length + 1}`));
  return next;
}

export function addScenario(lesson) {
  return {
    ...lesson,
    scenarios: [...lesson.scenarios, createEmptyScenario(`Scenario ${lesson.scenarios.length + 1}`)],
  };
}

export function duplicateScenario(lesson, scenarioIndex) {
  const source = lesson.scenarios[scenarioIndex];
  if (!source) {
    return lesson;
  }

  const copy = {
    ...cloneLibrary(source),
    id: crypto.randomUUID(),
    title: `${source.title} Copy`,
    frames: source.frames.map((frame) => ({
      ...cloneLibrary(frame),
      id: crypto.randomUUID(),
      arrows: frame.arrows.map((arrow) => ({
        ...arrow,
        id: crypto.randomUUID(),
      })),
    })),
  };

  return {
    ...lesson,
    scenarios: [
      ...lesson.scenarios.slice(0, scenarioIndex + 1),
      copy,
      ...lesson.scenarios.slice(scenarioIndex + 1),
    ],
  };
}

export function addFrame(scenario, index) {
  const nextFrames = [...scenario.frames];
  nextFrames.splice(index + 1, 0, createBlankFrame(`Frame ${scenario.frames.length + 1}`));
  return { ...scenario, frames: nextFrames };
}

export function duplicateFrame(scenario, frameIndex) {
  const source = scenario.frames[frameIndex];
  if (!source) {
    return scenario;
  }

  const copy = {
    ...cloneLibrary(source),
    id: crypto.randomUUID(),
    label: `${source.label} Copy`,
    arrows: source.arrows.map((arrow) => ({
      ...arrow,
      id: crypto.randomUUID(),
    })),
  };

  return {
    ...scenario,
    frames: [
      ...scenario.frames.slice(0, frameIndex + 1),
      copy,
      ...scenario.frames.slice(frameIndex + 1),
    ],
  };
}

export function removeFrame(scenario, frameIndex) {
  if (scenario.frames.length <= 1) {
    return scenario;
  }

  return {
    ...scenario,
    frames: scenario.frames.filter((_, index) => index !== frameIndex),
  };
}

export function addArrow(frame) {
  return {
    ...frame,
    arrows: [
      ...frame.arrows,
      {
        id: crypto.randomUUID(),
        x1: 36,
        y1: 60,
        x2: 54,
        y2: 40,
        color: "#f8fafc",
      },
    ],
  };
}

export function removeArrow(frame, arrowId) {
  return {
    ...frame,
    arrows: frame.arrows.filter((arrow) => arrow.id !== arrowId),
  };
}
