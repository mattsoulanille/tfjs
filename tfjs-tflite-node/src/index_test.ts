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

import {TFLiteNodeModelRunner} from './index';
import * as fs from 'fs';
import { TFLiteWebModelRunner } from '@tensorflow/tfjs-tflite/dist/types/tflite_web_model_runner';
import '@tensorflow/tfjs-backend-cpu';
import * as jpeg from 'jpeg-js';

import * as SegfaultHandler from 'segfault-handler';
SegfaultHandler.registerHandler('crash.log');

describe('interpreter', () => {
  let model: Uint8Array;
  let modelRunner: TFLiteWebModelRunner;
  beforeEach(() => {
    model = fs.readFileSync('./test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite');
    modelRunner = new TFLiteNodeModelRunner(model, { threads: 4 });
  });

  it('has input tensors', () => {
    const inputs = modelRunner.getInputs();
    expect(inputs.length).toEqual(1);
  });

  it('gets data from input tensor', () => {
    const input = modelRunner.getInputs()[0];
    const data = input.data();
    expect(data).toBeDefined();
  });

  it('sets input tensor data', () => {
    const input = modelRunner.getInputs()[0];

    const data = input.data();
    data.set([1,2,3]);
  });

  it('runs infer', () => {
    let outputs = modelRunner.getOutputs();
    modelRunner.infer();
    expect(outputs[0].data()).toBeDefined();
  });

  it('returns the same reference for each getInputs() call', () => {
    expect(modelRunner.getInputs()).toEqual(modelRunner.getInputs());
  });

  it('returns the same reference for each getOutputs() call', () => {
    expect(modelRunner.getOutputs()).toEqual(modelRunner.getOutputs());
  });

  it('returns the same reference for each TensorInfo data() call', () => {
    const input = modelRunner.getInputs()[0];
    const output = modelRunner.getOutputs()[0];
    expect(input.data()).toEqual(input.data());
    expect(output.data()).toEqual(output.data());
  });

  it('gets input tensor name', () => {
    const input = modelRunner.getInputs()[0];
    expect(input.name).toEqual('map/TensorArrayStack/TensorArrayGatherV3');
  });

  it('gets output tensor name', () => {
    const output = modelRunner.getOutputs()[0];
    expect(output.name).toEqual('prediction');
  });

  it('gets input tensor id', () => {
    const input = modelRunner.getInputs()[0];
    expect(input.id).toEqual(0);
  });
});

describe('model', () => {
  let model: Uint8Array;
  let modelRunner: TFLiteWebModelRunner;
  let parrot: Uint8Array;
  let labels: string[];

  beforeEach(() => {
    model = fs.readFileSync('./test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite');
    modelRunner = new TFLiteNodeModelRunner(model, { threads: 4 });
    const parrotJpeg = jpeg.decode(
      fs.readFileSync('./test_data/parrot-small.jpg'));

    const {width, height, data} = parrotJpeg;
    parrot = new Uint8Array(width * height * 3);
    let offset = 0;  // offset into original data
    for (let i = 0; i < parrot.length; i += 3) {
      parrot[i] = data[offset];
      parrot[i + 1] = data[offset + 1];
      parrot[i + 2] = data[offset + 2];

      offset += 4;
    }

    labels = fs.readFileSync('./test_data/inat_bird_labels.txt', 'utf-8').split('\n');
  });

  it('runs a model', () => {
    const input = modelRunner.getInputs()[0];
    input.data().set(parrot);
    modelRunner.infer();
    const output = modelRunner.getOutputs()[0];

    let max = 0;
    let maxIndex = 0;
    const data = output.data();
    for (let i = 0; i < data.length; i++) {
      if (data[i] > max) {
        max = data[i];
        maxIndex = i;
      }
    }

    const label = labels[maxIndex];
    expect(label).toEqual('Ara macao (Scarlet Macaw)');
  });
});
