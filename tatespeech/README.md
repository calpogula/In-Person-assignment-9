# TateSpeech

Desktop-first speech drills. The app uses your camera and microphone in the browser and scores only the signals it actually gets. Nothing is uploaded to a TateSpeech server.

## Run

```bash
cd tatespeech
npm install
npm run dev
```

Open the URL Vite prints (http://127.0.0.1:5173). Allow the camera and microphone when a drill starts.

`npm test` checks the scoring rules. `npm run build` typechecks and builds.

The portfolio assignment in the repository root is separate. This app does not replace it.

## What is measured

- Fillers, from the browser speech recognizer when it exists. Otherwise a manual tally you tap yourself, which is not treated as a clean take.
- Pace, pauses, projection, and phrase-ending pitch, from the microphone.
- Eye contact, from MediaPipe Face Landmarker (iris and head pose) when the model loads.
- Delivery match, an average of the command-speaking traits that had a real signal.

Missing signals stay blank. The app does not invent a transcript and does not copy a voice.
