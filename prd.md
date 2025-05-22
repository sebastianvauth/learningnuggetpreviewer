# Learning Nugget Previewer - Product Requirements Document (v4 - Oracle Infused)

## <context>

### Overview

This document outlines the requirements for the "Learning Nugget Previewer," a static web application designed to run on GitHub Pages. It solves the problem of efficiently testing and previewing HTML-based Moodle lessons locally before deployment. The target audience is Moodle course creators and instructional designers who develop lesson content as HTML files. The value lies in streamlining the development workflow, providing a modern, engaging, secure, performant, and accessible preview experience inspired by Brilliant.org, reducing friction in content creation, and allowing for quick iteration on lesson design and content.

### Core Features

1.  **Learning Path Discovery & Display:**
    *   **What it does:** Displays available "Learning Paths" (top-level course topics) as visually distinct, accessible (keyboard navigable, ARIA-described) cards on a home page. Each card includes a title, short description, and an optimized icon/graphic.
    *   **Why it's important:** Provides a clear, high-level, accessible overview of available content and an engaging entry point.
    *   **How it works:** Reads data from `content.json`, dynamically generates semantic HTML cards using efficient DOM manipulation, and styles them with accessibility considerations (e.g., color contrast).
    *   **User Stories:**
        *   As a course creator, I want to see all my main course topics (Learning Paths) clearly presented and be able to navigate them using a keyboard, so I can quickly get an overview and select a topic to review regardless of my input method.
        *   As a course creator, I want an engaging and accessible entry point to my lesson previewer that reflects a modern learning experience, so I feel confident in the tool.

2.  **Module Listing & Navigation:**
    *   **What it does:** Upon selecting a Learning Path, displays its constituent "Modules" (sub-topics or chapters), typically also as accessible cards or a structured list with optimized icons and titles.
    *   **Why it's important:** Allows users to drill down into specific sections of a Learning Path in an accessible manner.
    *   **How it works:** Filters data from `content.json` based on the selected Learning Path and dynamically renders the Module list using efficient, semantic HTML.
    *   **User Stories:**
        *   As a course creator, after selecting a Learning Path, I want to see its chapters (Modules) listed clearly and be able to navigate them via keyboard, so I can easily choose the specific section I want to review.
        *   As a course creator, I want each Module to be distinctly presented, possibly with its own icon, so I can differentiate between them easily.

3.  **Lesson Progression & Content Viewing:**
    *   **What it does:** Presents lessons within a selected Module in a visually clear, step-by-step, accessible progression list (potentially grouped by "Levels" with distinct visual treatment and semantic markup). Selecting a lesson displays its HTML content in a securely sandboxed and feature-restricted `<iframe>` with appropriate loading state indicators.
    *   **Why it's important:** Mimics a structured learning experience, allows users to see lesson context, provides core preview functionality securely and accessibly.
    *   **How it works:**
        *   An overview panel shows Module details (title, icon, description).
        *   The progression list is generated from `content.json` for the current Module; "Levels" are rendered as clear visual and semantic separators. `aria-current="true"` is used for the active lesson in the progression list.
        *   A loading indicator (e.g., spinner) is shown while lesson HTML is fetched.
        *   Lesson HTML files (paths defined in `content.json`) are loaded into an `<iframe>` configured with restrictive `sandbox`, `csp`, and `allow` (Feature Policy) attributes.
        *   Next/Previous buttons are accessible (keyboard navigable, properly labeled) and update the view.
    *   **User Stories:**
        *   As a course creator, when I select a Module, I want to see a clear list of all its lessons in sequence, so I understand the flow and can easily jump to any lesson using my mouse or keyboard.
        *   As a course creator, I want the currently viewed lesson to be visually and programmatically (e.g., for screen readers) highlighted in the progression list, so I always know my current position.
        *   As a course creator, when I click a lesson, I want to see a loading indicator if the lesson takes a moment to load, so the interface feels responsive and I know something is happening.
        *   As a course creator, I want my lesson HTML content displayed accurately and securely within an isolated frame, so I can verify its appearance and functionality without risk to the previewer tool itself or my browser.
        *   As a course creator, I want "Next" and "Previous" buttons that are easy to use with a mouse or keyboard to navigate through the lessons sequentially within a Module.
        *   As a course creator, I want "Levels" (as defined in my content structure) to be visually and semantically distinct in the progression view (e.g., using heading elements or distinct visual grouping) to better organize the lesson flow.

