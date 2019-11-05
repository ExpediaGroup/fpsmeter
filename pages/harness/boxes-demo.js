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

export default class BoxesDemo extends Component {
    render() {
        let className = 'box';
        if (this.props.counter % 2 === 0) {
            className += ' alt';
        }
        const docWidth = window.document.body.getBoundingClientRect().width;
        const docHeight = window.innerHeight;
        const style = {
            left: this.props.counter % docWidth,
            top: docHeight / 2 - 10,
            transform: `rotate(${this.props.counter % 360}deg)`
        };
        const style2 = {
            ...style,
            left: style.left - 150,
            transform: `rotate(${(this.props.counter * 2) % 360}deg)`
        };
        const style3 = {
            ...style2,
            left: style2.left - 150,
            transform: `rotate(${(this.props.counter * 4) % 360}deg)`
        };
        return (
            <div>
                <div className={className} style={style}>
                    {`Testing: ${this.props.counter}`}
                </div>
                <div className={className} style={style2}>
                    {`Testing: ${this.props.counter}`}
                </div>
                <div className={className} style={style3}>
                    {`Testing: ${this.props.counter}`}
                </div>
            </div>
        );
    }
}
