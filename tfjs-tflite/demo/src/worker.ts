import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';

import {expose, proxy} from 'comlink';
import {setWasmPath, loadTFLiteModel, TFLiteWebModelRunnerOptions} from '@tensorflow/tfjs-tflite';
import { Tensor } from '@tensorflow/tfjs-core';


export type Predictor = {predict: (data: Float32Array) => Promise<Float32Array>};

const api = {
  setWasmPath: proxy(setWasmPath),
  async loadTFLiteModel(modelPath: string, options: TFLiteWebModelRunnerOptions): Promise<Predictor> {

    const model = await loadTFLiteModel(modelPath, options)

    const wrapped: Predictor = {
      async predict(data) {
        // Hacky hard-coded tensor shape :(
        const prediction = model.predict(tf.tensor(data, [1, 224, 224, 3]));
        return (prediction as Tensor).dataSync() as Float32Array;
      }
    }

    return proxy(wrapped);
  }
}

export type Api = typeof api;

expose(api);
