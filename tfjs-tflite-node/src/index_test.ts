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

import {Interpreter} from './index';
import * as fs from 'fs';
import { TFLiteWebModelRunner } from '@tensorflow/tfjs-tflite';

describe('interpreter', () => {
  let model: Uint8Array;
  let interpreter: TFLiteWebModelRunner;
  beforeEach(() => {
    model = fs.readFileSync('./mobilenet_v1_1.0_224_quant.tflite');
    interpreter = new Interpreter(model, { threads: 4 });
  });

  it('has input tensors', () => {
    const inputs = interpreter.getInputs();
    expect(inputs.length).toEqual(1);
  });

  it('gets data from input tensor', () => {
    const input = interpreter.getInputs()[0];
    const data = input.data();
    expect(data).toBeDefined();
  });

  it('sets input tensor data', () => {
    const input = interpreter.getInputs()[0];

    const data = input.data();
    data.set([1,2,3]);
  });

  it('runs infer', () => {
    let outputs = interpreter.getOutputs();
    interpreter.infer();
    expect(outputs[0].data()).toBeDefined();
  });

  it('returns the same reference for each TensorInfo data() call', () => {
    const input = interpreter.getInputs()[0];
    const output = interpreter.getOutputs()[0];
    expect(input.data()).toEqual(input.data());
    expect(output.data()).toEqual(output.data());
  });
});

//console.log(tf)

// describe('model', () => {
//   let model: Uint8Array;
//   let interpreter: TFLiteWebModelRunner;
//   let tfliteModel: TFLiteModel;
//   beforeEach(() => {
//     model = fs.readFileSync('./mobilenet_v1_1.0_224_quant.tflite');
//     interpreter = new Interpreter(model, { threads: 4 });
//     tfliteModel = new TFLiteModel(interpreter);
//   });

//   it('runs a model', () => {
//     const input = tf.tensor1d([1,2,3,4,5,6,7,8]);
//     console.log(tfliteModel.predict([input as any]));
//   });
// });
