// ES6 Module
console.log("Learning Nugget Previewer script loaded.");

function validateAndSanitizeContent(data) {
    if (!data || !Array.isArray(data.learningPaths)) {
        console.error("CRITICAL: content.json is missing 'learningPaths' array or is malformed.");
        throw new Error("content.json structure is critically malformed.");
    }

    data.learningPaths = data.learningPaths.filter(path => {
        if (!path || typeof path.id !== 'string' || typeof path.title !== 'string' || !Array.isArray(path.modules)) {
            console.warn("Skipping malformed learning path (missing id, title, or modules array):", path);
            return false;
        }

        path.modules = path.modules.filter(module => {
            if (!module || typeof module.id !== 'string' || typeof module.title !== 'string' || !Array.isArray(module.lessons)) {
                console.warn(`Skipping malformed module (missing id, title, or lessons array) in path '${path.id}':`, module);
                return false;
            }

            module.lessons = module.lessons.filter(lesson => {
                if (!lesson || typeof lesson.id !== 'string' || typeof lesson.title !== 'string' || typeof lesson.file !== 'string') {
                    console.warn(`Skipping malformed lesson (missing id, title, or file) in module '${module.id}', path '${path.id}':`, lesson);
                    return false;
                }
                return true;
            });
            return true; // Keep module if it's valid (even if some lessons were filtered)
        });
        return true; // Keep path if it's valid (even if some modules were filtered)
    });
    return data;
}

let courseData = null; // To store the loaded and validated course content
let currentRoute = {
    pathId: null,
    moduleId: null,
    lessonId: null,
    data: null // Will store current view's data
};

function parseHash() {
    const hash = window.location.hash.substring(1); // Remove #
    const parts = hash.split('/').filter(p => p); // Split and remove empty parts

    currentRoute.pathId = parts[0] || null;
    currentRoute.moduleId = parts[1] || null;
    currentRoute.lessonId = parts[2] || null;

    console.log('Route changed:', currentRoute);
    renderCurrentView(); // We'll implement this later to update the UI
}

function renderLearningPathsView(paths) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering learning paths.");
        return;
    }

    mainElement.innerHTML = ''; // Clear previous content

    const listTitle = document.createElement('h2');
    listTitle.textContent = 'Available Learning Paths';
    listTitle.className = 'view-title'; // For styling
    mainElement.appendChild(listTitle);

    const courseGrid = document.createElement('div');
    courseGrid.className = 'course-grid'; // Use existing style

    if (!paths || paths.length === 0) {
        courseGrid.innerHTML = '<p>No learning paths available.</p>';
        mainElement.appendChild(courseGrid);
        return;
    }

    paths.forEach(path => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.tabIndex = 0; // Make it keyboard focusable
        card.setAttribute('role', 'link'); // Semantically a link to the path view
        card.setAttribute('aria-label', `View ${path.title} learning path`);
        card.dataset.pathId = path.id; // Store id for click handler

        // Event listener for click
        card.addEventListener('click', () => {
            navigateToPath(path.id);
        });

        // Event listener for keydown (Enter and Space)
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Prevent default space scroll, etc.
                navigateToPath(path.id);
            }
        });

        if (path.icon) {
            const iconImg = document.createElement('img');
            iconImg.src = path.icon;
            // PRD: "Icons conveying information must have appropriate text alternatives..."
            // For decorative icons, alt="". If conveying info, should be descriptive.
            // Assuming icons here are somewhat decorative but relate to title.
            iconImg.alt = path.title; // Or a more generic "Icon for ${path.title}"
            card.appendChild(iconImg);
        }

        const title = document.createElement('h3');
        title.textContent = path.title;
        card.appendChild(title);

        if (path.description) {
            const description = document.createElement('p');
            description.textContent = path.description;
            card.appendChild(description);
        }
        
        // We'll add click/keydown listeners in IN01 to navigate
        courseGrid.appendChild(card);
    });

    mainElement.appendChild(courseGrid);
    // Focus management: focus the first card if available
    const firstCard = courseGrid.querySelector('.course-card');
    if (firstCard) {
        firstCard.focus();
    }
}

