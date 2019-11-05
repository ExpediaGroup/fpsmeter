// Copyright 2019 Expedia Group, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export default class FPSMeter {
    constructor({
        onUpdate = () => {},
        onStop = () => {},
        maxFps = 60,
        maxCalculations = null,
        calculatePerMs = 500,
        timeout = 1000
    } = {}) {
        this.calculatePerMs = calculatePerMs;
        this.fpsWindows = [];
        this.maxFps = maxFps;
        this.maxCalculations = maxCalculations;
        this.onStop = onStop;
        this.onUpdate = onUpdate;
        this.timeout = timeout;
        this.stopReason = '';
        this.hasSafeNow = (function(w) {
            const k = 'performance';
            const result = k in w && w[k].now && Date.now() !== w[k].now();
            return result;
        })(window);
    }

    calcfps = (frames, elapsedMs) => {
        return Math.min(parseInt(1000 * (frames / elapsedMs), 10), this.maxFps);
    };

    tick = (timestamp) => {
        if (this.isRunning === false) {
            return false;
        }
        if (!timestamp || !this.hasSafeNow) {
            return this.stop('not-supported');
        }
        if (!this.beginTime) {
            this.beginTime = timestamp;
        }
        if (!this.prevTime) {
            this.prevTime = timestamp;
        }
        const diff = timestamp - this.prevTime;
        this.incFrames++;
        this.totalFrames++;
        if (diff > this.calculatePerMs) {
            // Calculate FPS from previous frame (max 60)
            this.fps = this.calcfps(this.incFrames, diff);
            // Calculate FPS across all frames (max 60)
            this.avgfps = this.calcfps(
                this.totalFrames,
                timestamp - this.beginTime
            );
            // Reset local instances vars
            this.prevTime = timestamp;
            this.incFrames = 0;
            // invoke user callback
            this.publishUpdate();
        }
        if (this.rafTimeout) {
            clearTimeout(this.rafTimeout);
        }
        // Set a timeout for configured `this.timeout` value (defaults to 1s) to expect at least one rAF update
        // Reason why we need to do this is to detect if a user has navigated away from a page
        this.rafTimeout = setTimeout(() => {
            this.stop('timeout');
        }, this.timeout);

        window.requestAnimationFrame(this.tick);
        return true;
    };

    publishUpdate() {
        this.fpsWindows.push(this.fps);
        this.onUpdate({
            fps: this.fps,
            avgfps: this.avgfps
        });
        // stop meter if `this.maxCalculations` is exceeded
        if (this.maxCalculations && this.fpsWindows.length >= this.maxCalculations) {
            this.stop('completed');
        }
    }

    start() {
        if (this.isRunning === true) {
            return false; // no-op
        }
        this.reset();
        // If `window` is undefined, or `requestAnimationFrame` is not available in window scope,
        // mutate to an invalid state, publish invalid update, and return `false`
        if (typeof window !== 'object' || !window.requestAnimationFrame) {
            return false;
        }
        this.isRunning = true;

        this.visibilityListener = document.addEventListener(
            'visibilitychange',
            () => {
                this.stop('visibilitychange');
            }
        );
        this.blurFPSListener = window.addEventListener('blur', () => {
            this.stop('blur');
        });

        window.requestAnimationFrame(this.tick);

        return true;
    }

    stop(reason = 'user') {
        if (this.isRunning === false) {
            return false; // no-op
        }
        window.removeEventListener('visibilitychange', this.visibilityListener);
        window.removeEventListener('blur', this.blurFPSListener);
        if (reason !== 'timeout') {
            clearTimeout(this.rafTimeout);
        }
        this.isRunning = false;
        this.stopReason = reason;
        this.onStop(reason);
        return true;
    }

    reset() {
        this.fpsWindows = [];
        this.fps = 0;
        this.avgfps = 0;
        this.totalFrames = 0;
        this.incFrames = 0;
        this.beginTime = 0;
        this.prevTime = 0;
        this.stopReason = '';
    }
}

/* istanbul ignore next */
if (typeof window !== 'undefined') {
    window.FPSMeter = FPSMeter;
}
