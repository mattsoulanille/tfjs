/**
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

import '../flags';

import {env} from '../environment';
import {BrowserIndexedDB, BrowserIndexedDBManager} from '../io/indexed_db';
import {BrowserLocalStorage, BrowserLocalStorageManager} from '../io/local_storage';
import {ModelStoreManagerRegistry} from '../io/model_management';

import {Platform} from './platform';
import {RequestDetails} from '../io/types';

export class PlatformBrowser implements Platform {
  // According to the spec, the built-in encoder can do only UTF-8 encoding.
  // https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/TextEncoder
  private textEncoder: TextEncoder;

  fetch(path: string, init?: RequestInit): Promise<Response> {
    return fetch(path, init);
  }

  fetchSync(path: string, requestInit?: RequestInit, options?: RequestDetails) {
    const request = new XMLHttpRequest();
    request.open(requestInit && requestInit.method || 'GET', path, false);
    request.overrideMimeType('text/plain; charset=x-user-defined');
    request.send(null);
    return {
      ok: request.status === 200,
      arrayBuffer: () => {
        return Uint8Array.from(request.response as string,
                               c => c.charCodeAt(0)).buffer;
      },
      json: () => JSON.parse(request.responseText),
    }
  }

  now(): number {
    return performance.now();
  }

  encode(text: string, encoding: string): Uint8Array {
    if (encoding !== 'utf-8' && encoding !== 'utf8') {
      throw new Error(
          `Browser's encoder only supports utf-8, but got ${encoding}`);
    }
    if (this.textEncoder == null) {
      this.textEncoder = new TextEncoder();
    }
    return this.textEncoder.encode(text);
  }
  decode(bytes: Uint8Array, encoding: string): string {
    return new TextDecoder(encoding).decode(bytes);
  }
}

if (env().get('IS_BROWSER')) {
  env().setPlatform('browser', new PlatformBrowser());

  // Register LocalStorage IOHandler
  try {
    ModelStoreManagerRegistry.registerManager(
        BrowserLocalStorage.URL_SCHEME, new BrowserLocalStorageManager());
  } catch (err) {
  }

  // Register IndexedDB IOHandler
  try {
    ModelStoreManagerRegistry.registerManager(
        BrowserIndexedDB.URL_SCHEME, new BrowserIndexedDBManager());
  } catch (err) {
  }
}
