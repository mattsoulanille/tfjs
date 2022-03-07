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

import type {TFLiteWebModelRunner, TFLiteWebModelRunnerTensorInfo} from '@tensorflow/tfjs-tflite/dist/types/tflite_web_model_runner';

const addon = require('bindings')('node_tflite_binding');

interface InterpreterOptions {
  threads?: number;
  delegate?: {
    path: string;
  }
}

export const TFLiteNodeModelRunner = addon.Interpreter as {
  new(model: Uint8Array, options: InterpreterOptions): TFLiteWebModelRunner;
};

export const TensorInfo = addon.TensorInfo as {
  new(): TFLiteWebModelRunnerTensorInfo;
};
