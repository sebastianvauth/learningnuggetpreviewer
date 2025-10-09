Title: Emoji mojibake in lessons (ðŸ… → 🤯) after encoding mix-up

Problem
- Emoji characters in lesson HTML rendered as mojibake (e.g., `ðŸ¤¯`, `Ã°Å¸...`) instead of proper emojis in the browser.
- Root cause: files were saved/handled with Windows-1252 (CP1252) interpretation of UTF-8 bytes, then saved again, producing double-decoded sequences.

Fix Implemented
- Re-encoded all lesson `.html` files to UTF-8 with BOM and repaired mojibake by iteratively reinterpreting CP1252 bytes as UTF-8 text.
- Scripts used (temporary):
  - `tmp_fix_encoding.ps1` (initial pass)
  - `tmp_repair_mojibake.ps1` (iterative repair for stubborn cases)
- Both scripts were run from the repo root and then deleted to keep the codebase clean.

Verification
- Spot-checked multiple lessons in a browser; emojis render correctly (e.g., 🤯, 📻, 🍲, 🔥, 👁, ☀️, 🏥, ⚡, 🎉).
- Meta tag `<meta charset="UTF-8">` is present across lessons.

Prevention
- Keep lesson files saved as UTF-8 (with BOM is okay for Windows tooling).
- Avoid opening/saving lessons in editors configured to ANSI/CP1252.
- If mojibake appears again, repeat the iterative CP1252→UTF8 reinterpret and resave as UTF-8.

