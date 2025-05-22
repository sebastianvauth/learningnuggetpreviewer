// Unit tests for validateAndSanitizeContent in script.js

// Helper to simulate the console.warn and console.error to check if they are called
let mockConsoleWarnArgs = [];
let mockConsoleErrorArgs = [];
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

function setupMockConsole() {
    mockConsoleWarnArgs = [];
    mockConsoleErrorArgs = [];
    console.warn = (...args) => mockConsoleWarnArgs.push(args);
    console.error = (...args) => mockConsoleErrorArgs.push(args);
}

function teardownMockConsole() {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
}

function runTests() {
    let testsPassed = 0;
    let testsFailed = 0;
    const testResults = [];

    function assert(condition, message) {
        if (condition) {
            testsPassed++;
            testResults.push({ name: message, status: 'PASSED', details: '' });
        } else {
            testsFailed++;
            // Capture stack trace for better debugging
            let stack = '';
            try {
                throw new Error();
            } catch (e) {
                stack = e.stack;
            }
            testResults.push({ name: message, status: 'FAILED', details: stack });
            console.error("Assertion Failed:", message);
        }
    }

    function assertThrows(func, errorMessage, testMessage) {
        let thrown = false;
        try {
            func();
        } catch (e) {
            thrown = true;
            assert(e.message === errorMessage, testMessage + " (Correct error message)");
        }
        if (!thrown) {
            assert(false, testMessage + " (Expected error not thrown)");
        }
    }


    // --- Test Cases for validateAndSanitizeContent ---

    // Test 1: Valid full structure
    setupMockConsole();
    let validData = {
        learningPaths: [
            {
                id: "lp1", title: "Path 1", modules: [
                    {
                        id: "m1", title: "Module 1.1", lessons: [
                            { id: "l1", title: "Lesson 1.1.1", file: "l1.html" },
                            { id: "l2", title: "Lesson 1.1.2", file: "l2.html" }
                        ]
                    }
                ]
            }
        ]
    };
    let result = validateAndSanitizeContent(JSON.parse(JSON.stringify(validData))); // Deep copy
    assert(result.learningPaths.length === 1 && result.learningPaths[0].modules[0].lessons.length === 2, "Test 1: Valid full structure");
    assert(mockConsoleWarnArgs.length === 0, "Test 1: No warnings for valid data");
    teardownMockConsole();

    // Test 2: Missing learningPaths array
    setupMockConsole();
    assertThrows(() => validateAndSanitizeContent({}), "content.json structure is critically malformed.", "Test 2: Missing learningPaths array");
    assert(mockConsoleErrorArgs.length > 0 && mockConsoleErrorArgs[0][0].includes("CRITICAL: content.json is missing 'learningPaths' array"), "Test 2: Critical error logged for missing learningPaths");
    teardownMockConsole();

    // Test 3: Null learningPaths
    setupMockConsole();
    assertThrows(() => validateAndSanitizeContent({ learningPaths: null }), "content.json structure is critically malformed.", "Test 3: Null learningPaths");
    teardownMockConsole();


    // Test 4: Malformed learning path (missing id)
    setupMockConsole();
    let malformedPathData = {
        learningPaths: [
            { title: "Path 1", modules: [] }, // Missing id
            { id: "lp2", title: "Path 2", modules: [] }
        ]
    };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(malformedPathData)));
    assert(result.learningPaths.length === 1 && result.learningPaths[0].id === "lp2", "Test 4: Malformed learning path (missing id) is filtered");
    assert(mockConsoleWarnArgs.length === 1 && mockConsoleWarnArgs[0][0].includes("Skipping malformed learning path"), "Test 4: Warning for malformed path");
    teardownMockConsole();

    // Test 5: Malformed module (missing title)
    setupMockConsole();
    let malformedModuleData = {
        learningPaths: [
            {
                id: "lp1", title: "Path 1", modules: [
                    { id: "m1", lessons: [] }, // Missing title
                    { id: "m2", title: "Module 1.2", lessons: [] }
                ]
            }
        ]
    };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(malformedModuleData)));
    assert(result.learningPaths.length === 1, "Test 5: Path with malformed module is kept");
    assert(result.learningPaths[0].modules.length === 1 && result.learningPaths[0].modules[0].id === "m2", "Test 5: Malformed module (missing title) is filtered");
    assert(mockConsoleWarnArgs.length === 1 && mockConsoleWarnArgs[0][0].includes("Skipping malformed module"), "Test 5: Warning for malformed module");
    teardownMockConsole();

    // Test 6: Malformed lesson (missing file)
    setupMockConsole();
    let malformedLessonData = {
        learningPaths: [
            {
                id: "lp1", title: "Path 1", modules: [
                    {
                        id: "m1", title: "Module 1.1", lessons: [
                            { id: "l1", title: "Lesson 1.1.1" }, // Missing file
                            { id: "l2", title: "Lesson 1.1.2", file: "l2.html" }
                        ]
                    }
                ]
            }
        ]
    };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(malformedLessonData)));
    assert(result.learningPaths.length === 1, "Test 6: Path kept");
    assert(result.learningPaths[0].modules.length === 1, "Test 6: Module kept");
    assert(result.learningPaths[0].modules[0].lessons.length === 1 && result.learningPaths[0].modules[0].lessons[0].id === "l2", "Test 6: Malformed lesson (missing file) is filtered");
    assert(mockConsoleWarnArgs.length === 1 && mockConsoleWarnArgs[0][0].includes("Skipping malformed lesson"), "Test 6: Warning for malformed lesson");
    teardownMockConsole();

    // Test 7: Empty learningPaths array
    setupMockConsole();
    let emptyPathsData = { learningPaths: [] };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(emptyPathsData)));
    assert(result.learningPaths.length === 0, "Test 7: Empty learningPaths array");
    assert(mockConsoleWarnArgs.length === 0, "Test 7: No warnings for empty learningPaths");
    teardownMockConsole();

    // Test 8: Path with empty modules array
    setupMockConsole();
    let emptyModulesData = {
        learningPaths: [
            { id: "lp1", title: "Path 1", modules: [] }
        ]
    };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(emptyModulesData)));
    assert(result.learningPaths.length === 1 && result.learningPaths[0].modules.length === 0, "Test 8: Path with empty modules array");
    assert(mockConsoleWarnArgs.length === 0, "Test 8: No warnings for empty modules array");
    teardownMockConsole();

    // Test 9: Module with empty lessons array
    setupMockConsole();
    let emptyLessonsData = {
        learningPaths: [
            {
                id: "lp1", title: "Path 1", modules: [
                    { id: "m1", title: "Module 1.1", lessons: [] }
                ]
            }
        ]
    };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(emptyLessonsData)));
    assert(result.learningPaths.length === 1 && result.learningPaths[0].modules[0].lessons.length === 0, "Test 9: Module with empty lessons array");
    assert(mockConsoleWarnArgs.length === 0, "Test 9: No warnings for empty lessons array");
    teardownMockConsole();

    // Test 10: Mixed valid and invalid items
    setupMockConsole();
    let mixedData = {
        learningPaths: [
            { id: "lp1", title: "Path 1", modules: [ // Valid Path
                { id: "m1a", title: "Module 1.1a", lessons: [ {id: "l1a", title: "L1", file: "l1a.html"} ]},
                { id: "m1b", lessons: [] }, // Invalid Module (missing title)
                { id: "m1c", title: "Module 1.1c", lessons: [
                    { id: "l1c1", title: "L2", file: "l1c1.html"},
                    { id: "l1c2", file: "l1c2.html"} // Invalid Lesson (missing title)
                ]}
            ]},
            { title: "Path 2 Invalid", modules: []}, // Invalid Path (missing id)
            { id: "lp3", title: "Path 3", modules: [ // Valid Path
                { id: "m3a", title: "Module 3.1a", lessons: []}
            ]}
        ]
    };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(mixedData)));
    assert(result.learningPaths.length === 2, "Test 10: Filters invalid path (lp1, lp3 remain)");
    assert(result.learningPaths[0].id === "lp1", "Test 10: lp1 is first valid path");
    assert(result.learningPaths[0].modules.length === 2, "Test 10: lp1 has 2 valid modules (m1a, m1c)");
    assert(result.learningPaths[0].modules.find(m => m.id === 'm1a').lessons.length === 1, "Test 10: m1a has 1 lesson");
    assert(result.learningPaths[0].modules.find(m => m.id === 'm1c').lessons.length === 1, "Test 10: m1c has 1 valid lesson (l1c1)");
    assert(result.learningPaths[1].id === "lp3", "Test 10: lp3 is second valid path");
    assert(result.learningPaths[1].modules.length === 1, "Test 10: lp3 has 1 module");
    assert(mockConsoleWarnArgs.length === 3, "Test 10: Correct number of warnings (1 for path, 1 for module, 1 for lesson)");
    teardownMockConsole();

    // Test 11: Path with no valid modules (all modules are malformed)
    setupMockConsole();
    let pathWithNoValidModules = {
        learningPaths: [
            {
                id: "lp1", title: "Path 1", modules: [
                    { id: "m1", lessons: [] }, // Missing title
                    { title: "Module 1.2", lessons: [] } // Missing id
                ]
            },
            { id: "lp2", title: "Path 2", modules: [{id: "m2a", title: "M2A", lessons: []}] } // A valid path to ensure it's not all filtered
        ]
    };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(pathWithNoValidModules)));
    assert(result.learningPaths.length === 2, "Test 11: Both paths should be kept (lp1 even if its modules are gone)");
    assert(result.learningPaths.find(p => p.id === 'lp1').modules.length === 0, "Test 11: Path 1 has 0 valid modules");
    assert(result.learningPaths.find(p => p.id === 'lp2').modules.length === 1, "Test 11: Path 2 has 1 valid module");
    assert(mockConsoleWarnArgs.length === 2, "Test 11: Two warnings for the two malformed modules");
    teardownMockConsole();

    // Test 12: Module with no valid lessons (all lessons are malformed)
    setupMockConsole();
    let moduleWithNoValidLessons = {
        learningPaths: [
            {
                id: "lp1", title: "Path 1", modules: [
                    {
                        id: "m1", title: "Module 1", lessons: [
                            { id: "l1" }, // Missing title, file
                            { title: "Lesson B" } // Missing id, file
                        ]
                    },
                    { id: "m2", title: "Module 2", lessons: [{id:"l2a", title:"L2A", file:"l2a.html"}]} // Valid module
                ]
            }
        ]
    };
    result = validateAndSanitizeContent(JSON.parse(JSON.stringify(moduleWithNoValidLessons)));
    assert(result.learningPaths.length === 1, "Test 12: Path is kept");
    assert(result.learningPaths[0].modules.length === 2, "Test 12: Both modules kept (m1 even if its lessons are gone)");
    assert(result.learningPaths[0].modules.find(m => m.id === 'm1').lessons.length === 0, "Test 12: Module 1 has 0 valid lessons");
    assert(result.learningPaths[0].modules.find(m => m.id === 'm2').lessons.length === 1, "Test 12: Module 2 has 1 valid lesson");
    assert(mockConsoleWarnArgs.length === 2, "Test 12: Two warnings for the two malformed lessons");
    teardownMockConsole();

    // Test 13: Data is undefined
    setupMockConsole();
    assertThrows(() => validateAndSanitizeContent(undefined), "content.json structure is critically malformed.", "Test 13: Undefined data");
    assert(mockConsoleErrorArgs.length > 0 && mockConsoleErrorArgs[0][0].includes("CRITICAL: content.json is missing 'learningPaths' array"), "Test 13: Critical error logged for undefined data");
    teardownMockConsole();

    // Test 14: Data is null
    setupMockConsole();
    assertThrows(() => validateAndSanitizeContent(null), "content.json structure is critically malformed.", "Test 14: Null data");
    assert(mockConsoleErrorArgs.length > 0 && mockConsoleErrorArgs[0][0].includes("CRITICAL: content.json is missing 'learningPaths' array"), "Test 14: Critical error logged for null data");
    teardownMockConsole();

    // Test 15: learningPaths is not an array
    setupMockConsole();
    assertThrows(() => validateAndSanitizeContent({ learningPaths: "not-an-array" }), "content.json structure is critically malformed.", "Test 15: learningPaths is not an array");
    assert(mockConsoleErrorArgs.length > 0 && mockConsoleErrorArgs[0][0].includes("CRITICAL: content.json is missing 'learningPaths' array"), "Test 15: Critical error logged for non-array learningPaths");
    teardownMockConsole();


    // --- Report Results ---
    const summary = `Tests completed: ${testsPassed + testsFailed} | Passed: ${testsPassed} | Failed: ${testsFailed}`;
    console.log(summary);

    if (typeof document !== 'undefined') {
        const resultsDiv = document.getElementById('test-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = `<h3>${summary}</h3>`;
            const ul = document.createElement('ul');
            testResults.forEach(result => {
                const li = document.createElement('li');
                li.textContent = `${result.name}: ${result.status}`;
                li.className = result.status.toLowerCase();
                if (result.status === 'FAILED' && result.details) {
                    const pre = document.createElement('pre');
                    pre.textContent = result.details;
                    li.appendChild(pre);
                }
                ul.appendChild(li);
            });
            resultsDiv.appendChild(ul);
        }
    }
    return { passed: testsPassed, failed: testsFailed, results: testResults };
}

// If running in Node.js for some reason (e.g. future testing setup)
if (typeof module !== 'undefined' && module.exports) {
    // Need to load validateAndSanitizeContent if we were in Node
    // For now, this file is intended for browser test runner
    // const { validateAndSanitizeContent } = require('../script.js'); // This line would be needed for Node.js testing
    module.exports = { runTests };
} 