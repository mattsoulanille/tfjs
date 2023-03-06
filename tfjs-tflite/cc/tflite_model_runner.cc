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

std::string GetTensorName(const tflite::Interpreter& interpreter,
                          int tensor_index) {
  const auto tensor = interpreter.tensor(tensor_index);
  if (tensor == nullptr || tensor->name == nullptr) {
    return "Unknown";
  }
  return tensor->name;
}

std::vector<std::string> GetTensorNames(const tflite::Interpreter& interpreter,
                                        const TfLiteIntArray* tensor_indices) {
  std::vector<std::string> tensors;
  tensors.reserve(tensor_indices->size);
  for (int i = 0; i < tensor_indices->size; i++) {
    tensors.push_back(GetTensorName(interpreter, tensor_indices->data[i]));
  }
  return tensors;
}

std::string ToString(const std::vector<std::string>& str_vector) {
  std::stringstream stream;
  stream << "[";
  bool first = true;
  for (const auto& s : str_vector) {
    if (!first) {
      stream << ", ";
    } else {
      first = false;
    }
    stream << s;
  }
  stream << "]";
  return stream.str();
}

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
  if (options_.enable_profiling) {
    profiler_.StartProfiling();
  }
  auto status = interpreter_->Invoke();
  if (options_.enable_profiling) {
    profiler_.StopProfiling();
  }
  if (status != kTfLiteOk) {
    // TODO(jingjin): return error status to JS.
    printf("Failed to run the model\n");
    return false;
  }
  return true;
}

std::vector<ProfileItem> TFLiteWebModelRunner::GetProfilingResults() {
  std::vector<ProfileItem> profileItems;
  if (!options_.enable_profiling) {
    return profileItems;
  }

  // Process events from collected by profiler.
  auto profile_events = profiler_.GetProfileEvents();
  std::vector<const tflite::profiling::ProfileEvent*> events;
  // Only keep events whose end time > begin time.
  std::copy_if(profile_events.begin(), profile_events.end(),
               std::back_inserter(events),
               [](const tflite::profiling::ProfileEvent* e) {
                 return e->elapsed_time >= 0;
               });
  if (events.empty()) {
    return profileItems;
  }

  // Extract node name and execution time from all events.
  //
  // This is a simplified version of ProcessProfiles method from
  // //third_party/tensorflow/lite/profiling/profile_summarizer.cc.
  for (auto event : events) {
    const auto subgraph_index = event->extra_event_metadata;
    int node_exec_ms = static_cast<int>((event->elapsed_time) / 1000);
    // Only process events related to ops.
    if (event->event_type ==
        tflite::Profiler::EventType::OPERATOR_INVOKE_EVENT) {
      const auto node_index = event->event_metadata;
      auto subgraph = const_cast<tflite::Interpreter&>(*interpreter_)
                          .subgraph(subgraph_index);
      auto node_reg = subgraph->node_and_registration(node_index);
      auto outputs = node_reg->first.outputs;
      const std::string node_name =
          ToString(GetTensorNames(*interpreter_, outputs));
      const std::string node_type(event->tag);
      profileItems.push_back({node_type, node_name, node_exec_ms});
    }
  }
  return profileItems;
}

std::string TFLiteWebModelRunner::GetProfilingSummary() {
  if (options_.enable_profiling) {
    auto profile_events = profiler_.GetProfileEvents();
    profile_summarizer_.ProcessProfiles(profile_events, *interpreter_);
    return profile_summarizer_.GetOutputString();
  }
  return "";
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

  if (options_.enable_profiling) {
    interpreter_->SetProfiler(&profiler_);
    profiler_.Reset();
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
