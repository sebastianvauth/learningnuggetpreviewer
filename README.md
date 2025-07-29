# Learning Nugget Previewer

## Overview

The Learning Nugget Previewer is a static web application designed to run on GitHub Pages or any simple HTTP server. It allows Moodle course creators and instructional designers to efficiently test and preview HTML-based Moodle lessons locally before deployment. The goal is to streamline the development workflow by providing a modern, engaging, secure, and accessible preview experience.

## Core MVP Features

*   **Learning Path Discovery:** Displays available Learning Paths (top-level topics) as cards.
*   **Module Listing:** Shows Modules (sub-topics/chapters) within a selected Learning Path.
*   **Lesson Progression:** Presents lessons within a Module in a sequential list, grouped by levels.
*   **Secure Lesson Viewing:** Loads and displays HTML lesson content in a sandboxed `<iframe>`.
*   **`content.json` Driven:** Course structure and metadata are defined in `content.json`.
*   **Responsive Design:** The previewer interface adapts to different screen sizes.
*   **Accessibility:** Core navigation and UI elements are designed with accessibility in mind.
*   **Hash-Based Routing:** Supports deep linking and browser history navigation.
*   **Error Handling:** Provides user-facing messages for content loading issues.
*   **Graceful Degradation:** Attempts to load valid parts of `content.json` even if some entries are malformed.

## Technology Used (MVP)

*   **HTML5:** Semantic markup for structure.
*   **CSS3:** Styling for presentation, including Flexbox/Grid for layout and Media Queries for responsiveness.
*   **Vanilla JavaScript (ES6+):** All client-side logic, including:
    *   DOM manipulation
    *   Fetching and parsing JSON (`content.json`)
    *   Hash-based routing (`window.location.hash`, `hashchange` event)
    *   Dynamic content rendering
    *   Event handling
    *   ARIA attribute manipulation for accessibility
*   **SVG:** For placeholder icons (actual SVGs recommended for production).
*   **Python Simple HTTP Server:** For local development and testing.

## Project Setup

1.  Ensure you have all the project files: `index.html`, `style.css`, `script.js`, and `content.json`.
2.  Create a `course_content` directory in the project root.
3.  Inside `course_content`, create an `assets/icons` subdirectory for your SVG icons.
4.  Place your HTML lesson files within appropriately named subdirectories inside `course_content` (see "Basic Usage" below).

## How to Run Locally

This project consists of static HTML, CSS, and JavaScript files. You can run it locally using any simple HTTP server. A common method is to use Python's built-in HTTP server:

1.  Open a terminal or command prompt.
2.  Navigate to the root directory of this project (where `index.html` is located).
3.  If you have Python 3, run the command: `python -m http.server`
4.  If you have Python 2, run the command: `python -m SimpleHTTPServer`
5.  Open your web browser and go to `http://localhost:8000` (or the port indicated by the server).

## Basic Usage for Course Creators (MVP)

The previewer's content and structure are primarily managed through the `content.json` file and the organization of your lesson files within the `course_content` directory.

### 1. `content.json` Structure and Schema (v2 - Course Hierarchy)

This JSON file defines the hierarchy of your courses. The root object must contain a `courses` array.

*   **`courses`** (Array of Course Objects): Each object represents a top-level course.
    *   `id` (string, required): Unique identifier for the course (used in URL hash). *Example: "machine-learning-2"*
    *   `title` (string, required): Display title of the course. *Example: "Machine Learning 2"*
    *   `description` (string, optional): Short description displayed on the course card. *Example: "Advanced machine learning concepts, neural networks, and optimization techniques"*
    *   `icon` (string, optional): Path to an icon image (SVG preferred) relative to the project root. *Example: "course_content/assets/icons/neural-networks-icon.svg"*
    *   `learningPaths` (Array of Learning Path Objects, required): Contains the learning paths for this course.

*   **Learning Path Object** (within `courses[n].learningPaths` array): Each object represents a topic within a course.
    *   `id` (string, required): Unique identifier for the learning path (used in URL hash). *Example: "foundational-math"*
    *   `title` (string, required): Display title of the learning path. *Example: "Foundational Math"*
    *   `description` (string, optional): Short description displayed on the learning path card. *Example: "Master problem solving essentials in math"*
    *   `icon` (string, optional): Path to an icon image (SVG preferred) relative to the project root. *Example: "course_content/assets/icons/math-icon.svg"*
    *   `folder` (string, required): Name of the directory within `course_content/` that holds this learning path's modules and content. *Example: "01-foundational-math"*
    *   `modules` (Array of Module Objects, required): Contains the modules for this learning path.

