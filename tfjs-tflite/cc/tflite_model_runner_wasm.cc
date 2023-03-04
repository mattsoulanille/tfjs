#include <emscripten.h>
#include <emscripten/bind.h>

#include <memory>

#include "tfjs-tflite/cc/tflite_model_runner.h"
//#include "tensorflow_lite_support/web/tflite_model_runner/cc/tflite_model_runner.h"
#include "tensorflow/lite/kernels/register.h"
#include "tensorflow/lite/op_resolver.h"
//#include "tensorflow_lite_support/cc/port/statusor.h"
#include "absl/status/statusor.h"  // from @com_google_absl

namespace tflite {
namespace task {
std::unique_ptr<OpResolver> CreateOpResolver() {
  return absl::make_unique<tflite::ops::builtin::BuiltinOpResolver>();
}
}  // namespace task
}  // namespace tflite

using emscripten::allow_raw_pointers;
using emscripten::class_;
using emscripten::function;
using emscripten::optional_override;
using emscripten::register_vector;
using emscripten::typed_memory_view;
using emscripten::val;
using emscripten::value_object;
using absl::StatusOr;

template <typename T>
T ValueAdapter(StatusOr<T>& status_or) {
  return std::move(status_or.value());
}

template <typename T>
std::string StatusOrErrorMessageAdapter(const StatusOr<T>& status_or) {
  return status_or.status().ToString();
}

template <typename T>
class_<StatusOr<T>> register_status_or(const char* name) {
  typedef StatusOr<T> StatusType;

  return class_<StatusOr<T>>(name)
      .function("ok", &StatusType::ok)
      .function("errorMessage", StatusOrErrorMessageAdapter<T>)
      .function("value", ValueAdapter<T>);
}

val GetRawBufferFromTFLiteWebModelRunnerTensorInfo(
    tfweb::generic::TFLiteWebModelRunnerTensorInfo& s) {
  auto type = s.data_type;
  if (type == "int8") {
    return val(typed_memory_view(s.data_length, (int8_t*)s.data_buffer));
  } else if (type == "uint8" || type == "bool") {
    return val(typed_memory_view(s.data_length, (uint8_t*)s.data_buffer));
  } else if (type == "int16") {
    return val(typed_memory_view(s.data_length, (int16_t*)s.data_buffer));
  } else if (type == "int32") {
    return val(typed_memory_view(s.data_length, (int32_t*)s.data_buffer));
  } else if (type == "uint32") {
    return val(typed_memory_view(s.data_length, (uint32_t*)s.data_buffer));
  } else if (type == "float32") {
    return val(typed_memory_view(s.data_length, (float*)s.data_buffer));
  } else if (type == "float64") {
    return val(typed_memory_view(s.data_length, (double*)s.data_buffer));
  }
  return val(0);
}

EMSCRIPTEN_BINDINGS(tf_lite_web_model_runner) {
  class_<tfweb::generic::TFLiteWebModelRunner>("TFLiteWebModelRunner")
      .function("GetInputs", &tfweb::generic::TFLiteWebModelRunner::GetInputs)
      .function("GetOutputs", &tfweb::generic::TFLiteWebModelRunner::GetOutputs)
      .function("Infer", &tfweb::generic::TFLiteWebModelRunner::Infer)
      .class_function(
          "CreateFromBufferAndOptions",
          optional_override(
              [](const uintptr_t model_buffer_data,
                 const size_t model_buffer_size,
                 tfweb::generic::TFLiteWebModelRunnerOptions& options)
                  -> StatusOr<
                      std::unique_ptr<tfweb::generic::TFLiteWebModelRunner>> {
                return tfweb::generic::TFLiteWebModelRunner::
                    CreateFromBufferAndOptions((const char*)model_buffer_data,
                                               model_buffer_size, options);
              }));

  register_status_or<std::unique_ptr<tfweb::generic::TFLiteWebModelRunner>>(
      "StatusOrTFLiteWebModelRunner");
}

EMSCRIPTEN_BINDINGS(tf_lite_web_model_runner_structs) {
  value_object<tfweb::generic::TFLiteWebModelRunnerOptions>(
      "TFLiteWebModelRunnerOptions")
      .field("numThreads",
             &tfweb::generic::TFLiteWebModelRunnerOptions::num_threads);
  class_<tfweb::generic::TFLiteWebModelRunnerTensorInfo>(
      "TFLiteWebModelRunnerTensorInfo")
      .function("data", &GetRawBufferFromTFLiteWebModelRunnerTensorInfo)
      .property("id", &tfweb::generic::TFLiteWebModelRunnerTensorInfo::id)
      .property("dataType",
                &tfweb::generic::TFLiteWebModelRunnerTensorInfo::data_type)
      .property("name", &tfweb::generic::TFLiteWebModelRunnerTensorInfo::name)
      .property("shape",
                &tfweb::generic::TFLiteWebModelRunnerTensorInfo::shape);
}

EMSCRIPTEN_BINDINGS(tf_lite_web_model_runner_vectors) {
  register_vector<tfweb::generic::TFLiteWebModelRunnerTensorInfo>(
      "vector<TFLiteWebModelRunnerTensorInfo>");
}
