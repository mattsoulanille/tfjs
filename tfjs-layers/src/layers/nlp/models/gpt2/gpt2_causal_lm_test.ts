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

/**
 * Tests for GPT2 causal LM model.
 */

import { Tensor, tensor } from '@tensorflow/tfjs-core';

import { GPT2TensorMap } from '../generative_task';
import { GPT2Backbone } from './gpt2_backbone';
import { GPT2CausalLMPreprocessor } from './gpt2_causal_lm_preprocessor';
import { GPT2CausalLM } from './gpt2_causal_lm';
import { GPT2Tokenizer } from './gpt2_tokenizer';

describe('fab! GPT2CausalLM', () => {
  let vocabulary: Map<string, number>;
  let merges: string[];
  let preprocessor: GPT2CausalLMPreprocessor;
  let backbone: GPT2Backbone;
  let causalLM: GPT2CausalLM;
  let rawBatch: Tensor;
  let preprocessedBatch: GPT2TensorMap;

  beforeEach(() => {
    vocabulary = new Map([
      ['!', 0],
      ['air', 1],
      ['Ġair', 2],
      ['plane', 3],
      ['Ġat', 4],
      ['port', 5],
      ['<|endoftext|>', 6],
    ]);

    merges = ['Ġ a', 'Ġ t', 'Ġ i', 'Ġ b', 'a i', 'p l', 'n e'].concat(
      ['Ġa t', 'p o', 'r t', 'Ġt h', 'ai r', 'pl a', 'po rt'],
      ['Ġai r', 'Ġa i', 'pla ne']
    );
    preprocessor = new GPT2CausalLMPreprocessor({
      tokenizer: new GPT2Tokenizer({vocabulary, merges}),
      sequenceLength: 8
    });
    backbone = new GPT2Backbone({
      vocabularySize: preprocessor.tokenizer.vocabularySize,
      numLayers: 2,
      numHeads: 2,
      hiddenDim: 4,
      intermediateDim: 8,
      maxSequenceLength: preprocessor.packer.sequenceLength,
    });
    causalLM = new GPT2CausalLM({backbone, preprocessor});
    rawBatch = tensor([' airplane at airport',' airplane at airport']);
    preprocessedBatch = preprocessor.callAndPackArgs(
      rawBatch, {}
    ) as [GPT2TensorMap, Tensor, Tensor][0];
  });

  it('generate', () => {
    causalLM.generate(rawBatch).print();

    causalLM.preprocessor = null;
    // console.log('preprocessed batchhhhh', preprocessedBatch.tokenIds, preprocessedBatch.paddingMask);
    // causalLM.generate(preprocessedBatch).print();

    // TODO(pforderique): now finish the tests and push changes to respective branches!!!!!!!!!!!
    // expect(output.arraySync() as unknown as string).toContain(prompt);
    // String tensor input.
    // expect(causalLM.generate(rawBatch).dataSync() as unknown as string[][0])
      // .toBeInstanceOf(String);
    // TODO(pforderique): Int tensor input.
  });

  // TODO(pforderique): Test serialization.
});
