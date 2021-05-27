#!/usr/bin/env node
// Copyright 2019 Google LLC. All Rights Reserved.
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
// =============================================================================

/**
 * This script generates the tests.ts file which enumerates all the
 * backend-agonstic tests. These are the tests that get executed from other
 * packages (e.g. WebGPU).
 */
// Call this script from the root of the repo.

const LICENSE = `/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
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
`;

const AUTOGEN_CLAUSE = `///// DO NOT EDIT: This file is auto-generated by ` +
    `/scripts/enumerate-tests.js
`;

const fs = require('fs');
const path = require('path').posix;
const argv = require('yargs').argv;

function findTestFiles(dir, files) {
  files = files || [];
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (!file.endsWith('node_modules') && !filePath.endsWith('src/backends') &&
        !file.startsWith('.') && fs.statSync(filePath).isDirectory() &&
        !fs.existsSync(path.join(filePath, 'package.json'))) {
      files = findTestFiles(filePath, files);
    } else if (
        filePath.endsWith('_test.ts') && filePath !== 'src/setup_test.ts') {
      files.push(filePath.replace('src/', './').replace('.ts', ''));
    }
  });
  return files;
};

let files = findTestFiles('./src');
//console.log('files:');
//console.log(files);
files = files.map(f => `import '${f}';`);
const newContent = `${LICENSE}
${AUTOGEN_CLAUSE}
${files.sort().join('\n')}
`;

const testsPath = path.join('src', 'tests.ts');
const oldContent = fs.readFileSync(testsPath);
if (argv.ci && newContent != oldContent) {
  throw new Error(
      'Looks like you added a new test file. Please run `yarn build` to ' +
      'regenerate src/tests.ts');
}

fs.writeFileSync(testsPath, newContent);
