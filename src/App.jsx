import { useEffect, useMemo, useState } from "react";
import Pitch from "./components/Pitch";
import {
  addArrow,
  addFrame,
  addLesson,
  addScenario,
  cloneLibrary,
  duplicateFrame,
  duplicateScenario,
  loadLibrary,
  normalizeLibrary,
  removeArrow,
  removeFrame,
  resetLibrary,
  saveLibrary,
} from "./utils/lessonStudio";

function updateAt(list, index, nextItem) {
  return list.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function clampCoordinate(value, max) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(max, numeric));
}

function isPlayerKind(kind) {
  return kind === "homePlayer" || kind === "awayPlayer";
}

function isPlayerHidden(player) {
  return player.x < 0 || player.x > 100 || player.y < 0 || player.y > 140;
}

function getSelectedEntity(frame, selected) {
  if (!selected) {
    return null;
  }

  if (selected.kind === "ball") {
    return frame.ball;
  }

  if (selected.kind === "homePlayer") {
    return frame.homePlayers.find((player) => player.id === selected.id) ?? null;
  }

  if (selected.kind === "awayPlayer") {
    return frame.awayPlayers.find((player) => player.id === selected.id) ?? null;
  }

  if (selected.kind === "arrow" || selected.kind === "arrowStart" || selected.kind === "arrowEnd") {
    return frame.arrows.find((arrow) => arrow.id === selected.id) ?? null;
  }

  if (selected.kind === "overlay") {
    return frame.overlay ?? null;
  }

  return null;
}

function exportLibraryText(library) {
  return JSON.stringify(library, null, 2);
}

function clampIndex(index, length) {
  if (length <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(index, length - 1));
}

function getPlaybackProgress(frameIndex, frameCount) {
  if (frameCount <= 1) {
    return 100;
  }

  return (frameIndex / (frameCount - 1)) * 100;
}

function clampRange(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, numeric));
}

function clampOverlayValue(field, value, fallback) {
  if (field === "text") {
    return value;
  }

  const limits = {
    x: [0, 100],
    y: [0, 140],
    width: [18, 86],
    fontSize: [1.5, 3],
    padding: [1, 4],
  };
  const [min, max] = limits[field] ?? [0, 140];
  return clampRange(value, min, max, fallback ?? min);
}

