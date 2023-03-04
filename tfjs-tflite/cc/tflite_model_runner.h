/* Copyright 2021 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
#ifndef TENSORFLOW_LITE_SUPPORT_WEB_GENERIC_CC_TFLITE_WEB_MODEL_RUNNER_H_
#define TENSORFLOW_LITE_SUPPORT_WEB_GENERIC_CC_TFLITE_WEB_MODEL_RUNNER_H_

#include <cstdint>
#include <memory>
#include <vector>

#include "tensorflow/lite/c/common.h"
#include "tensorflow/lite/interpreter.h"
#include "tensorflow/lite/kernels/register.h"
//#include "tensorflow_lite_support/cc/port/statusor.h"
#include "absl/status/statusor.h"  // from @com_google_absl

namespace tfweb {
namespace generic {

constexpr int kDefaultNumThreads = -1;

// Available options.
struct TFLiteWebModelRunnerOptions {
  // Set the number of threads available to the interpreter.
  // -1 means to let interpreter set the threads count available to itself.
  int num_threads = kDefaultNumThreads;

  // TODO(jingjin): Add more as needed.
};

// Tensor related data exposed to JS.
struct TFLiteWebModelRunnerTensorInfo {
  // Tensor id.
  int id;

  // Tensor name.
  std::string name;

  // Tensor shape.
  //
  // To make it work better with emscripten and code generator, it is a string
  // with dim values separated by "," (e.g. 1,224,224,3)
  std::string shape;

  // Data buffer related fields.
  //
  // These are needed for emscripten and code generator to expose the underlying
  // tensor data buffer directly to JS.
  void* data_buffer;  // Owned by TFLiteWebModelRunner.
  size_t data_length;
  std::string data_type;
};

// A class to run arbitary TFLite model.
//
// This is essentially a thin wrapper around TFLite's Interpreter. It provides a
// set of methods that work well with emscripten and the corresponding JS
// client. The emscripten bindings are defined in the .cc file.
//
// This class is not meant to be used by other c++ code.
class TFLiteWebModelRunner {
 public:
  explicit TFLiteWebModelRunner(const TFLiteWebModelRunnerOptions& options)
      : options_(options) {}

  // A factory function to create a TFLiteWebModelRunner from the given model
  // buffer and options.
  static absl::StatusOr<std::unique_ptr<TFLiteWebModelRunner>>
  CreateFromBufferAndOptions(const char* model_buffer_data,
                             const size_t model_buffer_size,
                             const TFLiteWebModelRunnerOptions& options = {});

  // Gets info for input tensors.
  std::vector<TFLiteWebModelRunnerTensorInfo> GetInputs();

  // Gets info for output tensors.
  std::vector<TFLiteWebModelRunnerTensorInfo> GetOutputs();

  // Runs the model.
  bool Infer();

 private:
  TfLiteStatus InitFromBuffer(const char* model_buffer_data,
                              size_t model_buffer_size,
                              std::unique_ptr<tflite::OpResolver> resolver);
  TFLiteWebModelRunnerTensorInfo CreateTensorInfo(TfLiteTensor* tensor, int id);

  const TFLiteWebModelRunnerOptions& options_;
  std::unique_ptr<::tflite::Interpreter> interpreter_;
  std::unique_ptr<::tflite::FlatBufferModel> model_;
};

}  // namespace generic
}  // namespace tfweb

#endif  // TENSORFLOW_LITE_SUPPORT_WEB_GENERIC_CC_TFLITE_WEB_MODEL_RUNNER_H_
