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
//#include "tensorflow_lite_support/web/tflite_model_runner/cc/tflite_model_runner.h"
#include "tfjs-tflite/cc/tflite_model_runner.h"

#include <cstdint>
#include <memory>

#include "flatbuffers/flatbuffers.h"  // from @flatbuffers
#include "tensorflow/lite/c/c_api_types.h"
#include "tensorflow/lite/c/common.h"
#include "tensorflow/lite/interpreter_builder.h"
#include "tensorflow/lite/kernels/internal/tensor_ctypes.h"
#include "tensorflow/lite/schema/schema_generated.h"
//#include "tensorflow_lite_support/cc/port/statusor.h"
#include "absl/status/statusor.h"  // from @com_google_absl

using absl::StatusOr;
//using tflite::support::StatusOr;

namespace tfweb {
namespace generic {

absl::StatusOr<std::unique_ptr<TFLiteWebModelRunner>>
TFLiteWebModelRunner::CreateFromBufferAndOptions(
    const char* model_buffer_data, const size_t model_buffer_size,
    const TFLiteWebModelRunnerOptions& options) {
  auto runner_instance = std::make_unique<TFLiteWebModelRunner>(options);
  if (runner_instance->InitFromBuffer(
          model_buffer_data, model_buffer_size,
          absl::make_unique<tflite::ops::builtin::BuiltinOpResolver>()) !=
      kTfLiteOk) {
    return absl::InvalidArgumentError("Can't initialize model");
  }
  return runner_instance;
}

bool TFLiteWebModelRunner::Infer() {
  auto status = interpreter_->Invoke();
  if (status != kTfLiteOk) {
    // TODO(jingjin): return error status to JS.
    printf("Failed to run the model\n");
    return false;
  }
  return true;
}

std::vector<TFLiteWebModelRunnerTensorInfo> TFLiteWebModelRunner::GetInputs() {
  std::vector<TFLiteWebModelRunnerTensorInfo> inputs;
  for (int id : interpreter_->inputs()) {
    auto input = interpreter_->tensor(id);
    inputs.push_back(CreateTensorInfo(input, id));
  }
  return inputs;
}

std::vector<TFLiteWebModelRunnerTensorInfo> TFLiteWebModelRunner::GetOutputs() {
  std::vector<TFLiteWebModelRunnerTensorInfo> outputs;
  for (int id : interpreter_->outputs()) {
    auto output = interpreter_->tensor(id);
    outputs.push_back(CreateTensorInfo(output, id));
  }
  return outputs;
}

TfLiteStatus TFLiteWebModelRunner::InitFromBuffer(
    const char* model_buffer_data, size_t model_buffer_size,
    std::unique_ptr<tflite::OpResolver> resolver) {
  // Initilaize the model from flatbuffer.
  const char* model_buffer = reinterpret_cast<const char*>(model_buffer_data);
  flatbuffers::Verifier verifier(reinterpret_cast<const uint8_t*>(model_buffer),
                                 model_buffer_size);
  if (!tflite::VerifyModelBuffer(verifier)) {
    return kTfLiteError;
  }
  model_ =
      tflite::FlatBufferModel::BuildFromBuffer(model_buffer, model_buffer_size);

  // Initialize the interpreter from the model.
  const auto interpreter_builder_result =
      tflite::InterpreterBuilder(model_->GetModel(), *resolver, nullptr)(
          &interpreter_, options_.num_threads);
  if (interpreter_builder_result != kTfLiteOk) {
    return interpreter_builder_result;
  }
  if (!model_->initialized()) {
    return kTfLiteError;
  }

  // Allocate memory for the tensors in the model.
  return interpreter_->AllocateTensors();
}

TFLiteWebModelRunnerTensorInfo TFLiteWebModelRunner::CreateTensorInfo(
    TfLiteTensor* tensor, int id) {
  // Shape.
  std::stringstream shape;
  for (int i = 0; i < tensor->dims->size; i++) {
    if (i != 0) {
      shape << ",";
    }
    shape << tensor->dims->data[i];
  }
  // Buffer.
  //
  // data_type determines what kind of TypedArray is exposed to JS side.
  // See:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays#typed_array_views
  void* data_buffer = tensor->data.data;
  size_t data_length = 0;
  std::string data_type = "";
  switch (tensor->type) {
    case kTfLiteInt8:
      data_type = "int8";
      data_length = tensor->bytes;
      break;
    case kTfLiteUInt8:
      data_type = "uint8";
      data_length = tensor->bytes;
      break;
    case kTfLiteBool:
      data_type = "bool";
      data_length = tensor->bytes;
      break;
    case kTfLiteInt16:
      data_type = "int16";
      data_length = tensor->bytes / 2;
      break;
    case kTfLiteInt32:
      data_type = "int32";
      data_length = tensor->bytes / 4;
      break;
    case kTfLiteUInt32:
      data_type = "uint32";
      data_length = tensor->bytes / 4;
      break;
    case kTfLiteFloat32:
      data_type = "float32";
      data_length = tensor->bytes / 4;
      break;
    case kTfLiteFloat64:
      data_type = "float64";
      data_length = tensor->bytes / 8;
      break;
    default:
      // TODO(jingjin): support more types as needed.
      data_type = "unknown";
      printf("Unknown dtype %d", tensor->type);
  }
  return {id,          std::string(tensor->name),
          shape.str(), data_buffer,
          data_length, data_type};
}

}  // namespace generic
}  // namespace tfweb
