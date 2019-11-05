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
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import {Carousel} from 'react-responsive-carousel';

const images = [
    require('./image-1.jpg'),
    require('./image-2.jpg'),
    require('./image-3.jpg'),
    require('./image-4.jpg'),
    require('./image-5.jpg'),
    require('./image-6.jpg'),
    require('./image-7.jpg'),
    require('./image-8.jpg'),
    require('./image-9.jpg'),
    require('./image-10.jpg')
];

export default class DemoCarousel extends Component {
    render() {
        return (
            <Carousel autoPlay={true} interval={1000} infiniteLoop={true}>
                {images.map((image, index) => {
                    return (
                        <div key={index}>
                            <img src={image} />
                            <p className="legend">{index}</p>
                        </div>
                    );
                })}
            </Carousel>
        );
    }
}