4.  **`content.json` Driven Structure & Robust Content Management:**
    *   **What it does:** All content structure (Learning Paths, Modules, Lessons), metadata (titles, descriptions, icons, file paths, levels), and ordering are defined in a central `content.json` file. For MVP, basic client-side structural checks on `content.json` occur, with more robust schema validation planned for the helper script.
    *   **Why it's important:** Decouples content definition from application logic, making content updates manageable. The integrity of `content.json` is crucial, as it dictates loaded resources. Manual updates to `content.json` are the MVP mechanism, with a helper script (including schema validation) as a high-priority future enhancement to reduce friction and errors.
    *   **How it works:** The application fetches and parses `content.json` on load. Basic client-side checks for essential structural integrity are performed. If minor, isolated errors are found in specific entries (e.g., a single lesson definition), the application attempts to gracefully degrade by skipping that entry and logging a console warning, rather than failing entirely.
    *   **User Stories:**
        *   As a course creator, I want a single, clear configuration file (`content.json`) to define my entire course structure and metadata, so I can easily add, remove, or reorder content without modifying core application code.
        *   As a course creator using the MVP, I understand I need to manually update `content.json`, but I expect clear documentation, examples, and some basic error feedback if I make a major structural mistake.
        *   As a course creator, I want the previewer to automatically reflect the structure defined in `content.json`.
        *   As a course creator, if I make a small typo in one lesson's entry in `content.json`, I want the rest of the course preview to still load, with an indication that one part failed, rather than the whole tool breaking.

5.  **Responsive & Accessible Design (Previewer Shell):**
    *   **What it does:** The previewer application interface (navigation, content areas) adapts to different screen sizes (desktop, tablet, mobile) and adheres to WCAG 2.1 Level AA accessibility standards for its own UI.
    *   **Why it's important:** Ensures the previewer tool itself is usable across devices by all users, including those with disabilities, and allows course creators to test the responsiveness of their *own* lesson content within a flexible viewing frame.
    *   **How it works:** Uses responsive CSS techniques (flexbox, grid, media queries) for the application shell. Semantic HTML, appropriate ARIA attributes, full keyboard navigability, sufficient color contrast, and logical focus management are implemented for the application shell. The responsiveness and accessibility of the lesson content *within the iframe* remain the responsibility of the lesson creator, facilitated by the tool.
    *   **User Stories:**
        *   As a course creator, I want the previewer tool itself to be responsive and fully usable with a keyboard and screen reader, so I can use it effectively on my desktop or tablet regardless of my abilities or input preferences.
        *   As a course creator, I want the previewer's viewing area for my lesson to resize appropriately, so I can assess how my HTML lessons render on different screen sizes and test their responsiveness.

6.  **User-Friendly Error Handling & Resilience:**
    *   **What it does:** Provides clear, understandable error messages to the user if issues occur (e.g., `content.json` malformed or missing, lesson file not found). Attempts to gracefully degrade if non-critical parts of `content.json` are malformed, skipping bad entries and logging console warnings.
    *   **Why it's important:** Prevents user frustration from cryptic errors or blank screens, guides them towards resolving issues, and maintains partial functionality where possible.
    *   **How it works:** JavaScript includes try-catch blocks for fetching/parsing data and loading files. If errors occur, user-facing messages are displayed in the UI (not just console errors). Logic is included to attempt to skip malformed individual entries in lists if the overall structural integrity of `content.json` is mostly intact.
    *   **User Stories:**
        *   As a course creator, if `content.json` has a syntax error or is missing, I want to see a clear message like "Error loading course structure. Please check `content.json` for formatting issues or ensure it exists," rather than a blank or broken page.
        *   As a course creator, if a lesson HTML file listed in `content.json` is missing, I want to see a message like "Lesson 'Lesson Title' not found at 'path/to/lesson.html'. Please verify the file path in `content.json`," so I can identify and fix the issue.

