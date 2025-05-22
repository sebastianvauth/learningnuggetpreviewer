# Best Practices for Creating Moodle Lesson HTML Content

This document provides guidelines and best practices for creating HTML content to be used within the Learning Nugget Previewer. Adhering to these practices will help ensure your lessons are accessible, secure, performant, and display correctly within the previewer and, ultimately, in Moodle.

## Table of Contents

1.  [Accessibility (A11y)](#accessibility-a11y)
2.  [Security](#security)
3.  [Performance](#performance)
4.  [HTML Structure and Semantics](#html-structure-and-semantics)
5.  [Styling (CSS)](#styling-css)
6.  [JavaScript (JS)](#javascript-js)
7.  [Media (Images, Audio, Video)](#media-images-audio-video)
8.  [Moodle-Specific Considerations](#moodle-specific-considerations)

---

## 1. Accessibility (A11y)

Ensuring your content is accessible to all users, including those with disabilities, is crucial.

*   **Semantic HTML:** Use HTML elements for their intended purpose (e.g., `<nav>`, `<button>`, `<article>`). This provides inherent meaning and aids assistive technologies.
*   **Alternative Text for Images:** Always provide descriptive `alt` text for images (`<img alt="Description of image">`). For purely decorative images, use an empty alt attribute (`alt=""`).
*   **Keyboard Navigation:** Ensure all interactive elements (links, buttons, form controls) are focusable and operable using a keyboard.
*   **Sufficient Color Contrast:** Use color combinations for text and background that meet WCAG AA contrast ratios (at least 4.5:1 for normal text, 3:1 for large text). Use tools to check contrast.
*   **Readable Fonts:** Choose clear, legible fonts and provide sufficient font sizes.
*   **ARIA Attributes (Use Sparingly):** Use ARIA (Accessible Rich Internet Applications) attributes only when necessary to enhance accessibility where semantic HTML alone is insufficient. Incorrect ARIA usage can harm accessibility.
*   **Forms:**
    *   Label all form controls clearly using `<label for="id">`.
    *   Group related controls using `<fieldset>` and `<legend>`.
    *   Provide clear error messages and instructions.
*   **Tables:**
    *   Use `<caption>` for table titles.
    *   Use `<th>` for table headers and specify `scope="col"` or `scope="row"`.
    *   For complex data tables, consider using `<thead>`, `<tbody>`, and `<tfoot>`.
*   **Multimedia:** Provide captions and transcripts for audio and video content.

---

## 2. Security

Lesson HTML is loaded into an `<iframe>` within the previewer. While the `iframe` has security attributes (`sandbox`, `csp`), it's best practice to write secure HTML from the start.

*   **Avoid Inline Scripts and Styles (where possible):**
    *   **Strict CSP:** The previewer aims to enforce a strict Content Security Policy (CSP) which may block inline scripts (`<script>/* code */</script>`) and inline event handlers (`onclick="..."`).
    *   **Prefer External Files:** Link to external JavaScript (`.js`) and CSS (`.css`) files.
*   **Sanitize User Inputs:** If your lesson HTML involves processing any form of user input (even if it's just for client-side interaction), be mindful of Cross-Site Scripting (XSS) vulnerabilities. While the previewer's main purpose is display, any dynamic features within your HTML should be secure.
*   **Third-Party Content:** Be cautious when embedding content from third-party sources. Ensure they are reputable and use HTTPS.
*   **No Sensitive Operations:** Lesson HTML should not attempt to perform sensitive operations, access browser storage (cookies, localStorage) for unrelated purposes, or try to break out of the iframe. The `sandbox` attribute will restrict many of these.

---

## 3. Performance

Fast-loading lessons improve the user experience.

*   **Optimize Images:**
    *   Compress images using tools like TinyPNG or ImageOptim.
    *   Choose appropriate formats (JPEG for photos, PNG for graphics with transparency, SVG for vector graphics).
    *   Use responsive images (`<picture>` element or `srcset` attribute) if different sizes are needed for different devices (though this is less critical for fixed-width Moodle content).
*   **Minify HTML, CSS, and JavaScript:** Remove unnecessary characters (whitespace, comments) from your code to reduce file sizes. Tools are available for this.
*   **Lazy Load Offscreen Images/Content:** If a lesson page is very long, consider lazy loading images or content that are not immediately visible.
*   **Efficient CSS Selectors:** Avoid overly complex CSS selectors that can slow down rendering.
*   **Limit Use of Heavy JavaScript:** Only use JavaScript when necessary. Avoid large libraries if only a small piece of functionality is needed.

---

## 4. HTML Structure and Semantics

Well-structured HTML is easier to maintain, style, and make accessible.

*   **Valid HTML:** Ensure your HTML is valid. Use a validator (e.g., W3C Markup Validation Service).
*   **Logical Document Outline:** Use heading elements (`<h1>` to `<h6>`) hierarchically to create a logical structure for your content. An `<h1>` should generally be the main title of the lesson page.
*   **Use Semantic Elements:**
    *   `<article>` for self-contained content (e.g., a complete lesson section).
    *   `<section>` for thematic groupings of content.
    *   `<aside>` for tangentially related content (e.g., a sidebar note).
    *   `<nav>` for navigation links.
    *   `<figure>` and `<figcaption>` for images, diagrams, etc., that require a caption.
*   **Keep it Simple:** Avoid unnecessary `<div>` elements. Use semantic tags where possible.

---

## 5. Styling (CSS)

*   **External Stylesheets:** Link to external CSS files (`<link rel="stylesheet" href="styles.css">`). This is preferred over `<style>` blocks in the `<head>` or inline `style` attributes for better maintainability and CSP compliance.
*   **Class-Based Styling:** Prefer styling using classes rather than IDs for reusability.
*   **Avoid `!important`:** Use `!important` sparingly, as it can make CSS difficult to override and debug.
*   **Reset/Normalize:** Consider using a CSS reset or normalize stylesheet (like `normalize.css`) to create a consistent baseline across browsers, but be aware of Moodle's existing styling. Often, Moodle themes handle this.
*   **Units:** Use relative units (em, rem, %) for font sizes and spacing where appropriate to allow for better scalability and responsiveness.
*   **Moodle Theme Considerations:**
    *   Be aware that your HTML will eventually be rendered within a Moodle theme.
    *   Try to avoid overly specific styles that might conflict with the Moodle theme.
    *   Focus on styling the *content* itself, rather than trying to replicate a full page design. The previewer gives a basic container.

---

## 6. JavaScript (JS)

*   **External Scripts:** Link to external JavaScript files (`<script src="script.js"></script>`). Place script tags at the end of the `<body>` if they manipulate the DOM, or use `defer` or `async` attributes appropriately.
*   **CSP Compliance:**
    *   Avoid inline event handlers (e.g., `onclick="myFunction()"`). Instead, add event listeners using JavaScript: `element.addEventListener('click', myFunction);`
    *   Avoid `eval()` and `new Function()`.
*   **Graceful Degradation/Progressive Enhancement:** Ensure your content is usable even if JavaScript fails or is disabled (where feasible).
*   **Error Handling:** Implement basic error handling in your scripts.
*   **Scope:** Be mindful that your JavaScript will run within an `iframe`. Access to parent window properties will be restricted by the `sandbox` attribute.

---

## 7. Media (Images, Audio, Video)

*   **Relative Paths:** Use relative paths for your media assets (e.g., `images/my-image.png`). Assume that the HTML file and its assets will be in a directory structure that you define.
*   **Supported Formats:** Use web-standard formats (JPEG, PNG, GIF, SVG for images; MP3, AAC for audio; MP4 for video).
*   **Accessibility:**
    *   Provide `alt` text for images.
    *   Provide transcripts and/or captions for audio and video.
    *   Ensure media players are keyboard accessible. HTML5 `<audio>` and `<video>` elements have built-in controls that are generally accessible.
*   **Autoplay:** Avoid autoplaying audio or video, as it can be disruptive. If essential, provide clear controls to stop it.

---

## 8. Moodle-Specific Considerations

While the previewer is a standalone tool, keep the ultimate Moodle environment in mind.

*   **Content Focus:** The HTML file for a lesson "page" should primarily contain the *content* for that specific page. Moodle will handle the overall page structure, navigation, headers, footers, etc.
*   **Moodle Filters:** Moodle has various content filters (e.g., for multimedia, math notation). Your raw HTML might be processed by these filters. This previewer shows your *raw* HTML.
*   **File Paths in Moodle:** When you upload your lesson content to Moodle (often as a SCORM package or by embedding HTML), ensure your file paths for images, CSS, and JS are correct relative to how Moodle serves them. The previewer assumes a simple directory structure as defined in `content.json`.
*   **Plugin Interactions:** Be aware that Moodle plugins (e.g., H5P, specific question types) might have their own way of rendering content, which is outside the scope of this simple HTML previewer. This tool is for plain HTML/CSS/JS content primarily.

---

By following these best practices, you can create engaging, accessible, secure, and performant lesson content for the Learning Nugget Previewer and for Moodle itself. 