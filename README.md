Machine Learning 2 - Frontend Style Baseline

- Styles for lesson HTML under `course_content` now share a consistent inline CSS baseline derived from `cv-ch02-m1-the-nature-of-light/l1.1-lesson-1-the-secret-ingredien.html`.
- This variant includes:
  - Gradients for headings, buttons, and content boxes
  - Animated progress bar and entrance animations
  - Accessibility enhancements (focus outlines, screen-reader regions)
  - Consistent boxes for `vocab-section`, `why-it-matters`, `test-your-knowledge`, `faq-section`, `stop-and-think`, `check-your-knowledge`
  - Interactive-ready styles retained (e.g., spectrum explorer classes)

Notes
- Lessons keep CSS inline in the first `<style>` block. For new lessons, copy that block from the reference lesson.
- Global app styles for dashboards and shells live in `style.css`.
- Keep files under 300 lines when feasible; refactor large pages into smaller sections if needed.
- Interactive canvases listen for section visibility via `MutationObserver`, or run a local `syncCanvasSize()` guard inside their draw loop, so layout/resize math reruns as soon as hidden sections become visible (prevents zero-width renders).

Testing
- Open `tests/test_runner.html` to run the parser tests.
- Spot-check any new lesson in a browser to verify:
  - Headline gradients render
  - Buttons animate on hover
  - Focus rings appear on interactive controls
  - Progress bar fills as sections advance

Contributing
- Prefer reusing existing styles/components from the reference lesson.
- Avoid duplicating functionality; consolidate common behavior.