7.  **Deep Linking & Browser History Integration:**
    *   **What it does:** Provides unique, bookmarkable, and shareable URLs for different views within the previewer (e.g., specific Learning Paths, Modules, or Lessons) using hash-based routing. Integrates seamlessly with the browser's back and forward navigation buttons.
    *   **Why it's important:** Enhances usability by allowing users to directly access or share specific states of the application. Supports natural browser navigation patterns familiar to users.
    *   **How it works:** Uses hash-based routing (e.g., `index.html#/<path-id>/<module-id>/<lesson-id>`) and the browser's `history` API (`history.pushState` / `history.replaceState` or equivalent patterns if using a micro-router) to manage views and update the browser history stack.
    *   **User Stories:**
        *   As a course creator, I want to be able to copy the URL from my browser when viewing a specific lesson and send it to a colleague, so they can open it directly to that same lesson in their previewer.
        *   As a course creator, I want to use my browser's back and forward buttons to navigate through the different topics, modules, and lessons I've recently viewed within the previewer, just like I would on any other well-behaved website.
        *   As a course creator, I want to bookmark a specific module or lesson page in the previewer so I can easily return to it later.

### User Experience

*   **User Personas:**
    *   **Moodle Course Creator/Instructional Designer:** Technically proficient enough to create HTML content and manage files. Values efficiency, clear previews, and an organized way to test lessons before Moodle upload. Appreciates modern, engaging, and accessible UIs. Is likely to have multiple lessons and topics to manage.
*   **Key User Flows:**
    1.  **Browse Learning Paths:** User lands on the home page (e.g., `index.html`), sees Learning Path cards. (Error: If `content.json` fails to load critically, a user-friendly error message is displayed). User selects a Learning Path card (URL updates, e.g., `index.html#/<path-id>`).
    2.  **Explore Modules:** User views the Modules within the selected Learning Path. User selects a Module (URL updates, e.g., `index.html#/<path-id>/<module-id>`).
    3.  **Navigate & View Lessons:** User sees the lesson progression for the Module. They can click any lesson in the list (URL updates, e.g., `index.html#/<path-id>/<module-id>/<lesson-id>`). The lesson content loads in the iframe (with loading indicator). (Error: If a specific lesson HTML file fails to load, a user-friendly error message is displayed within the content area, but the rest of the UI remains functional). User uses Next/Previous buttons (URL updates accordingly).
    4.  **Return/Navigate Back:** User uses breadcrumbs (if implemented) or browser back/forward buttons to navigate to previously viewed states. URLs correctly reflect these states.
    5.  **Adding New Content (Developer Workflow):**
        *   Creator adds new HTML files/folders to the `course_content/` directory.
        *   Creator manually updates `content.json` (MVP) with new metadata/paths.
        *   Creator commits changes and pushes to GitHub; the live previewer reflects the updates.
*   **UI/UX Considerations:**
    *   **Brilliant.org Inspired:** Clean, modern, visually engaging aesthetic. Use of cards, icons, and clear typography.
    *   **Visual Hierarchy & Progression:** Clear distinction between Learning Paths, Modules, and Lessons. "Levels" in lesson progression visually and semantically break up content (e.g., distinct headers, subtle background changes, appropriate heading elements).
    *   **Intuitive & Accessible Navigation:** Obvious click targets, clear progression indicators, breadcrumbs (if implemented). Full keyboard navigability and screen reader compatibility for all interactive elements.
    *   **Loading States:** Use subtle spinners or placeholders when fetching `content.json` (initial load if significant) or lesson HTML to prevent jarring blank screens and provide feedback.
    *   **Feedback & Error Messages:** Visual cues for selected items. Clear, actionable error messages displayed in the UI, not just the console.
    *   **Consistency:** Uniform design language and interaction patterns across all views.
    *   **Efficient DOM Rendering:** Minimize unnecessary re-renders to keep the UI snappy.

## <PRD>

### Technical Architecture

*   **System Components:**
    *   `index.html`: Main application shell, built with semantic HTML.
    *   `style.css`: CSS for styling, adhering to WCAG AA contrast ratios, implementing responsive design.
    *   `script.js`: Modular JavaScript (ES6 Modules preferred) for all logic, including efficient DOM manipulation.
    *   `content.json`: Central JSON file defining the course structure.
    *   `course_content/`: Root directory containing all actual lesson content (HTML files, associated assets).
        *   `course_content/assets/icons/`: Recommended subfolder for storing optimized icons (SVG preferred for scalability and accessibility, or well-optimized raster images with appropriate text alternatives if SVGs are not feasible).
        *   `course_content/assets/images/`: For any other UI images if used by the previewer shell, also optimized.
