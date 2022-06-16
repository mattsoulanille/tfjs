/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 * =============================================================================
 */

import './src/flags_layers';
import '@tensorflow/tfjs-core';
// tslint:disable-next-line: no-imports-from-dist
import '@tensorflow/tfjs-core/dist/register_all_gradients';

// This file lists all exports of TensorFlow.js Layers

import * as constraints from './src/exports_constraints';
import * as initializers from './src/exports_initializers';
import * as layers from './src/exports_layers';
import * as metrics from './src/exports_metrics';
import * as models from './src/exports_models';
import * as regularizers from './src/exports_regularizers';

export { CallbackList, CustomCallback, CustomCallbackArgs, History } from './src/base_callbacks';
export { Callback, callbacks, EarlyStopping, EarlyStoppingCallbackArgs } from './src/callbacks';
export { InputSpec, SymbolicTensor } from './src/engine/topology';
export { LayersModel, ModelCompileArgs, ModelEvaluateArgs } from './src/engine/training';
export { ModelFitDatasetArgs } from './src/engine/training_dataset';
export { ModelFitArgs } from './src/engine/training_tensors';
export { ClassWeight, ClassWeightMap } from './src/engine/training_utils';
export { input, loadLayersModel, model, registerCallbackConstructor, sequential } from './src/exports';
export { Shape } from './src/keras_format/common';
export { GRUCellLayerArgs, GRULayerArgs, LSTMCellLayerArgs, LSTMLayerArgs, RNN, RNNLayerArgs, SimpleRNNCellLayerArgs, SimpleRNNLayerArgs } from './src/layers/recurrent';
export { Logs } from './src/logs';
export { ModelAndWeightsConfig, Sequential, SequentialArgs } from './src/models';
export { LayerVariable } from './src/variables';
export { version as version_layers } from './src/version';
export {constraints, initializers, layers, metrics, models, regularizers};