function renderModulesView(path) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering modules.");
        return;
    }
    mainElement.innerHTML = ''; // Clear previous content

    const viewTitle = document.createElement('h2');
    viewTitle.textContent = `Modules in: ${path.title}`;
    viewTitle.className = 'view-title';
    mainElement.appendChild(viewTitle);

    // Breadcrumb (simple version for now)
    const breadcrumb = document.createElement('nav');
    breadcrumb.setAttribute('aria-label', 'Breadcrumb');
    breadcrumb.innerHTML = `<a href="#/">Learning Paths</a> > <span>${path.title}</span>`;
    mainElement.appendChild(breadcrumb);

    const moduleGrid = document.createElement('div');
    moduleGrid.className = 'course-grid'; // Reuse styles

    if (!path.modules || path.modules.length === 0) {
        moduleGrid.innerHTML = '<p>No modules available in this learning path.</p>';
        mainElement.appendChild(moduleGrid);
        return;
    }

    path.modules.forEach(module => {
        const card = document.createElement('div');
        card.className = 'course-card'; // Reuse styles
        card.tabIndex = 0;
        card.setAttribute('role', 'link');
        card.setAttribute('aria-label', `View ${module.title} module`);
        card.dataset.pathId = path.id; // For context if needed by click handler
        card.dataset.moduleId = module.id;

        // Event listener for click
        card.addEventListener('click', () => {
            navigateToModule(path.id, module.id);
        });

        // Event listener for keydown (Enter and Space)
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigateToModule(path.id, module.id);
            }
        });

        if (module.icon) {
            const iconImg = document.createElement('img');
            iconImg.src = module.icon;
            iconImg.alt = module.title; // Or more descriptive if needed
            card.appendChild(iconImg);
        }

        const title = document.createElement('h3');
        title.textContent = module.title;
        card.appendChild(title);

        // Modules in the example content.json don't have descriptions, but PRD implies they can.
        // if (module.description) { 
        //     const description = document.createElement('p');
        //     description.textContent = module.description;
        //     card.appendChild(description);
        // }

        moduleGrid.appendChild(card);
    });

    mainElement.appendChild(moduleGrid);
    const firstModuleCard = moduleGrid.querySelector('.course-card');
    if (firstModuleCard) {
        firstModuleCard.focus();
    }
}