*   **Data Models (`content.json` Structure Example):**
    ```json
    {
      "learningPaths": [
        {
          "id": "foundational-math", // Unique ID for routing/state
          "title": "Foundational Math",
          "description": "Master problem solving essentials in math",
          "icon": "course_content/assets/icons/math-icon.svg", // Path to SVG or optimized image
          "folder": "01-foundational-math", // Relative to course_content/
          "modules": [
            {
              "id": "solving-equations", // Unique ID for routing/state
              "title": "Solving Equations",
              "icon": "course_content/assets/icons/equations-icon.svg",
              "folder": "01-solving-equations", // Relative to parent path folder
              "lessons": [
                { "id": "intro-to-equations", "title": "Introduction to Equations", "file": "01-intro.html", "level": "Level 1" }, // Unique ID for routing/state
                { "id": "one-step-equations", "title": "One-Step Equations", "file": "02-one-step.html", "level": "Level 1" }
              ]
            }
            // ... more modules
          ]
        }
        // ... more learning paths
      ]
    }
    ```
    *   **Icon Specification:** The `icon` property expects a file path (e.g., to an SVG or optimized raster image located within `course_content/assets/icons/`). Icons conveying information must have appropriate text alternatives if not purely decorative (e.g., via `aria-label` on the element displaying the icon if it's an `<img>` or background image, or via title/desc in SVG).
*   **`<iframe>` Security Configuration:**
    *   **`sandbox` Attribute:** Must be used to isolate lesson content. Recommended starting configuration: `sandbox="allow-scripts allow-popups allow-forms"`. `allow-forms` and `allow-popups` should be evaluated based on typical lesson interactivity; if not commonly needed, they can be omitted for a tighter sandbox. `allow-same-origin` should generally be avoided unless explicitly understood and required by a specific, trusted lesson type, as it significantly reduces isolation. Other tokens like `allow-popups-to-escape-sandbox` or `allow-top-navigation` should be avoided unless there's an overwhelmingly strong, vetted use case.
    *   **`csp` Attribute (Content Security Policy for `iframe`):** Strongly recommended to apply a restrictive CSP via the `iframe`'s `csp` attribute. A good starting point, to be refined based on common, legitimate lesson needs: `csp="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; form-action 'self'; object-src 'none'; media-src 'self';"`. The use of `'unsafe-inline'` for scripts and styles is often necessary for compatibility with existing HTML content snippets but should be acknowledged as a trade-off. If lessons can avoid inline styles/scripts, these could be tightened.
    *   **`allow` Attribute (Feature/Permissions Policy on `iframe`):** Must be used to explicitly control access to powerful browser features. Recommended restrictive default: `allow="fullscreen 'self'; geolocation 'none'; microphone 'none'; camera 'none'; payment 'none'; usb 'none'; vr 'none'; accelerometer 'none'; ambient-light-sensor 'none'; autoplay 'none'; encrypted-media 'none'; gyroscope 'none'; magnetometer 'none'; midi 'none'; picture-in-picture 'none';"`. Only enable features like `fullscreen` if lessons legitimately use them, and preferably scoped to `'self'`.
*   **DOM Manipulation:** Use efficient techniques (e.g., document fragments for batch updates, event delegation) to minimize re-renders and maintain UI responsiveness. All interactive UI elements created by the previewer must be keyboard accessible and have clear visual focus indicators.
*   **State Management:** For MVP, primary view state (current path, module, lesson) will be managed via vanilla JavaScript, with the URL hash acting as the serializable source of truth.
*   **Routing:** Hash-based routing (e.g., listening to `hashchange` event or using a minimal hash-routing utility) to manage views, enable deep linking, and integrate with browser history.
*   **Accessibility:** The previewer application shell will strive for adherence to WCAG 2.1 Level AA guidelines.
*   **Caching:** Standard browser caching mechanisms provided by GitHub Pages (e.g., via ETags) will be relied upon for MVP.

### Development Roadmap

*   **Phase 1: MVP (Minimum Viable Product) Requirements:**
    1.  **Foundation, Secure & Accessible Data Handling & Routing:**
        *   Semantic `index.html` shell, accessible `style.css` (WCAG AA contrast, base responsive layout), modular `script.js` (ES6 Modules preferred).
        *   Robust fetching and parsing of `content.json`, including user-facing error handling for critical failures (e.g., file not found, major syntax error) and graceful degradation (skipping bad entries, logging warnings) for minor, isolated errors within `content.json`. Basic client-side structural checks on `content.json` data.
        *   Implement hash-based routing for deep linking to Learning Paths, Modules, and Lessons, with correct browser history integration (back/forward buttons).
        *   Core accessibility implementation for the previewer shell: Semantic HTML throughout, full keyboard navigability for all UI elements, appropriate ARIA attributes where necessary (e.g., `aria-current` for active navigation items, `aria-label` for icon-only buttons), logical focus management, sufficient color contrast.
    2.  **Core Navigation & Secure, Accessible Display Logic:**
        *   Dynamically render accessible Learning Path cards.
        *   Dynamically render accessible Module list/cards upon Path selection.
        *   Dynamically render accessible Lesson Progression list upon Module selection (with semantic "Level" distinction and `aria-current` for the selected lesson).
        *   Implement lesson HTML loading into a securely configured `<iframe>` (with defined `sandbox`, `csp`, and `allow` attributes) including a simple loading state indicator.
    3.  **Interaction & Navigation:**
        *   Implement click and keyboard (Enter/Space) handlers for Path, Module, and Lesson selection.
        *   Implement accessible "Next Lesson" and "Previous Lesson" buttons that update the selected lesson, the `iframe` content, and the URL hash.
        *   (Optional for MVP, recommended if time allows) Basic breadcrumb navigation display reflecting the current view.
    4.  **Responsive Shell & Optimized Assets:**
        *   Ensure the main layout and navigation of the previewer application shell are responsive across common desktop, tablet, and mobile viewport sizes.
        *   Ensure any icons or images used directly by the previewer UI are optimized for web delivery (e.g., SVGs, optimized PNGs/WebP).
    5.  **Documentation:**
        *   Clear instructions on setting up the `course_content/` directory structure.
        *   Detailed guide on creating and maintaining `content.json`, including the expected schema and examples.
        *   "Best Practices for Lesson HTML" (see Appendix), covering content creation, accessibility, security considerations within the `iframe`, and performance.

*   **Phase 2: Core Usability, Performance & Validation Enhancements (High Priority Post-MVP):**
    1.  **Content Management Helper Script (Local Utility):** This script, runnable locally by the course creator, *must* include robust `content.json` schema validation against a defined JSON Schema. It should also offer features to scaffold new entries or update based on directory structure to significantly reduce manual editing friction and errors.
    2.  **Visual Polish & Enhanced Styling:** Refine CSS to more closely match the Brilliant.org aesthetic inspiration (e.g., shadows, rounded corners, smoother transitions/animations, refined iconography integration).
    3.  **Client-Side Lesson Status:** Use `localStorage` to track "viewed" or "completed" lessons and reflect this visually in the progression list (e.g., different icon, dimmed style).
    4.  **Lesson Pre-fetching:** Implement logic to pre-fetch the HTML content for the next one or two lessons in the current module's sequence to improve perceived navigation speed when clicking "Next Lesson."
    5.  **Refined `iframe` CSP & Feature Policy Configuration:** Based on observed common legitimate lesson requirements and evolving best practices, refine the default CSP and Feature Policy strings for the `iframe` to be as restrictive as possible while still functional.

*   **Phase 3: Further Enhancements (Medium Priority):**
    1.  **Search Functionality:** Implement client-side search for Learning Paths, Modules, or Lesson titles within `content.json`.
    2.  **"NEW" / "IN PROGRESS" Badges:** Add support in `content.json` metadata and UI rendering for displaying status badges (e.g., "NEW", "UPDATED", "IN PROGRESS") on Learning Paths or Modules.
    3.  **Advanced Error Handling & Diagnostics:** Provide more detailed error information or diagnostic tools for troubleshooting issues with `content.json` or lesson loading, perhaps via a collapsible "debug info" panel.
    4.  **Accessibility (a11y) Audit & Improvements:** Conduct a more formal accessibility audit against WCAG 2.1 AA (or higher) and implement any identified improvements for the previewer shell.
    5.  **Lazy Loading of UI Images:** If the main previewer UI (not lesson content) becomes image-heavy (e.g., many illustrative icons for paths/modules), implement lazy loading for these images.

*   **Phase 4: Long-Term Enhancements (Lower Priority):**
    1.  **Theming (e.g., Light/Dark Mode):** Add basic theming capabilities for the previewer shell.
    2.  **Simple Feedback Mechanism:** Implement a non-intrusive way for users to provide feedback about the previewer tool itself (e.g., a "Provide Feedback" link opening a mailto or a simple form if an external service is used).
    3.  **External Library Vetting & Integration:** If any third-party JavaScript libraries are considered for future features, they must be thoroughly vetted for security vulnerabilities, performance impact, and accessibility before integration.
    4.  **Granular Content Loading for `content.json`:** For extreme scalability with thousands of lessons, investigate architectural changes like a manifest-of-manifests approach where `content.json` links to smaller, per-path JSON files that are loaded on demand.

### Logical Dependency Chain

1.  **Foundation (Data Handling, Routing, Accessibility Basics First):**
    *   Define the `content.json` schema clearly. Create initial `content.json` with sample data.
    *   Implement JavaScript functions to fetch and robustly parse `content.json`, including user-facing error display for critical load/parse failures and graceful degradation for minor entry errors.
    *   Set up the hash-based URL routing mechanism and integration with browser history.
    *   Create the basic `index.html` shell with semantic markup and `style.css` with foundational accessibility considerations (e.g., base font sizes, color palette with good contrast).
    *   Define and apply the initial `iframe` security attributes (`sandbox`, `csp`, `allow`).
    *   Establish core accessibility patterns: keyboard navigation logic, focus management strategy.
2.  **Learning Path View (incorporating routing & a11y):**
    *   JS: Render Learning Path cards from parsed `content.json` data.
    *   HTML/CSS: Style Learning Path cards accessibly.
    *   JS: Implement click and keyboard handlers on Path cards to update URL hash and trigger next view.
3.  **Module View & Lesson Progression (incorporating routing & a11y):**
    *   JS: Filter/retrieve Modules for the selected Path from `content.json`.
    *   JS: Render Module cards/list OR directly render the Lesson Progression list for the first/selected Module.
    *   HTML/CSS: Style Module list and Lesson Progression list accessibly (vertical steps, semantic levels, `aria-current`).
    *   JS: Implement click and keyboard handlers on Module items (if applicable) and Lesson items to update URL hash.
4.  **Lesson Content Display (within secure `iframe`):**
    *   JS: On lesson selection (driven by URL hash change), construct the correct file path from `content.json` and set the `src` of the `<iframe>`. Implement loading indicator. Handle errors if lesson file not found.
    *   HTML: Ensure `<iframe>` is correctly placed in the layout.
5.  **Navigation Elements (incorporating routing & a11y):**
    *   JS: Implement "Next" / "Previous" lesson logic, updating the active lesson in the progression, the `iframe` source, and the URL hash. Ensure buttons are fully accessible.
    *   JS/HTML (Optional MVP): Implement breadcrumb generation and updates based on current URL hash.
6.  **Iterative Styling, Responsiveness, Asset Optimization & A11y Refinement:**
    *   Apply Brilliant.org-inspired styling iteratively throughout development.
    *   Continuously test and implement responsive design adjustments for the shell.
    *   Optimize any UI assets.
    *   Continuously test and refine accessibility features (keyboard nav, ARIA, focus, screen reader compatibility).

### Risks and Mitigations

*   **Security Risks:**
    *   **Risk:** Malicious content in lesson HTML executed within `iframe` affecting parent previewer page or user's browser.
    *   **Mitigation:** Strict `iframe` `sandbox` configuration. Implement `iframe` `csp` (Content Security Policy) attribute. Implement `iframe` `allow` (Feature/Permissions Policy) attribute. Provide clear "Best Practices for Lesson HTML" for course creators, emphasizing secure coding practices for lesson content. Ensure no direct rendering of untrusted HTML from `content.json` into the previewer's main DOM (titles/descriptions treated as text).
    *   **Risk:** Compromised `content.json` in the repository pointing to malicious external resources.
    *   **Mitigation:** This is primarily a repository security issue (e.g., secure GitHub account practices, branch protection rules). User education on trusting content sources. The application itself trusts the paths within `content.json` once loaded.
    *   **Risk:** Path traversal vulnerabilities if paths in `content.json` were somehow manipulated (low risk for browser `fetch` within its sandboxed environment, but good to be aware of).
    *   **Mitigation:** Enforce clear conventions for paths in `content.json` to be relative and contained within the `course_content/` directory. Server-side (GitHub Pages) mechanisms also prevent typical path traversal.
*   **Performance Bottlenecks:**
    *   **Risk:** Slow initial load or UI jank if `content.json` is very large or DOM manipulation is inefficient.
    *   **Mitigation:** Monitor `content.json` parsing time during development. Implement efficient DOM update techniques (e.g., document fragments, event delegation). Defer complex or non-critical processing. Optimize all image assets used by the previewer UI. Acknowledge potential for future optimization (e.g., granular `content.json` loading) if scaling becomes an issue.
    *   **Risk:** Sluggish "Next/Previous Lesson" navigation if individual lesson HTML files are large and fetched on demand.
    *   **Mitigation:** Implement lesson pre-fetching (Phase 2). Encourage optimization of lesson HTML file sizes in "Best Practices."
*   **Content Management Friction (MVP):**
    *   **Risk:** Manually updating `content.json` can be tedious, error-prone, and a barrier to adoption for creators with large courses.
    *   **Mitigation (MVP):** Provide excellent documentation, clear `content.json` examples, and user-friendly error messages for `content.json` issues. Implement basic client-side structural checks and graceful degradation.
    *   **Mitigation (High Priority Post-MVP):** Develop the "Content Management Helper Script" with robust schema validation and scaffolding features. This is crucial for long-term usability and user satisfaction.
*   **Accessibility Shortfalls:**
    *   **Risk:** The MVP ships without meeting baseline accessibility standards, excluding some users or providing a subpar experience.
    *   **Mitigation:** Integrate accessibility requirements directly into MVP development tasks for the previewer shell. Conduct basic accessibility checks throughout development (keyboard navigation, screen reader smoke tests, color contrast checks). Ensure "Best Practices for Lesson HTML" strongly covers creating accessible lesson content.
*   **Scope Creep:**
    *   **Risk:** Trying to replicate too many advanced Brilliant.org features or non-essential visual polish in the MVP, delaying initial release or overcomplicating the core.
    *   **Mitigation:** Strictly adhere to the "MVP Requirements" outlined in the Development Roadmap. Prioritize core previewing functionality, security, and accessibility. Defer secondary features or extensive visual polish if they impede MVP delivery.
*   **Adoption & Value Perception:**
    *   **Risk:** The tool isn't adopted if it's too cumbersome to use (especially linked to content management friction) or doesn't provide significant value over existing workflows.
    *   **Mitigation:** Ensure the MVP genuinely solves the core problem of efficient and reliable lesson previewing. Prioritize the "Content Management Helper Script" post-MVP. Gather early feedback from target users to iterate and improve.

### Appendix

*   **`content.json` Structure & Schema Guidance:**
    *   (Refer to Data Models section for example structure).
    *   A formal JSON Schema definition for `content.json` should be created and maintained, especially for use with the "Content Management Helper Script." This schema would define required properties, data types, and patterns for IDs, paths, etc.
*   **Inspiration:** Brilliant.org website, particularly its course listing, module structure, and lesson progression UIs, focusing on clarity, engagement, and structured learning paths.
*   **Content Folder Strategy:**
    *   All user-created lesson files (`.html`) and directly associated assets (images, CSS, JS used *within* a specific lesson) should reside within the `course_content/` directory. This directory should be organized logically, typically with subfolders for each Learning Path, and further subfolders for Modules within those Paths.
    *   Icons or other UI assets used by the previewer shell itself (referenced in `content.json` for Path/Module cards, etc.) should be placed in a dedicated subfolder like `course_content/assets/icons/`.
    *   All image assets (for UI or within lessons) must be optimized for web delivery (e.g., using SVGs where appropriate, compressing PNGs/JPEGs, considering WebP format).
    *   Paths in `content.json` for `folder`, `file`, and `icon` attributes must be consistently relative (e.g., `folder` paths relative to `course_content/`, `file` paths relative to their module's folder, `icon` paths relative to `course_content/`).
*   **Best Practices for Lesson HTML (for Course Creators):**
    *   **Self-Contained & Standard HTML:**
        *   Lesson HTML files should ideally be self-contained regarding their core styling (CSS) and functionality (JS). Assume the previewer provides no default styling to the lesson content itself for MVP.
        *   Use valid, semantic HTML5 for best compatibility and accessibility.
    *   **Accessibility (Lesson Content):**
        *   **Semantic Structure:** Use appropriate HTML elements for structure (e.g., `<h1>-<h6>` for headings in logical order, `<p>` for paragraphs, `<ul>/<ol>/<dl>` for lists, `<nav>` for navigation blocks, `<main>`, `<article>`, `<aside>`, etc.).
        *   **Text Alternatives:** Provide appropriate alternative text for all non-text content (e.g., `alt` attributes for `<img>` tags, descriptions for complex charts or diagrams).
        *   **Keyboard Navigability:** Ensure all interactive elements within the lesson (links, buttons, form controls, custom widgets) are fully operable via keyboard.
        *   **Focus Indicators:** Ensure all keyboard-focusable elements have clear visual focus indicators.
        *   **Color Contrast:** Maintain sufficient color contrast between text and background (WCAG AA minimums).
        *   **Forms:** Label all form controls clearly. Group related controls using `<fieldset>` and `<legend>`. Provide clear error messages and validation.
        *   **Responsive Design:** Design lessons to be responsive and usable across different screen sizes and zoom levels.
    *   **`<iframe>` Context & Security:**
        *   Understand that the lesson content runs within a sandboxed and feature-restricted `<iframe>`.
        *   Avoid excessive reliance on `window.parent` manipulations, as these may behave differently or be blocked by the sandbox.
        *   Do not include scripts or load resources from untrusted third-party domains unless absolutely necessary and understood. Be aware of the default CSP (Content Security Policy) and Feature Policy applied by the previewer's `iframe`, as these may restrict what your lesson can do.
        *   Sanitize any dynamic data that is displayed within the lesson if it originates from potentially untrusted sources.
    *   **Performance:**
        *   Optimize all images and media files used within the lesson for fast loading.
        *   Minimize the use of large JavaScript libraries if simpler, native solutions exist.
        *   Avoid computationally expensive operations that might block the main thread on lesson load.
        *   Strive for lesson HTML files plus their critical assets (CSS, JS, essential images) to be reasonably sized (e.g., aim for under 1-2MB as a general guideline) for good preview performance.
    *   **Forbidden APIs/Patterns (Guidance):** Avoid using `document.write` after the page has loaded. Minimize use of synchronous XHR/fetch operations. Avoid creating excessive global variables. Be cautious with scripts that significantly manipulate the DOM immediately on load in a blocking manner.
*   **Input Sanitization:** The previewer application itself does not directly render arbitrary HTML from `content.json` strings (like titles or descriptions) into its main DOM without treating them as plain text. Lesson content is isolated within the `<iframe>`. If this architectural assumption ever changes (e.g., rendering descriptions as HTML), rigorous HTML sanitization for any user-provided content rendered directly into the previewer's DOM would be an absolute requirement.
*   **External Library Policy:** The MVP aims for vanilla JavaScript to minimize dependencies, bundle size, and potential attack surface. If external third-party JavaScript libraries are considered for future enhancements, they must be thoroughly vetted for:
    *   Security vulnerabilities (e.g., checking against Snyk, NPM audit, or similar vulnerability databases).
    *   Performance impact (bundle size, runtime performance).
    *   Accessibility implications.
    *   License compatibility.
    *   Maintenance status and community support.
    Libraries should be kept up-to-date with security patches.
*   **Development Best Practices (for Previewer Application Development):**
    *   **Code Quality & Consistency:** Use code quality tools like ESLint (for JavaScript) and Prettier (for code formatting) to maintain a consistent, clean, and error-minimized codebase. Configure these tools with appropriate rule sets.
    *   **Modularity:** Structure JavaScript code using ES6 Modules to promote better organization, maintainability, and reusability. Break down complex logic into smaller, focused modules and functions.
    *   **Testing (Internal Strategy):** While extensive E2E testing might be out of scope for MVP, basic unit tests for critical utility functions (e.g., `content.json` parsing logic, URL routing utilities, complex data transformation functions) are highly recommended to prevent regressions and ensure core logic correctness.
*   **Success Metrics / Feedback (Future Consideration):**
    *   For MVP, success will be primarily gauged by anecdotal feedback from initial users (course creators) on usability, efficiency gains, and overall satisfaction.
    *   Future: Consider implementing a simple, non-intrusive "Provide Feedback" link/button within the previewer tool. If deployed in a context that allows for analytics (e.g., an internal company tool where users opt-in), basic usage metrics (e.g., number of active users, sessions) could be tracked.