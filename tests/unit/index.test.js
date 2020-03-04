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

// APIs to test
import FPSMeter from '../../src/index';

describe('fpsmeter.js', () => {
    const window = global.window;

    function setupWindow() {
        document.body.innerHTML = `
            <body>
                <div class="content">
                    <p>Hellow World</p>
                </div>
            </body>
        `;
        window.innerWidth = 1024;
        window.innerHeight = 768;
    }
    beforeEach(() => {
        let rafFns = [];
        setupWindow();
        window.requestAnimationFrame = (fn) => {
            rafFns.push(fn);
        };
        window.requestAnimationFrameTick = (timestamp = Date.now()) => {
            const batchRafRns = rafFns.slice();
            rafFns = [];
            for (let i = 0; i < batchRafRns.length; i++) {
                batchRafRns[i](timestamp);
            }
        };
    });

    describe('#start()', () => {
        it('Returns false if `start()` called multiple times', () => {
            const onUpdateSpy = jest.fn();
            const meter = new FPSMeter({
                onUpdate: onUpdateSpy()
            });
            expect(meter.start()).toEqual(true);
            expect(meter.start()).toEqual(false);
        });

        it('Returns false if `window.requestAnimationFrame` are undefined', () => {
            const onUpdateSpy = jest.fn();
            const meter = new FPSMeter({
                onUpdate: onUpdateSpy
            });
            const oldRaf = global.window.requestAnimationFrame;
            delete global.window.requestAnimationFrame;
            expect(meter.start()).toEqual(false);
            expect(onUpdateSpy).toHaveBeenCalledTimes(0);
            global.window.requestAnimationFrame = oldRaf;
        });

        it('Calls `onUpdate()` after `requestAnimationFrame` is called when the ms value specified in `calculatePerMs` has elapsed once.', (done) => {
            const onUpdateSpy = jest.fn();
            const meter = new FPSMeter({
                onUpdate: onUpdateSpy,
                calculatePerMs: 25
            });
            const startResult = meter.start();

            expect(startResult).toEqual(true);
            window.requestAnimationFrameTick();
            setTimeout(() => {
                window.requestAnimationFrameTick();
                expect(onUpdateSpy).toHaveBeenCalledTimes(1);
                meter.stop();
                meter.reset();
                done();
            }, 30);
        });

        it('Calculates `normal` fps', (done) => {
            const meter = new FPSMeter({
                calculatePerMs: 10
            });
            meter.start();
            window.requestAnimationFrameTick();
            setTimeout(() => {
                window.requestAnimationFrameTick();
                expect(meter.avgfps).toBeGreaterThan(40);
                expect(meter.fpsWindows.length).toEqual(1);
                done();
            }, 17);
        });

        it('Calculates `warning` fps', (done) => {
            const meter = new FPSMeter({
                calculatePerMs: 10
            });
            meter.start();
            window.requestAnimationFrameTick();
            setTimeout(() => {
                window.requestAnimationFrameTick();
                expect(meter.avgfps).toBeGreaterThanOrEqual(25);
                expect(meter.avgfps).toBeLessThan(40);
                expect(meter.fpsWindows.length).toEqual(1);
                done();
            }, 60);
        });

        it('Calculates `danger` fps', (done) => {
            const meter = new FPSMeter({
                calculatePerMs: 10
            });
            meter.start();
            window.requestAnimationFrameTick();
            setTimeout(() => {
                window.requestAnimationFrameTick();
                expect(meter.avgfps).toBeGreaterThan(7);
                expect(meter.avgfps).toBeLessThan(25);
                expect(meter.fpsWindows.length).toEqual(1);
                done();
            }, 160);
        });

        it('Calculates `dead` fps', (done) => {
            const meter = new FPSMeter({
                calculatePerMs: 10
            });
            meter.start();
            window.requestAnimationFrameTick();
            setTimeout(() => {
                window.requestAnimationFrameTick();
                expect(meter.avgfps).toBeLessThan(7);
                expect(meter.fpsWindows.length).toEqual(1);
                done();
            }, 500);
        });
    });

    describe('#stop()', () => {
        it('does not increment `totalFrames` when calling `stop()`', () => {
            const meter = new FPSMeter();
            meter.start();
            window.requestAnimationFrameTick();
            expect(meter.totalFrames).toEqual(1);
            meter.stop();
            window.requestAnimationFrameTick();
            expect(meter.totalFrames).toEqual(1);
        });

        it('no-ops when calling `stop()` multiple times', () => {
            const meter = new FPSMeter();
            meter.start();
            window.requestAnimationFrameTick();
            expect(meter.totalFrames).toEqual(1);
            expect(meter.stop()).toEqual(true);
            expect(meter.stop()).toEqual(false);
        });

        it('stops measuring when user initiated', () => {
            const onStopSpy = jest.fn();
            const meter = new FPSMeter({onStop: onStopSpy});
            meter.start();
            window.requestAnimationFrameTick();
            meter.stop();
            expect(onStopSpy).toHaveBeenCalledWith('user');
        });

        it('stops measuring when window blur event occurs', () => {
            const onStopSpy = jest.fn();
            const meter = new FPSMeter({
                onStop: onStopSpy
            });
            meter.start();
            window.requestAnimationFrameTick();
            // eslint-disable-next-line no-undef
            global.window.dispatchEvent(new Event('blur'));
            expect(onStopSpy).toHaveBeenCalledWith('blur');
        });

        it('stops measuring when page visibility API invoked', () => {
            const onStopSpy = jest.fn();
            const meter = new FPSMeter({
                onStop: onStopSpy
            });
            meter.start();
            window.requestAnimationFrameTick();
            // eslint-disable-next-line no-undef
            global.document.dispatchEvent(new Event('visibilitychange'));
            expect(onStopSpy).toHaveBeenCalledWith('visibilitychange');
        });

        it('stops measuring when rAF timeout occurs', (done) => {
            const onStopSpy = jest.fn();
            const meter = new FPSMeter({
                onStop: onStopSpy,
                timeout: 50
            });
            meter.start();
            window.requestAnimationFrameTick();
            setTimeout(() => {
                expect(onStopSpy).toHaveBeenCalledWith('timeout');
                done();
            }, 100);
        });

        it('stops measuring if modern timestamps not supported', (done) => {
            const onStopSpy = jest.fn();
            const meter = new FPSMeter({
                onStop: onStopSpy,
                timeout: 50
            });
            meter.start();
            window.requestAnimationFrameTick(null);
            setTimeout(() => {
                expect(onStopSpy).toHaveBeenCalledWith('not-supported');
                done();
            }, 100);
        });

        it('stops measuring if timestamps implemented with `Date.now()`', (done) => {
            const onStopSpy = jest.fn();
            const performanceAPI = global.window.performance;
            delete global.window.performance;
            global.window.performance = {
                now: Date.now.bind(null, Date)
            };
            const meter = new FPSMeter({
                onStop: onStopSpy,
                timeout: 500
            });
            meter.start();
            window.requestAnimationFrameTick();
            setTimeout(() => {
                expect(onStopSpy).toHaveBeenCalledWith('not-supported');
                global.window.performance = performanceAPI;
                done();
            }, 50);
        });

        it('stops measuring when `maxCalculations` are exceeded', (done) => {
            const meter = new FPSMeter({
                calculatePerMs: 1,
                maxCalculations: 5
            });
            meter.start();
            function tick(counter) {
                if (counter === 0) {
                    // assert test
                    expect(meter.fpsWindows.length).toEqual(5);
                    expect(meter.stopReason).toEqual('completed');
                    return done();
                }
                window.requestAnimationFrameTick();
                setTimeout(() => {
                    tick(--counter);
                }, 10);
            }
            tick(10);
        });
    });
});