function renderModuleLessonsView(path, module) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering lesson progression.");
        return;
    }
    mainElement.innerHTML = ''; // Clear previous content

    const viewTitle = document.createElement('h2');
    viewTitle.textContent = `Lessons in: ${module.title}`;
    viewTitle.className = 'view-title';
    mainElement.appendChild(viewTitle);

    // Breadcrumb
    const breadcrumb = document.createElement('nav');
    breadcrumb.setAttribute('aria-label', 'Breadcrumb');
    breadcrumb.innerHTML = `<a href="#/">Learning Paths</a> > <a href="#/${path.id}">${path.title}</a> > <span>${module.title}</span>`;
    mainElement.appendChild(breadcrumb);

    // Module Overview Panel (PRD)
    const moduleOverview = document.createElement('div');
    moduleOverview.className = 'module-overview-panel';
    let overviewHTML = '';
    if (module.icon) {
        overviewHTML += `<img src="${module.icon}" alt="${module.title}" class="module-overview-icon">`;
    }
    overviewHTML += `<h3>${module.title}</h3>`;
    // if (module.description) { // Add if modules get descriptions
    //     overviewHTML += `<p>${module.description}</p>`;
    // }
    moduleOverview.innerHTML = overviewHTML;
    mainElement.appendChild(moduleOverview);

    const lessonsContainer = document.createElement('div');
    lessonsContainer.className = 'lesson-progression-container';

    if (!module.lessons || module.lessons.length === 0) {
        lessonsContainer.innerHTML = '<p>No lessons available in this module.</p>';
        mainElement.appendChild(lessonsContainer);
        return;
    }

    // Group lessons by level
    const lessonsByLevel = module.lessons.reduce((acc, lesson) => {
        const level = lesson.level || 'Default Level';
        if (!acc[level]) {
            acc[level] = [];
        }
        acc[level].push(lesson);
        return acc;
    }, {});

    const levels = Object.keys(lessonsByLevel).sort(); // Sort levels if needed

    levels.forEach(levelName => {
        const levelHeading = document.createElement('h4');
        levelHeading.textContent = levelName;
        levelHeading.className = 'lesson-level-heading';
        lessonsContainer.appendChild(levelHeading);

        const lessonList = document.createElement('ol'); // Ordered list for progression
        lessonList.className = 'lesson-progression-list';

        lessonsByLevel[levelName].forEach(lesson => {
            const listItem = document.createElement('li');
            listItem.className = 'lesson-progression-item';
            listItem.tabIndex = 0;
            listItem.setAttribute('role', 'link');
            listItem.setAttribute('aria-label', `View lesson: ${lesson.title}`);
            listItem.dataset.pathId = path.id;
            listItem.dataset.moduleId = module.id;
            listItem.dataset.lessonId = lesson.id;

            // Event listener for click
            listItem.addEventListener('click', () => {
                navigateToLesson(path.id, module.id, lesson.id);
            });

            // Event listener for keydown (Enter and Space)
            listItem.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigateToLesson(path.id, module.id, lesson.id);
                }
            });

            listItem.textContent = lesson.title;

            if (lesson.id === currentRoute.lessonId) {
                listItem.setAttribute('aria-current', 'true');
                listItem.classList.add('active-lesson');
            }
            lessonList.appendChild(listItem);
        });
        lessonsContainer.appendChild(lessonList);
    });
    
    mainElement.appendChild(lessonsContainer);

    // Focus management: focus the active lesson, or the first lesson if no active one
    let focusableItem = lessonsContainer.querySelector('.lesson-progression-item.active-lesson');
    if (!focusableItem) {
        focusableItem = lessonsContainer.querySelector('.lesson-progression-item');
    }
    if (focusableItem) {
        focusableItem.focus();
    }
    
    // Placeholder for where the iframe with lesson content will go (Task UI05)
    const lessonContentFrame = document.createElement('div');
    lessonContentFrame.id = 'lesson-content-frame';
    lessonContentFrame.setAttribute('aria-live', 'polite'); // For loading messages
    
    if (currentRoute.lessonId) {
         const selectedLesson = module.lessons.find(l => l.id === currentRoute.lessonId);
         if(selectedLesson){
            loadLessonInIframe(path, module, selectedLesson);
         } else {
            // This case should ideally not be reached if routing/data is correct
            // and content.json is validated. But as a fallback:
            lessonContentFrame.innerHTML = '<p class="error-message">Selected lesson not found. Please check the URL or select a lesson from the list.</p>';
         }
    } else {
        lessonContentFrame.innerHTML = '<p>Select a lesson to view its content.</p>';
    }
    mainElement.appendChild(lessonContentFrame);

    // Add Lesson Navigation Buttons (IN04)
    const navButtonsContainer = document.createElement('div');
    navButtonsContainer.className = 'lesson-navigation-buttons';

    let currentLessonIndex = -1;
    if (currentRoute.lessonId && module.lessons) {
        currentLessonIndex = module.lessons.findIndex(l => l.id === currentRoute.lessonId);
    }

    // Previous Lesson Button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous Lesson';
    prevButton.className = 'btn-lesson-nav';
    if (currentLessonIndex > 0) {
        const prevLesson = module.lessons[currentLessonIndex - 1];
        prevButton.addEventListener('click', () => {
            navigateToLesson(path.id, module.id, prevLesson.id);
        });
    } else {
        prevButton.disabled = true;
    }
    navButtonsContainer.appendChild(prevButton);

    // Next Lesson Button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next Lesson';
    nextButton.className = 'btn-lesson-nav';
    if (currentLessonIndex !== -1 && currentLessonIndex < module.lessons.length - 1) {
        const nextLesson = module.lessons[currentLessonIndex + 1];
        nextButton.addEventListener('click', () => {
            navigateToLesson(path.id, module.id, nextLesson.id);
        });
    } else {
        nextButton.disabled = true;
    }
    navButtonsContainer.appendChild(nextButton);
    
    // Insert nav buttons after the lesson content frame, or adjust as needed
    if (lessonContentFrame.parentNode) { // Ensure lessonContentFrame is in DOM
        lessonContentFrame.parentNode.insertBefore(navButtonsContainer, lessonContentFrame.nextSibling);
    } else {
        mainElement.appendChild(navButtonsContainer); // Fallback if frame not yet appended (should not happen)
    }
}

