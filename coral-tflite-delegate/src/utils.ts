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

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

/**
 * Gets library paths based on the contents of a directory of the following
 * format:
 * ```
 * [basePath]/
 *   platform_arch1/foo[baseLibName].bar
 *   platform_arch2/baz[baseLibName].etc
 *   ...
 * ```
 * @param baseLibName The base name included in all library files.
 * @param basePath The absolute path to the library files.
 */
export function getLibPaths(baseLibName: string, basePath: string) {
  // TODO(mattsoulanille): Move this utility function to a separate package.
  const platforms = fs.readdirSync(basePath);

  const platformLibPairs = platforms.map(platform => {
    // Check that each platform corresponds to a directory.
    const pathToDir = path.join(basePath, platform);
    if (!fs.lstatSync(pathToDir).isDirectory()) {
      throw new Error(`Expected ${pathToDir} to be a directory`);
    }

    // Find the library file for each platform.
    const contents = fs.readdirSync(pathToDir);
    const matching = contents.filter(f => f.includes(baseLibName));
    if (matching.length < 1) {
      throw new Error(`No files matching ${baseLibName} found in ${pathToDir}`);
    } else if (matching.length > 1) {
      throw new Error(`Multiple matching files found: ${matching}`);
    }

    const relativePath = path.join(pathToDir, matching[0]);
    const absolutePath = require.resolve(`${relativePath}`);

    return [platform, absolutePath] as [string, string];
  });

  return new Map(platformLibPairs);
}

/**
 * Gets the system's platform and architecture in the format [platform]_[arch].
 */
export function getPlatform() {
  // TODO(mattsoulanille): Move this utility function to a separate package.
  const arch = process.arch;
  const platformName = os.platform();

  return `${platformName}_${arch}`;
}
