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

import React, {Component} from 'react';
import CarouselDemo from './carousel-demo';
import BoxesDemo from './boxes-demo';
import './harness.less';

import FPSMeter from '../../src/index.js';

const limits = {
    dead: 7,
    danger: 25,
    warn: 40
};

class UniversalHarness extends Component {
    state = {
        counter: 0,
        slowFnMultiplier: 0
    };

    running = true;

    componentDidMount() {
        this.fpsUI = window.document.createElement('div');
        window.document.body.appendChild(this.fpsUI);
        const meter = new FPSMeter({
            onStop: (reason) => {
                const message = `Reason FPSMeter stopped: ${reason}`;
                console.warn(message);
                this.fpsUI.innerHTML = message;
                this.fpsUI.className = 'fpsmeter dead';
                this.running = false;
            },
            onUpdate: ({fps, avgfps} = {}) => {
                let fpsstate = null;
                switch (false) {
                    case !(fps < limits.dead):
                        fpsstate = 'dead';
                        break;
                    case !(fps < limits.danger):
                        fpsstate = 'danger';
                        break;
                    case !(fps < limits.warn):
                        fpsstate = 'warn';
                        break;
                    case !(fps > 60):
                        fpsstate = 'invalid';
                        break;
                    default:
                        fpsstate = 'normal';
                        break;
                }
                this.fpsUI.innerHTML = `${fps}${this.calculatePad(
                    fps
                )}fps, ${avgfps}${this.calculatePad(
                    avgfps
                )}avgfps (${fpsstate})`;
                this.fpsUI.className = `fpsmeter ${fpsstate}`;
            },
            maxFps: 999
        });
        meter.start();
        this.doWork();
    }

    calculatePad(fps) {
        let i = 3 - `${fps}`.length;
        let pad = '';
        while (i > 0) {
            pad += '&nbsp;';
            i--;
        }
        return pad;
    }

    doWork = () => {
        if (!this.running) {
            return false;
        }
        this.slowFunction();
        if (this.getDemo() === 'boxes') {
            this.setState({
                counter: ++this.state.counter
            });
        }
        setTimeout(this.doWork, 10);
        return true;
    };

    slowFunction = () => {
        let result = 0;
        const multiplier = this.state.slowFnMultiplier || 0;
        for (let i = Math.pow(multiplier, 10); i >= 0; i--) {
            result += Math.atan(i) * Math.tan(i);
        }
        return result;
    };

    handleSlowFnMultiplierChange = (ev) => {
        const newValue = ev.target.value;
        this.setState({slowFnMultiplier: newValue});
    };

    getDemo() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('view') || 'carousel';
    }

    render() {
        let demo;
        switch (this.getDemo()) {
            case 'boxes':
                demo = <BoxesDemo counter={this.state.counter} />;
                break;
            case 'carousel':
                demo = <CarouselDemo />;
        }
        return (
            <div>
                <div className="render-controls">
                    <span>
                        Current Render Speed: {this.state.slowFnMultiplier}{' '}
                        &nbsp; (Higher number is slower) &nbsp;
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="6"
                        defaultValue="0"
                        step="1"
                        onChange={this.handleSlowFnMultiplierChange}
                    />
                </div>
                {demo}
            </div>
        );
    }
}

export default UniversalHarness;