function renderCurrentView() {
    console.log("Attempting to render view for:", currentRoute);
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering.");
        return;
    }

    if (!courseData) {
        console.log("Course data not loaded yet. Cannot render view.");
        // Optionally, display a global loading state here if not handled by error/initial load message
        // mainElement.innerHTML = '<p>Loading course content...</p>';
        return;
    }

    // Clear previous content before rendering new view
    mainElement.innerHTML = '<!-- Content will be dynamically injected here -->'; 

    if (currentRoute.pathId) {
        const path = courseData.learningPaths.find(p => p.id === currentRoute.pathId);
        if (path) {
            if (currentRoute.moduleId) {
                const module = path.modules.find(m => m.id === currentRoute.moduleId);
                if (module) {
                    if (currentRoute.lessonId) {
                        const lesson = module.lessons.find(l => l.id === currentRoute.lessonId);
                        if (lesson) {
                            // renderLessonView(path, module, lesson);
                            // mainElement.innerHTML = `<h1>Lesson: ${lesson.title}</h1><p>(Lesson content for ${currentRoute.lessonId} will be in an iframe)</p>`;
                            renderModuleLessonsView(path, module); // Display lesson list, highlight current
                        } else {
                            // If lessonId in hash is invalid, still show the module's lesson list
                            console.warn(`Lesson ID '${currentRoute.lessonId}' in hash not found. Displaying module view.`);
                            renderModuleLessonsView(path, module);
                        }
                    } else {
                        // No lessonId in hash, just show the module's lesson list
                        renderModuleLessonsView(path, module);
                    }
                } else {
                    displayError(`Module with ID '${currentRoute.moduleId}' not found in path '${currentRoute.pathId}'.`);
                    renderLearningPathsView(courseData.learningPaths); // Go back to home
                }
            } else {
                // renderPathDetailView(path); // Or just the modules for that path
                // mainElement.innerHTML = `<h1>Learning Path: ${path.title}</h1><p>(Modules for ${currentRoute.pathId} will be listed here)</p>`;
                renderModulesView(path);
            }
        } else {
            displayError(`Learning Path with ID '${currentRoute.pathId}' not found.`);
            // Optionally, redirect to home or show learning paths again
            renderLearningPathsView(courseData.learningPaths);
        }
    } else {
        // Home view: Display all learning paths
        renderLearningPathsView(courseData.learningPaths);
    }
}

// Navigation functions to update the hash
function navigateToPath(pathId) {
    window.location.hash = `/${pathId}`;
}

function navigateToModule(pathId, moduleId) {
    window.location.hash = `/${pathId}/${moduleId}`;
}

function navigateToLesson(pathId, moduleId, lessonId) {
    window.location.hash = `/${pathId}/${moduleId}/${lessonId}`;
}

