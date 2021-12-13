/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
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

const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const merge = require('merge-source-map');
const convertSourcemap = require('convert-source-map');


function removeSourcemap(code) {
  const sourcemapIndex = code.lastIndexOf('//# sourceMappingURL=');
  if (sourcemapIndex < 0) {
    return code;
  }
  return code.slice(0, sourcemapIndex);
}

module.exports = {
  name: 'es5Plugin',
  setup(build) {
    build.onLoad({ filter: /\.m?js/ }, async (args) => {
      const compilerOptions = {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.ES2015,
        allowJs: true,
        sourceMap: true,
        inlineSourceMap: false,
        inlineSources: true,
        downlevelIteration: true,
        importHelpers: true,
        mapRoot: path.dirname(args.path),
      };

      const code = fs.readFileSync(args.path, 'utf8');
      const inputSourcemapParser = convertSourcemap.fromSource(code);
      let inputSourcemap;
      if (inputSourcemapParser) {
        inputSourcemap = inputSourcemapParser.toObject();
      }
      const codeWithoutMap = removeSourcemap(code);

      // Use tsc to downlevel js to es5
      const {outputText, sourceMapText} =
            ts.transpileModule(codeWithoutMap, {
              compilerOptions,
              fileName: args.path,
            });
      //console.log(outputText);
      const outputSourcemapParser = convertSourcemap.fromJSON(sourceMapText);
      if (!outputSourcemapParser) {
        throw new Error(`Expected tsc to generate sourcemaps for ${args.path}`);
      }
      const outputSourcemap = outputSourcemapParser.toObject();

      const mergedSourcemap = merge(inputSourcemap, outputSourcemap);
      //console.log(mergedSourcemap);
      const mergedSourcemapComment =
            convertSourcemap.fromObject(mergedSourcemap).toComment();

      const outputWithoutMap = removeSourcemap(outputText);

      const outputWithNewMap = `${outputWithoutMap}\n${mergedSourcemapComment}`;
      //console.log("==================");
      //console.log(outputWithNewMap);

      return {contents: outputWithNewMap}
    });
  }
}
