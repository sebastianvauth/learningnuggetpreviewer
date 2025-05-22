# Learning Nugget Previewer - MVP Development To-Do List

**Key:**
*   **ID:** Unique Task ID
*   **Task:** Description of the work
*   **Done:** [ ] / [x]
*   **Depends On:** ID(s) of tasks that must be completed first
*   **Complexity:** S, M, L, XL (Small, Medium, Large, Extra Large)
*   **Notes/Owner Idea:** Additional context, potential primary developer

---

**Phase 1: MVP (Minimum Viable Product) Requirements**

**I. Foundation, Secure & Accessible Data Handling (Core Logic & Setup)**

| ID  | Task                                                                                                | Done | Depends On | Complexity | Notes/Owner Idea                                                                     |
| :-- | :-------------------------------------------------------------------------------------------------- | :--: | :--------- | :--------- | :----------------------------------------------------------------------------------- |
| F01 | Setup project: `index.html` (semantic shell), initial `style.css`, `script.js` (ES6 module setup).  | [x]  | -          | S          | Basic boilerplate. (Ben)                                                             |
| F02 | Define `content.json` v1 schema (formalize structure, types, required fields). Create sample file. | [x]  | -          | M          | Document this schema well. (Mark/Alex)                                               |
| F03 | Implement `fetch` & parse `content.json`. Handle basic load/parse errors (user-facing UI messages). | [x]  | F01, F02   | M          | Focus on robustness. (Alex)                                                          |
| F04 | Implement graceful degradation for minor malformed entries within `content.json` lists.             | [x]  | F03        | M          | E.g., skip bad lesson entry, log to console, continue rendering rest. (Alex)       |
| F05 | Setup basic hash-based routing mechanism (e.g., simple router or manual hashchange listener).         | [x]  | F01        | M          | For deep linking and history. (Ben)                                                  |
| F06 | Implement core accessibility setup: ARIA live region for error messages, basic focus management plan. | [x]  | F01        | S          | Foundational a11y. (Ben)                                                             |
| F07 | Define `iframe` security attributes (`sandbox`, `csp`, `allow`) as per PRD.                         | [x]  | -          | S          | Document defaults clearly. (Alex)                                                    |
| F08 | Basic unit tests for `content.json` parsing utility and critical helper functions.                  | [x]  | F03        | M          | Developer best practice. (Alex)                                                      |

**II. Core Navigation & Secure, Accessible Display Logic (UI Rendering)**

| ID  | Task                                                                                                   | Done | Depends On    | Complexity | Notes/Owner Idea                                                                                                                              |
| :-- | :----------------------------------------------------------------------------------------------------- | :--: | :------------ | :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| UI01 | Implement rendering of Learning Path cards from `content.json` data.                                   | [x]  | F03, F05, F06 | M          | Semantic HTML, keyboard accessible, ARIA attributes for cards. (Ben)                                                                        |
| UI02 | Implement rendering of Module cards/list when a Learning Path is selected.                             | [x]  | UI01          | M          | Update URL hash. Semantic, accessible. (Ben)                                                                                                  |
| UI03 | Implement rendering of Lesson Progression list when a Module is selected.                                | [x]  | UI02          | L          | Semantic list, "Level" distinction, `aria-current` for active lesson, keyboard accessible. (Ben)                                              |
| UI04 | Style Learning Path, Module, and Lesson Progression views with basic responsive and accessible CSS.      | [x]  | UI01,UI02,UI03| L          | Focus on layout, typography, color contrast. (Ben)                                                                                            |
| UI05 | Implement lesson HTML loading into securely configured `<iframe>`.                                       | [x]  | F07, UI03     | M          | This is just loading the file, not displaying content yet. (Alex)                                                                             |
| UI06 | Implement a simple loading state indicator (e.g., spinner) when fetching/loading lesson HTML.          | [x]  | UI05          | S          | (Ben)                                                                                                                                         |
| UI07 | Implement display of breadcrumb navigation based on current view (Path > Module > Lesson).               | [x]  | F05, UI03     | M          | Update with routing. (Ben)                                                                                                                    |
| UI08 | Ensure all interactive UI elements (cards, list items, buttons) have clear focus indicators.           | [x]  | F06, UI04     | M          | Critical for accessibility. (Ben)                                                                                                             |

