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

import '@tensorflow/tfjs-backend-cpu';

import * as tf from '@tensorflow/tfjs-core';
//import * as tflite from '@tensorflow/tfjs-tflite';
import * as Comlink from 'comlink';
import type { Api, Predictor } from './worker';

const CARTOONIZER_LINK =
    'https://github.com/margaretmz/Cartoonizer-with-TFLite';

//tflite.setWasmPath('../node_modules/@tensorflow/tfjs-tflite/dist/');
const worker = new Worker('/src/worker.js');

async function start() {
  const {loadTFLiteModel, setWasmPath} = Comlink.wrap<Api>(worker);
  await setWasmPath('/node_modules/@tensorflow/tfjs-tflite/dist/');

  // Load model runner with the cartoonizer tflite model.
  const start = Date.now();
  //const tfliteModel = await tflite.loadTFLiteModel(
  const tfliteModel = await loadTFLiteModel(
    'https://tfhub.dev/sayakpaul/lite-model/cartoongan/fp16/1', {
      delegatePath: '/dummy_external_delegate_wasm.wasm',
    }
  );
  ele('.loading-msg').innerHTML = `Loaded WASM module and <a href='${
      CARTOONIZER_LINK}' target='blank'>TFLite model</a> in ${
      Date.now() - start}ms`;
  eles('.trigger').forEach(ele => {
    ele.classList.add('show');
  });
  removeClass('.imgs-container', 'hide');

  // Setup cam.
  setupCam();

  // Setup the magic wand buttons. Click it will cartoonize the
  // corresponding picture.
  eles('.trigger').forEach(ele => {
    ele.addEventListener('click', (event) => {
      const trigger = event.target! as HTMLElement;
      trigger.classList.add('processing');
      trigger.innerHTML = 'Processing...';

      setTimeout(() => {
        handleClickTrigger(trigger, tfliteModel);
        trigger.classList.add('hide');
      });
    });
  });

  // Click cam's result picture to take another picture.
  ele('#cam-canvas').addEventListener('click', (event) => {
    handleClickTrigger(event.target as HTMLElement, tfliteModel);
  });
}

async function setupCam() {
  const constraints = {
    video: {
      width: {
        min: 224,
        ideal: 224,
        max: 224,
      },
      height: {
        min: 224,
        ideal: 224,
        max: 224,
      },
    }
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const camEle = ele('video') as HTMLVideoElement;
  camEle.srcObject = stream;
  await new Promise(resolve => camEle.onplaying = resolve);
}

async function handleClickTrigger(
  trigger: HTMLElement, tfliteModel: Predictor) {
  // Get the source media (either a picture or the cam video).
  const imageContainer = trigger.closest('.img-container')!;
  let srcMedia: HTMLImageElement|HTMLVideoElement =
      imageContainer.querySelector('img')!;
  if (!srcMedia) {
    srcMedia = imageContainer.querySelector('video')!;
    removeClass('.take-pic', 'hide');
  }

  // Run inference and draw the result on the corresponding canvas.
  const canvas = imageContainer.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const inferenceStart = Date.now();
  const imageData = await cartoonize(tfliteModel, srcMedia);
  const latency = Date.now() - inferenceStart;
  ctx.putImageData(imageData, 0, 0);
  canvas.classList.add('show');

  // Show latency stat.
  const stats = trigger.closest('.img-container')!.querySelector('.stats')!;
  stats.classList.add('show');
  stats.innerHTML = latency.toFixed(1) + ' ms';
}

async function cartoonize(
    tfliteModel: Predictor,
    ele: HTMLImageElement|HTMLVideoElement): Promise<ImageData> {
  const input = tf.tidy(() => {
    // Get pixels data.
    const img = tf.browser.fromPixels(ele);
    // Normalize.
    //
    // Since the images are already 224*224 that matches the model's input size,
    // we don't resize them here.
    const input = tf.sub(tf.div(tf.expandDims(img), 127.5), 1);
    return input;
  });

  // Run the inference.
  const output = await tfliteModel.predict(input.dataSync() as Float32Array);

  const outputTensor = tf.tidy(() => {
    // De-normalize the result.
    return tf.mul(tf.add(output, 1), 127.5);
  });


  // Convert from RGB to RGBA, and create and return ImageData.
  const rgb = Array.from(outputTensor.dataSync());
  const rgba: number[] = [];
  for (let i = 0; i < rgb.length / 3; i++) {
    for (let c = 0; c < 3; c++) {
      rgba.push(rgb[i * 3 + c]);
    }
    rgba.push(255);
  }
  return new ImageData(Uint8ClampedArray.from(rgba), 224, 224);
}

function ele(selector: string) {
  return document.querySelector(selector)!;
}

function eles(selector: string) {
  return document.querySelectorAll(selector)!;
}

function removeClass(selector: string, className: string) {
  return ele(selector).classList.remove(className);
}

start();