// Placeholder for function that will load lesson content into an iframe
function loadLessonInIframe(path, module, lesson) {
    const frameContainer = document.getElementById('lesson-content-frame');
    if (!frameContainer) {
        console.error("Lesson content frame container not found!");
        return;
    }

    // Show loading indicator
    frameContainer.innerHTML = '<p class="loading-indicator">Loading lesson content...</p>';

    // Construct the lesson file path
    const lessonFilePath = `course_content/${path.folder}/${module.folder}/${lesson.file}`;
    console.log(`Loading lesson from: ${lessonFilePath}`);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', `Lesson content: ${lesson.title}`);
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '500px'); // Adjust as needed, or control via CSS
    iframe.style.border = 'none';
    
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms');
    iframe.setAttribute('csp', "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; form-action 'self'; object-src 'none'; media-src 'self';");
    iframe.setAttribute('allow', "fullscreen 'self'; geolocation 'none'; microphone 'none'; camera 'none'; payment 'none'; usb 'none'; vr 'none'; accelerometer 'none'; ambient-light-sensor 'none'; autoplay 'none'; encrypted-media 'none'; gyroscope 'none'; magnetometer 'none'; midi 'none'; picture-in-picture 'none';");

    iframe.src = lessonFilePath;
    
    iframe.onload = () => {
        console.log(`Iframe loaded successfully: ${lessonFilePath}`);
        frameContainer.innerHTML = ''; // Clear loading indicator
        frameContainer.appendChild(iframe); // Add the loaded iframe
    };
    iframe.onerror = () => {
        console.error(`Error loading lesson into iframe: ${lessonFilePath}`);
        frameContainer.innerHTML = `<p class="error-message">Error: Could not load lesson '${lesson.title}'. Please check the file path and ensure the lesson content exists.</p>`;
        const errorMsgDiv = frameContainer.querySelector('.error-message');
        if(errorMsgDiv) {
            errorMsgDiv.tabIndex = -1;
            errorMsgDiv.focus();
        }
    };

    // Don't append iframe immediately, wait for onload or onerror
    // frameContainer.appendChild(iframe); 
}

window.addEventListener('hashchange', parseHash);
// Initial parse and render on page load
// We need to ensure loadContent has finished and courseData is available before initial render based on hash.
// So, the initial parseHash and renderCurrentView will be called at the end of loadContent.

async function loadContent() {
    try {
        const response = await fetch('content.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - Could not fetch content.json`);
        }
        let data = await response.json();
        console.log('Raw content loaded:', data);

        data = validateAndSanitizeContent(data);
        console.log('Validated and sanitized content:', data);
        courseData = data; // Store the data globally
        
        // Clear any previous error messages if content is now successfully loaded and validated
        const mainElement = document.querySelector('main');
        if (mainElement && mainElement.querySelector('.error-message')) {
            mainElement.innerHTML = '<!-- Content will be dynamically injected here -->'; 
        }

        // Initial route parsing and rendering after content is loaded
        parseHash(); 

    } catch (error) {
        console.error('Error loading or validating content:', error);
        displayError(`Error loading or processing course content: ${error.message}. Please check content.json and reload.`);
    }
}

function displayError(message) {
    const mainElement = document.querySelector('main');
    if (mainElement) {
        let errorDiv = mainElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
        } else {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.setAttribute('aria-live', 'assertive');
            errorDiv.setAttribute('tabindex', '-1'); // Make it focusable
            errorDiv.textContent = message;
            mainElement.innerHTML = ''; // Clear previous content before adding error
            mainElement.appendChild(errorDiv);
        }
        errorDiv.focus(); // Set focus to the error message
    } else {
        console.error("Could not find main element to display error.");
    }
}

loadContent(); // This will also trigger the initial parseHash and renderCurrentView via its success path.

export {}; // Ensures this file is treated as a module 