*   **Module Object** (within `learningPaths[n].modules` array): Represents a sub-topic or chapter.
    *   `id` (string, required): Unique identifier for the module within its learning path (used in URL hash). *Example: "solving-equations"*
    *   `title` (string, required): Display title of the module. *Example: "Solving Equations"*
    *   `icon` (string, optional): Path to an icon for the module. *Example: "course_content/assets/icons/equations-icon.svg"*
    *   `folder` (string, required): Name of the directory within the parent learning path's folder that holds this module's lessons. *Example: "01-solving-equations"*
    *   `lessons` (Array of Lesson Objects, required): Contains the lessons for this module.

*   **Lesson Object** (within `modules[n].lessons` array): Represents an individual HTML lesson page.
    *   `id` (string, required): Unique identifier for the lesson within its module (used in URL hash). *Example: "intro-to-equations"*
    *   `title` (string, required): Display title of the lesson. *Example: "Introduction to Equations"*
    *   `file` (string, required): Filename of the HTML lesson content, relative to the parent module's folder. *Example: "01-intro.html"*
    *   `level` (string, optional): A grouping identifier for lessons within a module (e.g., "Level 1", "Level 2"). *Example: "Level 1"*

**Full `content.json` Example:**
```json
{
  "learningPaths": [
    {
      "id": "foundational-math",
      "title": "Foundational Math",
      "description": "Master problem solving essentials in math",
      "icon": "course_content/assets/icons/math-icon.svg",
      "folder": "01-foundational-math",
      "modules": [
        {
          "id": "solving-equations",
          "title": "Solving Equations",
          "icon": "course_content/assets/icons/equations-icon.svg",
          "folder": "01-solving-equations",
          "lessons": [
            { "id": "intro-to-equations", "title": "Introduction to Equations", "file": "01-intro.html", "level": "Level 1" },
            { "id": "one-step-equations", "title": "One-Step Equations", "file": "02-one-step.html", "level": "Level 1" }
          ]
        },
        {
          "id": "advanced-algebra",
          "title": "Advanced Algebra",
          "icon": "course_content/assets/icons/algebra-icon.svg",
          "folder": "02-advanced-algebra",
          "lessons": [
            { "id": "intro-to-algebra", "title": "Introduction to Algebra", "file": "01-intro-algebra.html", "level": "Level 1" },
            { "id": "quadratic-equations", "title": "Quadratic Equations", "file": "02-quadratic.html", "level": "Level 2" }
          ]
        }
      ]
    },
    {
      "id": "intro-to-programming",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming with Python",
      "icon": "course_content/assets/icons/programming-icon.svg",
      "folder": "02-intro-to-programming",
      "modules": [
        {
          "id": "python-basics",
          "title": "Python Basics",
          "icon": "course_content/assets/icons/python-icon.svg",
          "folder": "01-python-basics",
          "lessons": [
            { "id": "hello-world", "title": "Hello, World!", "file": "01-hello-world.html", "level": "Level 1" },
            { "id": "variables-types", "title": "Variables and Data Types", "file": "02-variables.html", "level": "Level 1" }
          ]
        }
      ]
    }
  ]
}
```

**Important for MVP:** You will need to manually update `content.json` when adding, removing, or reordering paths, modules, or lessons. Ensure all required fields are present for each entry to avoid being skipped by the parser (warnings will appear in the browser console for skipped items).

### 2. `course_content/` Directory Structure

All your lesson content (HTML files and their local assets) and UI icons should reside here.

*   **Icons:** Store icons referenced in `content.json` (for paths and modules) in `course_content/assets/icons/`. SVG format is preferred.
    *   Example: `course_content/assets/icons/math-icon.svg`

*   **Learning Path Folders:** Create a folder for each learning path inside `course_content/`. The name should match the `folder` property in `content.json` for that path.
    *   Example: `course_content/01-foundational-math/`

*   **Module Folders:** Inside each learning path folder, create subfolders for each module. The name should match the `folder` property for that module in `content.json`.
    *   Example: `course_content/01-foundational-math/01-solving-equations/`

*   **Lesson Files:** Place your HTML lesson files inside their respective module folders. The filename should match the `file` property for that lesson in `content.json`.
    *   Example: `course_content/01-foundational-math/01-solving-equations/01-intro.html`

By following this structure and keeping `content.json` updated, the previewer will be able to find and display your lessons.

## Future Enhancements (Post-MVP)

*   Helper script for managing `content.json` and validating its schema.
*   Visual polish and refined styling.
*   And more as outlined in the project's Product Requirements Document (PRD).