/**
 * @license
 * Copyright 2023 Google LLC.
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

const fs = require('fs');
const path = require('path');
const {execSync, exec} = require('child_process');
const os = require('os');

const {addonName} = require('./get-addon-name');

const packageDir = path.join(__dirname, '../'); 
/**
 * Run a command in the root of the npm package.
 */
function $(command) {
  execSync(`cd ${packageDir} && ${command}`, {stdio: 'inherit'});
}

// Build the addon for each napi version by using docker.
const {uid, gid} = os.userInfo();
const buildCommand = 'yarn node-pre-gyp configure && yarn node-pre-gyp build';
$(`docker run --rm --mount type=bind,source=${packageDir},target=/tfjs-node/ --user "${uid}:${gid}" gcr.io/learnjs-174218/release  bash -c "cd tfjs-node && ${buildCommand}"`);

// Publish the addon to GCP.
if (process.argv[2] === 'publish') {
  if (addonName.includes('0.0.0')) {
    throw new Error(`Not uploading ${addonName} to GCP. Its version is 0.0.0.`);
  }
  const packageJson = JSON.parse(
    fs.readFileSync(
      require.resolve(path.join(packageDir, 'package.json'))
    )
  );

  // Upload the addon to gcp for each version of napi
  for (const napiVersion of packageJson.binary.napi_versions) {
    // Build a pre-built addon tarball
    $(`tar -czvf ${addonName} -C lib napi-v${napiVersion}/tfjs_binding.node`);

    // Upload to GCP
    const packageHost = packageJson.binary.host.split('.com/')[1]
          + '/napi-v' + napiVersion + '/'
          + packageJson.version + '/'
    $(`gsutil cp ${addonName} gs://${packageHost}`);
  }
  console.log(`Published addons for napi versions `
              + `${packageJson.binary.napi_versions} to GCP for ${addonName}`);
} else {
  console.log('Built addons but did not publish to GCP. Run with the '
              + '\'publish\' argument to publish');
}