function ViewerHeaderButton({ onClick, children, kind = "ghost", className = "" }) {
  return (
    <button
      type="button"
      className={[
        kind === "primary"
          ? "primary-button viewer-action-button viewer-action-button-primary"
          : "ghost-button viewer-action-button",
        className,
      ].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TitleBar({ page, onNavigate, authoringEnabled }) {
  return (
    <header className="title-bar">
      <div>
        <p className="eyebrow">U13 Soccer Team Dynamics</p>
        <h1>Lesson Studio</h1>
      </div>
      {authoringEnabled ? (
        <div className="tab-strip">
          <button
            type="button"
            className={page === "view" ? "tab active" : "tab"}
            onClick={() => onNavigate("view")}
          >
            View Lessons
          </button>
          <button
            type="button"
            className={page === "author" ? "tab active" : "tab"}
            onClick={() => onNavigate("author")}
          >
            Author
          </button>
        </div>
      ) : null}
    </header>
  );
}

export default function App() {
  const authoringEnabled = import.meta.env.VITE_ENABLE_AUTHORING !== "false";
  const [library, setLibrary] = useState(() => loadLibrary(authoringEnabled));
  const [page, setPage] = useState(() =>
    authoringEnabled && window.location.hash === "#/author" ? "author" : "view",
  );
  const [lessonIndex, setLessonIndex] = useState(0);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [authorMode, setAuthorMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [jsonBuffer, setJsonBuffer] = useState("");
  const [statusMessage, setStatusMessage] = useState("Autosaving locally.");
  const [filePickerKey, setFilePickerKey] = useState(0);
  const [viewerStep, setViewerStep] = useState("library");

  const lesson = library[lessonIndex];
  const scenario = lesson.scenarios[scenarioIndex];
  const frame = scenario.frames[frameIndex];
  const viewerLessons = useMemo(
    () =>
      library
        .map((item, index) => ({ ...item, libraryIndex: index }))
        .filter((item) => item.active !== false),
    [library],
  );
  const selectedEntity = useMemo(() => getSelectedEntity(frame, selected), [frame, selected]);
  const playbackProgress = getPlaybackProgress(frameIndex, scenario.frames.length);

  function resetEditorState({ nextScenarioIndex = 0, nextFrameIndex = 0 } = {}) {
    setScenarioIndex(nextScenarioIndex);
    setFrameIndex(nextFrameIndex);
    setSelected(null);
    setIsPlaying(false);
  }

  function applyLoadedLibrary(nextLibrary, message) {
    setLibrary(normalizeLibrary(nextLibrary));
    resetEditorState();
    setLessonIndex(0);
    setStatusMessage(message);
  }

  useEffect(() => {
    saveLibrary(library);
    setJsonBuffer(exportLibraryText(library));
  }, [library]);

  useEffect(() => {
    const safePage = authoringEnabled ? page : "view";
    if (page !== safePage) {
      setPage(safePage);
      return;
    }

    window.location.hash = safePage === "author" ? "/author" : "/view";
  }, [authoringEnabled, page]);

  useEffect(() => {
    function syncPageFromHash() {
      if (!authoringEnabled) {
        setPage("view");
        return;
      }

      setPage(window.location.hash === "#/author" ? "author" : "view");
    }

    window.addEventListener("hashchange", syncPageFromHash);
    return () => window.removeEventListener("hashchange", syncPageFromHash);
  }, [authoringEnabled]);

  useEffect(() => {
    resetEditorState();
  }, [lessonIndex]);

  useEffect(() => {
    setLessonIndex((current) => clampIndex(current, library.length));
  }, [library.length]);

  useEffect(() => {
    if (page !== "view" || viewerStep === "library" || lesson.active !== false) {
      return;
    }

    const nextLesson = viewerLessons[0];
    if (nextLesson) {
      handleSelectLesson(nextLesson.libraryIndex);
      return;
    }

    setViewerStep("library");
  }, [lesson.active, page, viewerLessons, viewerStep]);

  useEffect(() => {
    resetEditorState({ nextScenarioIndex: scenarioIndex, nextFrameIndex: 0 });
  }, [scenarioIndex]);

  useEffect(() => {
    setSelected(null);
  }, [frameIndex]);

  useEffect(() => {
    setScenarioIndex((current) => clampIndex(current, lesson.scenarios.length));
  }, [lesson.scenarios.length]);

  useEffect(() => {
    setFrameIndex((current) => clampIndex(current, scenario.frames.length));
  }, [scenario.frames.length]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    if (frameIndex >= scenario.frames.length - 1) {
      setIsPlaying(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFrameIndex((current) => current + 1);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [frameIndex, isPlaying, scenario.frames.length]);

  function updateLibrary(mutator) {
    setLibrary((current) => mutator(cloneLibrary(current)));
  }

  function updateCurrentLesson(mutator) {
    updateLibrary((current) => {
      current[lessonIndex] = mutator(current[lessonIndex]);
      return current;
    });
  }

  function updateCurrentScenario(mutator) {
    updateCurrentLesson((currentLesson) => ({
      ...currentLesson,
      scenarios: updateAt(
        currentLesson.scenarios,
        scenarioIndex,
        mutator(currentLesson.scenarios[scenarioIndex]),
      ),
    }));
  }

  function updateCurrentFrame(mutator) {
    updateCurrentScenario((currentScenario) => ({
      ...currentScenario,
      frames: updateAt(
        currentScenario.frames,
        frameIndex,
        mutator(currentScenario.frames[frameIndex]),
      ),
    }));
  }

  function moveEntity(target, point) {
    updateCurrentFrame((currentFrame) => {
      if (target.kind === "ball") {
        return { ...currentFrame, ball: point };
      }

      if (target.kind === "homePlayer") {
        return {
          ...currentFrame,
          homePlayers: currentFrame.homePlayers.map((player) =>
            player.id === target.id ? { ...player, ...point } : player,
          ),
        };
      }

      if (target.kind === "awayPlayer") {
        return {
          ...currentFrame,
          awayPlayers: currentFrame.awayPlayers.map((player) =>
            player.id === target.id ? { ...player, ...point } : player,
          ),
        };
      }

      if (target.kind === "arrowStart") {
        return {
          ...currentFrame,
          arrows: currentFrame.arrows.map((arrow) =>
            arrow.id === target.id ? { ...arrow, x1: point.x, y1: point.y } : arrow,
          ),
        };
      }

      if (target.kind === "arrowEnd") {
        return {
          ...currentFrame,
          arrows: currentFrame.arrows.map((arrow) =>
            arrow.id === target.id ? { ...arrow, x2: point.x, y2: point.y } : arrow,
          ),
        };
      }

      if (target.kind === "overlay") {
        return {
          ...currentFrame,
          overlay: {
            ...currentFrame.overlay,
            x: point.x,
            y: point.y,
          },
        };
      }

      return currentFrame;
    });
  }

  function handleEntityInput(axis, value) {
    if (!selected) {
      return;
    }

    const max = axis === "x" ? 100 : isPlayerKind(selected.kind) ? 160 : 140;
    const bounded = clampCoordinate(value, max);
    moveEntity(selected.kind === "arrow" ? { kind: "arrowEnd", id: selected.id } : selected, {
      ...(selectedEntity ?? {}),
      [axis]: bounded,
    });
  }

  function setSelectedPlayerHidden(hidden) {
    if (!selectedEntity || !isPlayerKind(selected?.kind)) {
      return;
    }

    moveEntity(selected, {
      x: hidden ? selectedEntity.x : clampRange(selectedEntity.x, 8, 92, 50),
      y: hidden ? 150 : 126,
    });
  }

  function handleArrowInput(axis, value) {
    if (!selectedEntity || !selected || !selected.id) {
      return;
    }

    const bounded = clampCoordinate(value, axis.includes("x") ? 100 : 140);
    updateCurrentFrame((currentFrame) => ({
      ...currentFrame,
      arrows: currentFrame.arrows.map((arrow) =>
        arrow.id === selected.id ? { ...arrow, [axis]: bounded } : arrow,
      ),
    }));
  }

  function handleFrameOverlayInput(field, value) {
    updateCurrentFrame((currentFrame) => ({
      ...currentFrame,
      overlay: {
        ...currentFrame.overlay,
        [field]: clampOverlayValue(field, value, currentFrame.overlay?.[field]),
      },
    }));
  }

  function handlePlay() {
    if (frameIndex >= scenario.frames.length - 1) {
      setFrameIndex(0);
    }
    setIsPlaying(true);
  }

  function jumpToFrame(index) {
    setIsPlaying(false);
    setFrameIndex(index);
  }

  function updateSummary(index, value) {
    updateCurrentLesson((currentLesson) => ({
      ...currentLesson,
      summaryBullets: currentLesson.summaryBullets.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));
  }

  function updateScenarioSummary(index, value) {
    updateCurrentScenario((currentScenario) => ({
      ...currentScenario,
      summary: currentScenario.summary.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));
  }

  function handleImportJson() {
    try {
      const parsed = JSON.parse(jsonBuffer);
      applyLoadedLibrary(parsed, "Imported scenario library from JSON.");
    } catch {
      setStatusMessage("That JSON could not be imported. Check the formatting and try again.");
    }
  }

  function handleResetLibrary() {
    applyLoadedLibrary(
      resetLibrary(),
      "Reset the local library back to the six default concepts.",
    );
  }

  function handleCopyJson() {
    navigator.clipboard.writeText(exportLibraryText(library));
    setStatusMessage("Copied the full lesson library JSON to the clipboard.");
  }

  function handleDownloadLibrary() {
    const blob = new Blob([exportLibraryText(library)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "soccer-iq-lesson-library.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage("Downloaded the lesson library as a JSON file.");
  }

  function deleteCurrentLesson() {
    if (library.length <= 1) {
      setStatusMessage("Keep at least one concept in the authoring library.");
      return;
    }

    const nextLessonIndex = Math.max(0, Math.min(lessonIndex, library.length - 2));
    updateLibrary((current) => current.filter((_, index) => index !== lessonIndex));
    resetEditorState({ nextFrameIndex: 0, nextScenarioIndex: 0 });
    setLessonIndex(nextLessonIndex);
    setViewerStep("library");
    setStatusMessage(`Deleted "${lesson.title}" from the local library.`);
  }

  function moveLesson(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= library.length) {
      return;
    }

    updateLibrary((current) => {
      const next = [...current];
      const [movedLesson] = next.splice(index, 1);
      next.splice(targetIndex, 0, movedLesson);
      return next;
    });
    setLessonIndex((current) => {
      if (current === index) {
        return targetIndex;
      }
      if (current === targetIndex) {
        return index;
      }
      return current;
    });
    setViewerStep("library");
    setStatusMessage(`Moved "${library[index].title}" ${direction < 0 ? "up" : "down"} in the concept library.`);
  }

  function handleUploadLibrary(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        applyLoadedLibrary(parsed, `Loaded lesson library from ${file.name}.`);
      } catch {
        setStatusMessage(`Could not read ${file.name}. Make sure it is valid JSON.`);
      } finally {
        setFilePickerKey((current) => current + 1);
      }
    };
    reader.readAsText(file);
  }

  function renderConceptLibrary() {
    return (
      <div className="concept-strip">
        {library.map((item, index) => (
          <div key={item.id} className="concept-card">
            <button
              type="button"
              className={[
                "concept-button",
                lessonIndex === index ? "active" : "",
                item.active === false ? "inactive" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => setLessonIndex(index)}
            >
              <span>{item.active === false ? "Inactive" : item.section}</span>
              <strong>{item.title}</strong>
              <em>{item.keyPhrase}</em>
            </button>
            <div className="concept-reorder-actions" aria-label={`Reorder ${item.title}`}>
              <button
                type="button"
                className="mini-button"
                disabled={index === 0}
                onClick={() => moveLesson(index, -1)}
              >
                Up
              </button>
              <button
                type="button"
                className="mini-button"
                disabled={index === library.length - 1}
                onClick={() => moveLesson(index, 1)}
              >
                Down
              </button>
            </div>
          </div>
        ))}
        {authoringEnabled && page === "author" ? (
          <button
            type="button"
            className="concept-button add"
            onClick={() => {
              updateLibrary((current) => addLesson(current));
              setLessonIndex(library.length);
            }}
          >
            <span>Future</span>
            <strong>Add Concept</strong>
          </button>
        ) : null}
      </div>
    );
  }

  function handleSelectLesson(index) {
    setLessonIndex(index);
    setScenarioIndex(0);
    setFrameIndex(0);
    setIsPlaying(false);
    setViewerStep("demo");
  }

  function renderPlaybackBar() {
    return (
      <div className="playback-card">
        <div className="playback-header">
          <span className="eyebrow">Playback Progress</span>
          <span className="frame-status">
            Frame {frameIndex + 1} of {scenario.frames.length}
          </span>
        </div>
        <div className="playback-track" aria-hidden="true">
          <div className="playback-track-fill" style={{ width: `${playbackProgress}%` }} />
        </div>
        <div className="playback-steps" role="tablist" aria-label="Demo frames">
          {scenario.frames.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={frameIndex === index ? "playback-step active" : "playback-step"}
              onClick={() => jumpToFrame(index)}
              aria-label={`Go to ${item.label}`}
            >
              <span className="playback-step-dot" />
              <span className="playback-step-label">{item.label}</span>
              {index < scenario.frames.length - 1 ? (
                <span className="playback-step-arrow" aria-hidden="true">
                  →
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderViewerLibrary() {
    return (
      <div className="viewer-stage">
        <div className="viewer-stage-header">
          <div>
            <p className="eyebrow">Concept Library</p>
            <h2>Pick a concept to explore</h2>
          </div>
          <p className="small-note">
            Move one concept at a time so the field demo stays clear and easy to use on a phone.
          </p>
        </div>

        <div className="concept-strip viewer-concept-strip">
          {viewerLessons.map((item) => (
            <button
              key={item.id}
              type="button"
              className={lessonIndex === item.libraryIndex ? "concept-button active" : "concept-button"}
              onClick={() => handleSelectLesson(item.libraryIndex)}
            >
              <span>{item.section}</span>
              <strong>{item.title}</strong>
              <em>{item.keyPhrase}</em>
            </button>
          ))}
          {viewerLessons.length === 0 ? (
            <p className="small-note">No active concepts are available in the viewer.</p>
          ) : null}
        </div>
      </div>
    );
  }

  function renderViewerDemo() {
    return (
      <div className="viewer-stage viewer-demo-stage">
        <div className="viewer-stage-header">
          <div className="viewer-stage-actions">
            <ViewerHeaderButton
              className="viewer-library-button"
              onClick={() => setViewerStep("library")}
            >
              Concept Library
            </ViewerHeaderButton>
          </div>
          <div>
            <p className="eyebrow">{lesson.title}</p>
            <h2>{scenario.title}</h2>
            <p className="small-note">{scenario.description}</p>
          </div>
        </div>

        <div className="scenario-strip viewer-scenario-strip">
          {lesson.scenarios.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={scenarioIndex === index ? "scenario-button active" : "scenario-button"}
              onClick={() => setScenarioIndex(index)}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="demo-toolbar viewer-demo-toolbar">
          <button
            type="button"
            className="primary-button viewer-action-button viewer-action-button-primary"
            onClick={handlePlay}
          >
            Play
          </button>
          <button
            type="button"
            className="ghost-button viewer-action-button"
            onClick={() => {
              setIsPlaying(false);
              setFrameIndex(0);
            }}
          >
            Reset
          </button>
          <span className="frame-status">Tap the playback bar to jump to any frame.</span>
        </div>

        {renderPlaybackBar()}

        <Pitch
          frame={frame}
          selected={selected}
          authorMode={false}
          onSelect={() => {}}
          onMove={moveEntity}
          frameLabel={frame.label}
        />
      </div>
    );
  }

  function renderViewerExperience() {
    if (viewerStep === "library") {
      return renderViewerLibrary();
    }

    return renderViewerDemo();
  }

  function renderScenarioPlayer() {
    return (
      <>
        <div className="summary-panel">
          <div>
            <p className="eyebrow">Concept Summary</p>
            <ul className="notice-list">
              {lesson.summaryBullets.map((bullet, index) => (
                <li key={`${lesson.id}-${index}`}>
                  {authoringEnabled && page === "author" ? (
                    <input
                      value={bullet}
                      onChange={(event) => updateSummary(index, event.target.value)}
                    />
                  ) : (
                    bullet
                  )}
                </li>
              ))}
            </ul>
          </div>
          {authoringEnabled && page === "author" ? (
            <div className="lesson-metadata">
              <label>
                Title
                <input
                  value={lesson.title}
                  onChange={(event) =>
                    updateCurrentLesson((currentLesson) => ({
                      ...currentLesson,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Section
                <input
                  value={lesson.section}
                  onChange={(event) =>
                    updateCurrentLesson((currentLesson) => ({
                      ...currentLesson,
                      section: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Key Phrase
                <input
                  value={lesson.keyPhrase}
                  onChange={(event) =>
                    updateCurrentLesson((currentLesson) => ({
                      ...currentLesson,
                      keyPhrase: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={lesson.active !== false}
                  onChange={(event) =>
                    updateCurrentLesson((currentLesson) => ({
                      ...currentLesson,
                      active: event.target.checked,
                    }))
                  }
                />
                Active in Viewer
              </label>
              <button
                type="button"
                className="ghost-button danger-button"
                disabled={library.length <= 1}
                onClick={deleteCurrentLesson}
              >
                Delete Concept
              </button>
            </div>
          ) : null}
        </div>

        <div className="scenario-strip">
          {lesson.scenarios.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={scenarioIndex === index ? "scenario-button active" : "scenario-button"}
              onClick={() => setScenarioIndex(index)}
            >
              {item.title}
            </button>
          ))}
          {authoringEnabled && page === "author" ? (
            <button
              type="button"
              className="scenario-button add"
              onClick={() =>
                updateCurrentLesson((currentLesson) => addScenario(currentLesson))
              }
            >
              + Add Scenario
            </button>
          ) : null}
        </div>

        <div className="demo-toolbar">
          <button type="button" className="primary-button" onClick={handlePlay}>
            Play
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setIsPlaying(false);
              setFrameIndex(0);
            }}
          >
            Reset
          </button>
          <span className="frame-status">Tap the playback bar to jump between frames.</span>
        </div>

        {renderPlaybackBar()}

        <Pitch
          frame={frame}
          selected={selected}
          authorMode={authoringEnabled && page === "author" && authorMode}
          onSelect={authoringEnabled && page === "author" ? setSelected : () => {}}
          onMove={moveEntity}
          frameLabel={frame.label}
        />

          <div className="coach-board single-column">
            <div className="coach-board-copy">
              <p className="eyebrow">Scenario Setup</p>
            {authoringEnabled && page === "author" ? (
              <>
                <label>
                  Scenario Title
                  <input
                    value={scenario.title}
                    onChange={(event) =>
                      updateCurrentScenario((currentScenario) => ({
                        ...currentScenario,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={3}
                    value={scenario.description}
                    onChange={(event) =>
                      updateCurrentScenario((currentScenario) => ({
                        ...currentScenario,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="editable-list">
                  {scenario.summary.map((bullet, index) => (
                    <label key={`${scenario.id}-summary-${index}`}>
                      Bullet {index + 1}
                      <input
                        value={bullet}
                        onChange={(event) => updateScenarioSummary(index, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="scenario-title">{scenario.title}</h2>
                <p className="small-note">{scenario.description}</p>
                <ul className="notice-list">
                  {scenario.summary.map((bullet, index) => (
                    <li key={`${scenario.id}-view-summary-${index}`}>{bullet}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="app-shell studio-app">
      <TitleBar page={page} onNavigate={setPage} authoringEnabled={authoringEnabled} />

      <main className={authoringEnabled && page === "author" ? "studio-grid" : "viewer-grid"}>
        <section className="lesson-panel workspace-panel">
          {authoringEnabled && page === "author" ? (
            <>
              <div className="lesson-header">
                <div>
                  <p className="eyebrow">Concept Library</p>
                  <h2>{lesson.title}</h2>
                </div>
                <div className="tab-strip">
                  <button
                    type="button"
                    className={authorMode ? "tab active" : "tab"}
                    onClick={() => setAuthorMode(true)}
                  >
                    Author
                  </button>
                  <button
                    type="button"
                    className={!authorMode ? "tab active" : "tab"}
                    onClick={() => setAuthorMode(false)}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {renderConceptLibrary()}
              {renderScenarioPlayer()}
            </>
          ) : (
            renderViewerExperience()
          )}
        </section>

        {authoringEnabled && page === "author" ? (
        <aside className="lesson-panel studio-panel">
          <div className="studio-block">
            <p className="eyebrow">Frame Builder</p>
            <div className="frame-list">
              {scenario.frames.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={frameIndex === index ? "frame-button active" : "frame-button"}
                  onClick={() => setFrameIndex(index)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="stack-buttons">
              <button
                type="button"
                className="ghost-button"
                onClick={() => updateCurrentScenario((currentScenario) => addFrame(currentScenario, frameIndex))}
              >
                Add Frame After
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  updateCurrentScenario((currentScenario) => duplicateFrame(currentScenario, frameIndex))
                }
              >
                Duplicate Frame
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  const nextFrameIndex = Math.max(0, Math.min(frameIndex, scenario.frames.length - 2));
                  setFrameIndex(nextFrameIndex);
                  updateCurrentScenario((currentScenario) => removeFrame(currentScenario, frameIndex));
                }}
              >
                Remove Current Frame
              </button>
            </div>
            <label>
              Frame Label
              <input
                value={frame.label}
                onChange={(event) =>
                  updateCurrentFrame((currentFrame) => ({
                    ...currentFrame,
                    label: event.target.value,
                  }))
                }
              />
            </label>
            <div className="editable-list">
              <label>
                Overlay Text
                <textarea
                  rows={4}
                  value={frame.overlay?.text ?? ""}
                  onChange={(event) => handleFrameOverlayInput("text", event.target.value)}
                />
              </label>
              <div className="coordinate-grid">
                <label>
                  Box X
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={frame.overlay?.x ?? 8}
                    onChange={(event) => handleFrameOverlayInput("x", event.target.value)}
                  />
                </label>
                <label>
                  Box Y
                  <input
                    type="number"
                    min="0"
                    max="140"
                    value={frame.overlay?.y ?? 8}
                    onChange={(event) => handleFrameOverlayInput("y", event.target.value)}
                  />
                </label>
                <label>
                  Box Width
                  <input
                    type="number"
                    min="18"
                    max="86"
                    value={frame.overlay?.width ?? 34}
                    onChange={(event) => handleFrameOverlayInput("width", event.target.value)}
                  />
                </label>
                <label>
                  Text Size
                  <input
                    type="number"
                    min="1.5"
                    max="3"
                    step="0.1"
                    value={frame.overlay?.fontSize ?? 2.2}
                    onChange={(event) => handleFrameOverlayInput("fontSize", event.target.value)}
                  />
                </label>
                <label className="full-span">
                  Box Padding
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={frame.overlay?.padding ?? 2.2}
                    onChange={(event) => handleFrameOverlayInput("padding", event.target.value)}
                  />
                </label>
              </div>
              <p className="small-note">The overlay wraps to fit the box in both author and viewer mode.</p>
            </div>
          </div>

          <div className="studio-block">
            <p className="eyebrow">Entities</p>
            <div className="entity-columns">
              <div>
                <strong>Our Team</strong>
                <div className="entity-list">
                  {frame.homePlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className={[
                        "entity-button",
                        selected?.kind === "homePlayer" && selected.id === player.id ? "active" : "",
                        isPlayerHidden(player) ? "hidden-player" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setSelected({ kind: "homePlayer", id: player.id })}
                    >
                      {player.label}
                      {isPlayerHidden(player) ? " hidden" : ""}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <strong>Other Team</strong>
                <div className="entity-list">
                  {frame.awayPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className={[
                        "entity-button",
                        selected?.kind === "awayPlayer" && selected.id === player.id ? "active" : "",
                        isPlayerHidden(player) ? "hidden-player" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setSelected({ kind: "awayPlayer", id: player.id })}
                    >
                      {player.label}
                      {isPlayerHidden(player) ? " hidden" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="stack-buttons">
              <button type="button" className="ghost-button" onClick={() => setSelected({ kind: "ball" })}>
                Select Ball
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setSelected({ kind: "overlay" })}
              >
                Select Overlay
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  updateCurrentFrame((currentFrame) => addArrow(currentFrame))
                }
              >
                Add Arrow
              </button>
            </div>

            <div className="arrow-list">
              {frame.arrows.map((arrow) => (
                <div key={arrow.id} className="arrow-row">
                  <button
                    type="button"
                    className={
                      selected?.id === arrow.id &&
                      (selected.kind === "arrow" ||
                        selected.kind === "arrowStart" ||
                        selected.kind === "arrowEnd")
                        ? "entity-button active"
                        : "entity-button"
                    }
                    onClick={() => setSelected({ kind: "arrow", id: arrow.id })}
                  >
                    Arrow
                  </button>
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() =>
                      updateCurrentFrame((currentFrame) => removeArrow(currentFrame, arrow.id))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="studio-block">
            <p className="eyebrow">Selected Item</p>
            {selectedEntity ? (
              selected?.kind === "arrow" || selected?.kind === "arrowStart" || selected?.kind === "arrowEnd" ? (
                <div className="coordinate-grid">
                  <label>
                    Start X
                    <input value={selectedEntity.x1} onChange={(event) => handleArrowInput("x1", event.target.value)} />
                  </label>
                  <label>
                    Start Y
                    <input value={selectedEntity.y1} onChange={(event) => handleArrowInput("y1", event.target.value)} />
                  </label>
                  <label>
                    End X
                    <input value={selectedEntity.x2} onChange={(event) => handleArrowInput("x2", event.target.value)} />
                  </label>
                  <label>
                    End Y
                    <input value={selectedEntity.y2} onChange={(event) => handleArrowInput("y2", event.target.value)} />
                  </label>
                  <label className="full-span">
                    Color
                    <input
                      value={selectedEntity.color ?? "#f8fafc"}
                      onChange={(event) =>
                        updateCurrentFrame((currentFrame) => ({
                          ...currentFrame,
                          arrows: currentFrame.arrows.map((arrow) =>
                            arrow.id === selected.id ? { ...arrow, color: event.target.value } : arrow,
                          ),
                        }))
                      }
                    />
                  </label>
                </div>
              ) : selected?.kind === "ball" ? (
                <div className="coordinate-grid">
                  <label>
                    Ball X
                    <input value={selectedEntity.x} onChange={(event) => handleEntityInput("x", event.target.value)} />
                  </label>
                  <label>
                    Ball Y
                    <input value={selectedEntity.y} onChange={(event) => handleEntityInput("y", event.target.value)} />
                  </label>
                </div>
              ) : selected?.kind === "overlay" ? (
                <p className="small-note">Overlay text and box settings are in Frame Builder. Drag the selected overlay on the field to reposition it.</p>
              ) : (
                <div className="coordinate-grid">
                  <label className="full-span">
                    Label
                    <input
                      value={selectedEntity.label}
                      onChange={(event) =>
                        updateCurrentFrame((currentFrame) => ({
                          ...currentFrame,
                          [selected.kind === "homePlayer" ? "homePlayers" : "awayPlayers"]: currentFrame[
                            selected.kind === "homePlayer" ? "homePlayers" : "awayPlayers"
                          ].map((player) =>
                            player.id === selected.id ? { ...player, label: event.target.value } : player,
                          ),
                        }))
                      }
                    />
                  </label>
                  <label>
                    X
                    <input value={selectedEntity.x} onChange={(event) => handleEntityInput("x", event.target.value)} />
                  </label>
                  <label>
                    Y
                    <input
                      type="number"
                      max="160"
                      value={selectedEntity.y}
                      onChange={(event) => handleEntityInput("y", event.target.value)}
                    />
                  </label>
                  <div className="stack-buttons full-span">
                    {isPlayerHidden(selectedEntity) ? (
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setSelectedPlayerHidden(false)}
                      >
                        Show Player
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setSelectedPlayerHidden(true)}
                      >
                        Hide Player
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : (
              <p className="small-note">Select a player, the ball, the overlay, or an arrow to edit its position.</p>
            )}
          </div>

          <div className="studio-block">
            <p className="eyebrow">Local Save / Library JSON</p>
            <p className="small-note">{statusMessage}</p>
            <div className="stack-buttons">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  updateCurrentLesson((currentLesson) => duplicateScenario(currentLesson, scenarioIndex))
                }
              >
                Duplicate Scenario
              </button>
              <button type="button" className="ghost-button" onClick={handleDownloadLibrary}>
                Download JSON File
              </button>
              <label className="upload-button">
                Upload JSON File
                <input
                  key={filePickerKey}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleUploadLibrary}
                />
              </label>
              <button type="button" className="ghost-button" onClick={handleCopyJson}>
                Copy JSON
              </button>
              <button type="button" className="ghost-button" onClick={handleImportJson}>
                Import JSON
              </button>
              <button type="button" className="ghost-button" onClick={handleResetLibrary}>
                Reset Defaults
              </button>
            </div>
            <textarea
              rows={16}
              className="json-buffer"
              value={jsonBuffer}
              onChange={(event) => setJsonBuffer(event.target.value)}
            />
          </div>
        </aside>
        ) : null}
      </main>
    </div>
  );
}