**III. Interaction & Navigation (User Actions)**

| ID  | Task                                                                                                | Done | Depends On    | Complexity | Notes/Owner Idea                                                                     |
| :-- | :-------------------------------------------------------------------------------------------------- | :--: | :------------ | :--------- | :----------------------------------------------------------------------------------- |
| IN01 | Implement click handlers for Learning Path cards to navigate to Module view.                        | [x]  | UI01, F05     | S          | Update URL, trigger view change. (Ben)                                               |
| IN02 | Implement click handlers for Module cards/list items to navigate to Lesson Progression view.          | [x]  | UI02, F05     | S          | Update URL, trigger view change. (Ben)                                               |
| IN03 | Implement click handlers for Lesson Progression list items to load selected lesson into `<iframe>`.   | [x]  | UI03, UI05    | M          | Update URL, highlight item, trigger load. (Ben/Alex)                                 |
| IN04 | Implement "Next Lesson" and "Previous Lesson" buttons functionality.                                | [x]  | IN03          | M          | Update active lesson, URL, load content. (Ben/Alex)                                  |
| IN05 | Integrate routing with browser back/forward buttons (handle `popstate` / `hashchange` events).      | [x]  | F05           | M          | Ensure smooth history navigation. (Ben)                                              |

**IV. Responsive Shell & Optimized Assets**

| ID  | Task                                                                                           | Done | Depends On | Complexity | Notes/Owner Idea                                                               |
| :-- | :--------------------------------------------------------------------------------------------- | :--: | :--------- | :--------- | :----------------------------------------------------------------------------- |
| R01 | Ensure overall application shell (header, main content, sidebar/nav areas) is responsive.      | [x]  | UI04       | M          | Test on common breakpoints. (Ben)                                              |
| R02 | Create/select and optimize any default UI icons (e.g., for next/prev, placeholders).           | [x]  | -          | S          | SVG preferred. (Ben)                                                           |

**V. Documentation**

| ID  | Task                                                                                              | Done | Depends On | Complexity | Notes/Owner Idea                                                        |
| :-- | :------------------------------------------------------------------------------------------------ | :--: | :--------- | :--------- | :---------------------------------------------------------------------- |
| D01 | Write initial `README.md` with project setup, how to run, and basic usage for course creators.    | [x]  | F01        | S          | (Mark)                                                                  |
| D02 | Document `content.json` structure and schema (v1) clearly with examples.                          | [x]  | F02        | M          | Crucial for creators. (Mark/Alex)                                       |
| D03 | Create "Best Practices for Lesson HTML" document (incl. accessibility, security, performance tips). | [x]  | F07        | M          | To guide lesson creators. (Mark/Alex/Ben)                               |

---

**Summary of Dependencies & Flow:**

1.  **Foundation (Fxx tasks):** Must come first. F01-F03 are prerequisites for almost everything. F05 (routing) is key for UI structure. F07 (`iframe` security) is an early definition.
2.  **UI Rendering (UIxx tasks):** Can start once F03 and F05 are stable. UI01 (Paths) -> UI02 (Modules) -> UI03 (Lessons) forms a natural progression. UI04 (Styling) can happen in parallel/iteratively.
3.  **Interaction (INxx tasks):** Depends heavily on the UI elements being rendered (UIxx) and the routing (F05).
4.  **Responsive & Assets (Rxx tasks):** R01 builds on UI04. R02 can be done early.
5.  **Documentation (Dxx tasks):** Can be done in parallel, but D02 needs F02, and D03 benefits from F07 and general understanding.

**Complexity Overview (Rough Count):**
*   **S:** 6
*   **M:** 13
*   **L:** 2
*   **XL:** 0 (Good for MVP, indicates tasks are reasonably sized)