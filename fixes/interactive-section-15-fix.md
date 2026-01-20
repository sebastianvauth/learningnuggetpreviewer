# Fix: Interactive Simulator in Section 15

## Issue
The Look-Up Table (LUT) interactive simulator in Section 15 of the lesson "The 'Why' and 'How' of Modifying Pixels" was not working correctly. The following specific problems were identified:

1.  **Canvas API Compatibility**: The code used `ctx.roundRect`, which is a relatively new Canvas API (added in 2022) and is not supported in all browser versions. This likely caused a script error that prevented the interactive from initializing.
2.  **Animation Bug**: During the "highlighting" phase (Phase 2) of the animation, the data packet would disappear from the screen, making the visual flow confusing.
3.  **Alignment Issues**: The animation line and packet were vertically misaligned with the LUT array boxes, and the horizontal line did not correctly connect to the box edge.

## Solution
We applied the following fixes:

1.  **Polyfill for `roundRect`**: Added a robust polyfill at the beginning of the script to ensure compatibility with browsers that do not natively support `CanvasRenderingContext2D.prototype.roundRect`.
2.  **Animation Sequence Fix**: Updated the `drawAnimationStep` method to keep the input packet visible during the highlighting phase.
3.  **Coordinate Alignment**: 
    *   Adjusted `lutPos.y` from `this.lutY + 125` to `this.lutY + 195` to perfectly align with the center of the highlighted middle row.
    *   Corrected the Phase 2 line drawing to end at the edge of the LUT boxes (`this.animSequence.lutPos.x`).

## Result
The interactive simulator now works smoothly across a wider range of browsers, the animation sequence is visually complete, and all elements are correctly aligned.
