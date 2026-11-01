# THE MISSING CLUE — Audio Assets Directory

Drop your MP3 audio files directly into this `public/audio/` folder using these exact filenames:

- `main_theme.mp3` — Main Menu, Case Library, Settings, About, Profile & Daily Mystery theme (looped)
- `crime_scene.mp3` — Crime Scene & active investigation background music (looped)
- `object_found.mp3` — Sound effect played when discovering a concealed object in a crime scene
- `evidence_found.mp3` — Sound effect played when inspecting evidence, unlocking board deductions, or exposing contradictions
- `case_solved.mp3` — Fanfare / theme played when catching the culprit and solving a case

All files in `public/audio/` are automatically served at `/audio/<filename>` by Vite.
If any file is not yet present, `soundService` detects its absence gracefully without console or playback errors.
