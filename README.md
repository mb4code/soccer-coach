# U13 Soccer Team Dynamics Lesson Studio

## Project Overview

This project is now a **local authoring and playback studio** for teaching U13 recreational soccer players the fundamentals of team movement and spatial awareness in 11v11 play.

Instead of quiz-style interactions, the app focuses on:

- Animated lesson demos
- Multi-frame scenario playback
- Clear teaching bullet points
- A local authoring workflow for building and editing scenarios

The app teaches the six core concepts through reusable scene data that you can keep expanding over time.

## What The App Does

The studio includes:

- A seeded framework for all 6 lesson concepts
- A separate lesson viewing page and authoring page
- Scenario playback for each concept
- Frame-by-frame editing
- Control of your team players, the opposing team, the ball, and arrows
- Local persistence in browser storage
- JSON export/import for the full lesson library

This means you can build scenarios locally, refine them, export the finalized library JSON, and later publish the finished output to the web without shipping cloud-based authoring.

## The 6 Seeded Concepts

### Creating Space

1. Make the field big
2. Support angles around the ball
3. Team shape moves with the ball

4. Back line steps up when attacking
5. Through balls and timed runs
6. Crosses with organized box runs

Each concept starts with default summary bullets and at least one scenario, and the studio is designed so you can add more scenarios, more frames, and entirely new concepts later.

## Current Authoring Features

- Edit lesson title, section, key phrase, and summary bullets
- Add future concepts beyond the original six
- Add scenarios within any concept
- Add and remove frames within any scenario
- Edit scenario description and scenario summary bullets
- Drag players and the ball directly on the pitch in author mode
- Add arrows and edit arrow endpoints
- Edit object positions numerically in the side panel
- Preview the scenario as an animated frame sequence

## Local Save Model

The lesson library is saved locally in your browser using `localStorage`.

The app also exposes the full library JSON in the side panel so you can:

- Copy the whole library JSON
- Paste/import a saved library JSON
- Reset back to the default seeded concepts

This is intentionally local-only authoring.

## Publishing Model

The authoring studio is for local development only.

The intended workflow is:

- Build and refine lessons locally
- Export the finalized lesson library as JSON
- Publish a hosted version that uses the lesson data for playback only

To disable authoring in the hosted build, set:

```bash
VITE_ENABLE_AUTHORING=false
```

With that flag, the app stays in viewer mode and does not expose the Author tab or editing controls.

## Running Locally

From `c:\Users\mikes\vscode\Soccer_demo`, run:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

If your terminal already has Node on `PATH`, the shorter commands also work:

```bash
npm install
npm run dev
```

Then open the local URL Vite prints in the terminal, usually:

```text
http://localhost:5173
```

## Production Build Check

To verify the app compiles:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

## Main Files

- `src/App.jsx`
  Main lesson studio shell and authoring workflow
- `src/data/defaultLessons.js`
  Seeded lesson/scenario/frame library for all 6 concepts
- `src/components/Pitch.jsx`
  Taller soccer pitch renderer with players, ball, arrows, and drag editing
- `src/utils/lessonStudio.js`
  Local library helpers for save/load/reset and scenario/frame creation

## Next Recommended Enhancements

- Better arrow styling options and labels
- Scenario thumbnails
- A more formal export format for publishing lesson packs

## License

To be determined. MIT would be a sensible default for an open-source teaching tool.
