/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
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

// Use the CPU backend for running tests.
import '@tensorflow/tfjs-backend-cpu';
// tslint:disable-next-line: no-imports-from-dist
import '@tensorflow/tfjs-core/src/public/chained_ops/register_all_chained_ops';
// tslint:disable-next-line:no-imports-from-dist
import {setTestEnvs} from '@tensorflow/tfjs-core/src/jasmine_util';

// tslint:disable-next-line:no-require-imports
const jasmineCtor = require('jasmine');
// tslint:disable-next-line:no-require-imports

Error.stackTraceLimit = Infinity;

process.on('unhandledRejection', e => {
  throw e;
});

setTestEnvs([{name: 'test-converter', backendName: 'cpu', flags: {}}]);

const unitTests = 'tfjs-converter/src/**/*_test.js';

const runner = new jasmineCtor();
runner.loadConfig({spec_files: [unitTests], random: false});
runner.execute();
