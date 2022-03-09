/**
 * @license
 * Copyright 2022 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {CoralDelegate} from './index';
import {loadTFLiteModel} from '@tensorflow/tfjs-tflite-node'
import {TFLiteModel} from '@tensorflow/tfjs-tflite-node/dist/tflite_model';
import * as fs from 'fs';
import * as tfnode from '@tensorflow/tfjs-node';
import {Tensor} from '@tensorflow/tfjs-core';

describe('coral delegate', () => {
  const modelPath = './test_model/mobilenet_v2_1.0_224_inat_bird_quant_edgetpu.tflite';
  let model: TFLiteModel;
  let parrot: Tensor;
  let labels: string[];

  beforeEach(async () => {
    model = await loadTFLiteModel(modelPath, {
      delegates: [new CoralDelegate()],
    });

    // Load the input image of a parrot.
    const parrotJpeg = fs.readFileSync('./test_model/parrot-small.jpg');
    parrot = tfnode.expandDims(tfnode.node.decodeJpeg(parrotJpeg), 0);
    labels = fs.readFileSync('./test_model/inat_bird_labels.txt', 'utf-8')
      .split('\n');
  });

  it('runs a coral model (will fail without coral device)', () => {
    const prediction = model.predict(parrot);
    const argmax = tfnode.argMax(prediction as Tensor, 1);
    const label = labels[argmax.dataSync()[0]];
    expect(label).toEqual('Ara macao (Scarlet Macaw)');
  });
});
