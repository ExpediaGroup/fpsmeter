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

import chai, {expect} from 'chai';
import {spy, assert} from 'sinon';
import sinonChai from 'sinon-chai';

// APIs to test
import FPSMeter from '../../src/index';
const {JSDOM} = require('jsdom');

// Use sinon-chai bridge
chai.use(sinonChai);

describe('fpsmeter.js', () => {
    function setupWindow() {
        global.window = new JSDOM(require('../mocks/html.mock.js')).window;
        global.window.innerWidth = 1024;
        global.window.innerHeight = 768;
        global.document = global.window.document;
        global.window.requestAnimationFrame = global.requestAnimationFrame;
    }
    beforeEach(() => {
        let rafFns = [];
        global.requestAnimationFrame = (fn) => {
            rafFns.push(fn);
        };
        global.requestAnimationFrameTick = (timestamp = Date.now()) => {
            const batchRafRns = rafFns.slice();
            rafFns = [];
            for (let i = 0; i < batchRafRns.length; i++) {
                batchRafRns[i](timestamp);
            }
        };
        setupWindow();
    });

    describe('#start()', () => {
        it('Returns false if `start()` called multiple times', () => {
            const onUpdateSpy = spy();
            const meter = new FPSMeter({
                onUpdate: onUpdateSpy()
            });
            expect(meter.start()).to.equal(true);
            expect(meter.start()).to.equal(false);
        });

        it('Returns false if `window` or `window.requestAnimationFrame` are undefined', () => {
            const onUpdateSpy = spy();
            const meter = new FPSMeter({
                onUpdate: onUpdateSpy()
            });
            delete global.window;
            expect(meter.start()).to.equal(false);
            setupWindow();
            delete global.window.requestAnimationFrame;
            expect(meter.start()).to.equal(false);
            assert.calledOnce(onUpdateSpy);
        });

        it('Calls `onUpdate()` after `requestAnimationFrame` is called when the ms value specified in `calculatePerMs` has elapsed once.', (done) => {
            const onUpdateSpy = spy();
            const meter = new FPSMeter({
                onUpdate: onUpdateSpy,
                calculatePerMs: 25
            });
            const startResult = meter.start();

            expect(startResult).to.equal(true);
            global.requestAnimationFrameTick();
            setTimeout(() => {
                global.requestAnimationFrameTick();
                assert.calledOnce(onUpdateSpy);
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
            global.requestAnimationFrameTick();
            setTimeout(() => {
                global.requestAnimationFrameTick();
                expect(meter.avgfps).to.be.greaterThan(40);
                expect(meter.fpsWindows.length).to.equal(1);
                done();
            }, 17);
        });

        it('Calculates `warning` fps', (done) => {
            const meter = new FPSMeter({
                calculatePerMs: 10
            });
            meter.start();
            global.requestAnimationFrameTick();
            setTimeout(() => {
                global.requestAnimationFrameTick();
                expect(meter.avgfps)
                    .to.be.greaterThan(25)
                    .and.lessThan(40);
                expect(meter.fpsWindows.length).to.equal(1);
                done();
            }, 60);
        });

        it('Calculates `danger` fps', (done) => {
            const meter = new FPSMeter({
                calculatePerMs: 10
            });
            meter.start();
            global.requestAnimationFrameTick();
            setTimeout(() => {
                global.requestAnimationFrameTick();
                expect(meter.avgfps)
                    .to.be.greaterThan(7)
                    .and.lessThan(25);
                expect(meter.fpsWindows.length).to.equal(1);
                done();
            }, 160);
        });

        it('Calculates `dead` fps', (done) => {
            const meter = new FPSMeter({
                calculatePerMs: 10
            });
            meter.start();
            global.requestAnimationFrameTick();
            setTimeout(() => {
                global.requestAnimationFrameTick();
                expect(meter.avgfps).and.lessThan(7);
                expect(meter.fpsWindows.length).to.equal(1);
                done();
            }, 500);
        });
    });

    describe('#stop()', () => {
        it('does not increment `totalFrames` when calling `stop()`', () => {
            const meter = new FPSMeter();
            meter.start();
            global.requestAnimationFrameTick();
            expect(meter.totalFrames).to.equal(1);
            meter.stop();
            global.requestAnimationFrameTick();
            expect(meter.totalFrames).to.equal(1);
        });

        it('no-ops when calling `stop()` multiple times', () => {
            const meter = new FPSMeter();
            meter.start();
            global.requestAnimationFrameTick();
            expect(meter.totalFrames).to.equal(1);
            expect(meter.stop()).to.equal(true);
            expect(meter.stop()).to.equal(false);
        });

        it('stops measuring when user initiated', () => {
            const onStopSpy = spy();
            const meter = new FPSMeter({onStop: onStopSpy});
            meter.start();
            global.requestAnimationFrameTick();
            meter.stop();
            assert.calledWith(onStopSpy, 'user');
        });

        it('stops measuring when window blur event occurs', () => {
            const onStopSpy = spy();
            const meter = new FPSMeter({
                onStop: onStopSpy
            });
            meter.start();
            global.requestAnimationFrameTick();
            // eslint-disable-next-line no-undef
            global.window.dispatchEvent(new Event('blur'));
            assert.calledWith(onStopSpy, 'blur');
        });

        it('stops measuring when page visibility API invoked', () => {
            const onStopSpy = spy();
            const meter = new FPSMeter({
                onStop: onStopSpy
            });
            meter.start();
            global.requestAnimationFrameTick();
            // eslint-disable-next-line no-undef
            global.document.dispatchEvent(new Event('visibilitychange'));
            assert.calledWith(onStopSpy, 'visibilitychange');
        });

        it('stops measuring when rAF timeout occurs', (done) => {
            const onStopSpy = spy();
            const meter = new FPSMeter({
                onStop: onStopSpy,
                timeout: 50
            });
            meter.start();
            global.requestAnimationFrameTick();
            setTimeout(() => {
                assert.calledWith(onStopSpy, 'timeout');
                done();
            }, 100);
        });

        it('stops measuring if modern timestamps not supported', (done) => {
            const onStopSpy = spy();
            const meter = new FPSMeter({
                onStop: onStopSpy,
                timeout: 50
            });
            meter.start();
            global.requestAnimationFrameTick(null);
            setTimeout(() => {
                assert.calledWith(onStopSpy, 'not-supported');
                done();
            }, 100);
        });

        it('stops measuring if timestamps implemented with `Date.now()`', (done) => {
            const onStopSpy = spy();
            delete global.window.performance;
            global.window.performance = {
                now: Date.now.bind(null, Date)
            };
            const meter = new FPSMeter({
                onStop: onStopSpy,
                timeout: 500
            });
            meter.start();
            global.requestAnimationFrameTick();
            setTimeout(() => {
                assert.calledWith(onStopSpy, 'not-supported');
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
                    expect(meter.fpsWindows.length).to.equal(5);
                    expect(meter.stopReason).to.equal('completed');
                    return done();
                }
                global.requestAnimationFrameTick();
                setTimeout(() => {
                    tick(--counter);
                }, 10);
            }   
            tick(10);
        });
    });
});
