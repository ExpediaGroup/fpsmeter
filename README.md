# @vrbo/fpsmeter

[![NPM Version](https://img.shields.io/npm/v/@vrbo/fpsmeter.svg?style=flat-square)](https://www.npmjs.com/package/@vrbo/fpsmeter)
[![Build Status](https://travis-ci.org/expediagroup/fpsmeter.svg?branch=master)](https://travis-ci.org/expediagroup/fpsmeter)

Optimized javascript utility for measuring frames per second in a browser environment. Useful for observing end-user client run-time performance without adversly impacting performance.

## Installation

```bash
npm install --save @vrbo/fpsmeter
```

## Usage

Within your javascript files, import the component:

```javascript
import FPSMeter from '@vrbo/fpsmeter';
// Configure FPSMeter
const meter = new FPSMeter({
    calculatePerMs: 500, // calculation window for FPS
    onUpdate: (update) => {
        // update.fps - FPS of last window (per defined calculatePerMs option)
        // update.avgfps - FPS average since start()
    },
    onStop: (reason) {
        // reasons why FPSMeter can halt:
        // FPSMeter.stop() initiated by: user
        // FPSMeter.stop() initiated by: document visibilitychange event
        // FPSMeter.stop() initiated by: rAF timed out
        // FPSMeter.stop() initiated by: window blur event
    }
});
// Start
meter.start();
// Stop
meter.stop();
```

Example of collecting 10 FPS calculations of 500ms windows to add to client telemetry summary:

```javascript
import FPSMeter from '@vrbo/fpsmeter';
const meter = new FPSMeter({
    calculatePerMs: 500,
    maxCalculations: 10
});
meter.start();

function onSummarizeClientTelemetry() {
    let summary = {};
    // stop meter
    meter.stop();
    // collect fps windows into string attribute
    summary.fps = meter.fpsWindows.join(',');
    return summary;
}

setTimeout(() => {
    let summary = onSummarizeClientTelemetry();
    console.log(summary.fps); // prints "60,60,60,60,60,60,60,60,60,60" if perfect client performance
}, 10000);
```

\*\* Note: You may see less than 10 FPS measurements if FPSMeter stops for any reason (see below Caveat)

### Caveat: FPSMeter stops

When a user loses focus on the page for any reason, we need to halt the measure of FPS due to the browser engine no longer actively executing the internal API requestAnimationFrame which the FPSMeter library relies on, otherwise our FPS measurements will be skewed.

To mitigate this, FPSMeter will halt when either of the following three conditions occur:

-   FPSMeter.stop() initiated by: document visibilitychange event
-   FPSMeter.stop() initiated by: window blur event
-   FPSMeter.stop() initiated by: rAF timed out 1s (catch all)

This ensures that FPSMeter data is clean and comparable across page views.

To test this for yourself, try the demo link at the top of the page.

## Development

### Starting development harness

```bash
npm start
```

### Prettier

This projects supports auto-formatting of source code! Simply find your favorite IDE from the list in the following list: https://prettier.io/docs/en/editors.html

For VSCode support, perform the following steps:

-   Launch VS Code Quick Open (Ctrl+P)
-   Paste the following command, and press enter:

```
ext install esbenp.prettier-vscode
```
