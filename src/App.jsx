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

function TitleBar({ page, onNavigate, authoringEnabled }) {
  return (
    <header className="title-bar">
      <div>
        <p className="eyebrow">U13 Soccer Team Dynamics</p>
        <h1>Lesson Studio</h1>
      </div>
      <div className="tab-strip">
        <button
          type="button"
          className={page === "view" ? "tab active" : "tab"}
          onClick={() => onNavigate("view")}
        >
          View Lessons
        </button>
        {authoringEnabled ? (
          <button
            type="button"
            className={page === "author" ? "tab active" : "tab"}
            onClick={() => onNavigate("author")}
          >
            Author
          </button>
        ) : null}
      </div>
    </header>
  );
}

export default function App() {
  const authoringEnabled = import.meta.env.VITE_ENABLE_AUTHORING !== "false";
  const [library, setLibrary] = useState(() => loadLibrary());
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

  const lesson = library[lessonIndex];
  const scenario = lesson.scenarios[scenarioIndex];
  const frame = scenario.frames[frameIndex];
  const selectedEntity = useMemo(() => getSelectedEntity(frame, selected), [frame, selected]);

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

      return currentFrame;
    });
  }

  function handleEntityInput(axis, value) {
    if (!selected) {
      return;
    }

    const bounded = clampCoordinate(value, axis === "x" ? 100 : 140);
    moveEntity(selected.kind === "arrow" ? { kind: "arrowEnd", id: selected.id } : selected, {
      ...(selectedEntity ?? {}),
      [axis]: bounded,
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
          <button
            key={item.id}
            type="button"
            className={lessonIndex === index ? "concept-button active" : "concept-button"}
            onClick={() => setLessonIndex(index)}
          >
            <span>{item.section}</span>
            <strong>{item.title}</strong>
            <em>{item.keyPhrase}</em>
          </button>
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
          <button type="button" className="primary-button" onClick={() => setIsPlaying(true)}>
            Play
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setFrameIndex((current) => Math.max(current - 1, 0))}
          >
            Previous
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() =>
              setFrameIndex((current) => Math.min(current + 1, scenario.frames.length - 1))
            }
          >
            Next
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
          <span className="frame-status">
            Frame {frameIndex + 1} of {scenario.frames.length}
          </span>
        </div>

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
              <p className="eyebrow">Scenario Notes</p>
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
                <div className="frame-notes-panel">
                  <p className="eyebrow">Current Frame Notes</p>
                  <h3 className="frame-note-title">{frame.label}</h3>
                  <ul className="notice-list">
                    {frame.notes?.map((note, index) => (
                      <li key={`${frame.id}-view-note-${index}`}>{note}</li>
                    ))}
                  </ul>
                </div>
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
          <div className="lesson-header">
            <div>
              <p className="eyebrow">Concept Library</p>
              <h2>{lesson.title}</h2>
            </div>
            {authoringEnabled && page === "author" ? (
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
            ) : null}
          </div>

          {renderConceptLibrary()}
          {renderScenarioPlayer()}
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
              {(frame.notes ?? []).map((note, index) => (
                <label key={`${frame.id}-note-${index}`}>
                  Frame Note {index + 1}
                  <input
                    value={note}
                    onChange={(event) =>
                      updateCurrentFrame((currentFrame) => ({
                        ...currentFrame,
                        notes: (currentFrame.notes ?? []).map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item,
                        ),
                      }))
                    }
                  />
                </label>
              ))}
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  updateCurrentFrame((currentFrame) => ({
                    ...currentFrame,
                    notes: [...(currentFrame.notes ?? []), "Add another frame teaching note."],
                  }))
                }
              >
                Add Frame Note
              </button>
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
                      className={
                        selected?.kind === "homePlayer" && selected.id === player.id
                          ? "entity-button active"
                          : "entity-button"
                      }
                      onClick={() => setSelected({ kind: "homePlayer", id: player.id })}
                    >
                      {player.label}
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
                      className={
                        selected?.kind === "awayPlayer" && selected.id === player.id
                          ? "entity-button active"
                          : "entity-button"
                      }
                      onClick={() => setSelected({ kind: "awayPlayer", id: player.id })}
                    >
                      {player.label}
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
                    <input value={selectedEntity.y} onChange={(event) => handleEntityInput("y", event.target.value)} />
                  </label>
                </div>
              )
            ) : (
              <p className="small-note">Select a player, the ball, or an arrow to edit its position.</p>
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
