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

const browserstackConfig = {
  // Browserstack only supports a certain range of ports for safari.
  // Karma will automatically use the next available port if the
  // chosen one is in use. Starting at 9200 gives us the largest
  // range of ports (9200 - 9400).
  // https://www.browserstack.com/question/39572
  port: 9200,
};

// Select Chrome or ChromeHeadless based on the value of the --//:headless flag.
const CHROME = TEMPLATE_headless ? 'ChromeHeadless' : 'Chrome';

const {getCustomLaunchers} = require('./custom_launchers');
const CUSTOM_LAUNCHERS = getCustomLaunchers(CHROME);

module.exports = function(config) {
  console.log(`Running with arguments ${TEMPLATE_args.join(' ')}`);
  let browser = 'TEMPLATE_browser';
  let extraConfig = {};
  const browserLauncher = CUSTOM_LAUNCHERS[browser];
  if (browser) {
    if (!browserLauncher) {
      throw new Error(`Missing launcher for ${browser}`);
    }
    extraConfig.browsers = [browser];
  } else {
    // Use no sandbox by default. This has better support on MacOS.
    extraConfig.browsers = ['chrome_no_sandbox'];
  }
  if (browserLauncher?.base === 'BrowserStack') {
    const username = process.env.BROWSERSTACK_USERNAME;
    const accessKey = process.env.BROWSERSTACK_KEY;
    if (!username) {
      console.error(
          'No browserstack username found. Please set the' +
          ' environment variable "BROWSERSTACK_USERNAME" to your' +
          ' browserstack username');
    }
    if (!accessKey) {
      console.error(
          'No browserstack access key found. Please set the' +
          ' environment variable "BROWSERSTACK_KEY" to your' +
          ' browserstack access key');
    }
    if (!username || !accessKey) {
      process.exit(1);
    }
    if (browserLauncher.browser === 'safari' || browserLauncher.os === 'ios') {
      // This is necessary for non-flaky Safari tests. They usually pass just
      // fine without it, but sometimes, Safari will fail to connect to Karma.
      // If you want to remove this, prove that it's not flaky by running
      // bazel test //tfjs-core/src:bs_safari_mac_from_pixels_worker_test --runs_per_test=100
      extraConfig.hostname = 'bs-local.com';
    }

    Object.assign(extraConfig, browserstackConfig);
    extraConfig.browserStack = {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_KEY,
      timeout: 900,  // Seconds
      tunnelIdentifier: `tfjs_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
  }

  config.set({
    reporters: [
      'kjhtml',
      'jasmine-order',
    ],
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-jasmine-html-reporter'),
      require('karma-jasmine-order-reporter'),
    ],
    captureTimeout: 3e5,
    reportSlowerThan: 500,
    browserNoActivityTimeout: 3e5,
    browserDisconnectTimeout: 3e5,
    browserDisconnectTolerance: 0,
    browserSocketTimeout: 1.2e5,
    ...extraConfig,
    customLaunchers: CUSTOM_LAUNCHERS,
    client: {
      args: TEMPLATE_args,
      jasmine: {
        random: TEMPLATE_jasmine_random,
        seed: 'TEMPLATE_jasmine_seed',
      },
    },
  });
}
