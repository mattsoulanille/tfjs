/**
 * @license
 * Copyright 2022 Google LLC. All Rights Reserved.
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

#include <cstdint>
#include <napi.h>
#include <sstream>
#include "tensorflow/lite/c/c_api.h"
#include "tensorflow/lite/c/c_api_types.h"

class TensorInfo : public Napi::ObjectWrap<TensorInfo> {
 public:
  static Napi::FunctionReference constructor;
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);
    Napi::Function func = DefineClass(env, "TensorInfo", {
        InstanceAccessor<&TensorInfo::GetDataType>("dataType"),
        InstanceAccessor<&TensorInfo::GetShape>("shape"),
        InstanceAccessor<&TensorInfo::GetId>("id"),
        InstanceAccessor<&TensorInfo::GetName>("name"),
        InstanceMethod<&TensorInfo::GetData>("data"),
      });

    // Create a persistent reference to the class constructor. This lets us
    // instantiate TensorInfos in the interpreter.
    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    //exports.Set("TensorInfo", func);

    return exports;
  }

  TensorInfo(const Napi::CallbackInfo& info)
      : Napi::ObjectWrap<TensorInfo>(info) { }

 private:
  friend class Interpreter;
  const TfLiteTensor *tensor = nullptr;
  int id = -1;
  //Napi::Buffer<uint8_t> dataBuffer;
  Napi::Reference<Napi::Buffer<uint8_t>> dataBuffer;

  void setTensor(Napi::Env env, const TfLiteTensor *t, int i) {
    tensor = t;
    id = i;
    void* data = TfLiteTensorData(tensor);
    if (!data) {
      Napi::Error::New(env, "Failed to get tensor data").ThrowAsJavaScriptException();
    }

    TfLiteType tensorType = TfLiteTensorType(tensor);
    size_t length = getLength();
    size_t byteSize = TfLiteTensorByteSize(tensor);
    //auto buffer = Napi::ArrayBuffer::New(
    //env, data, byteSize); // TODO: Finalizer?
    auto buffer = Napi::Buffer<uint8_t>::New(
        env, (uint8_t*)data, byteSize); // TODO: Finalizer?

    dataBuffer = Napi::Reference<Napi::Buffer<uint8_t>>::New(buffer);

    //auto array = Napi::TypedArrayOf<uint8_t>(env, buffer);

  }

  Napi::Value GetId(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, id);
  }

  Napi::Value GetName(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    // TODO
    if (tensor != nullptr) {
      //printf("tensor is defined");
      //printf("Tensor is %s", TfLiteTensorName(tensor));
      //std::string name(TfLiteTensorName(tensor));
      //return Napi::String::New(env, name);
    }
    return Napi::String::New(env, "unknown tensor");
  }

  Napi::Value GetDataType(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    TfLiteType tensorType = TfLiteTensorType(tensor);
    switch (tensorType) {
      case kTfLiteNoType:
        return Napi::String::New(env, "kTfLiteNoType");
      case kTfLiteFloat32:
        return Napi::String::New(env, "float32");
      case kTfLiteInt32:
        return Napi::String::New(env, "int32");
      case kTfLiteUInt8:
        return Napi::String::New(env, "uint8");
      case kTfLiteInt64:
        return Napi::String::New(env, "kTfLiteInt64");
      case kTfLiteString:
        return Napi::String::New(env, "kTfLiteString");
      case kTfLiteBool:
        return Napi::String::New(env, "bool");
      case kTfLiteInt16:
        return Napi::String::New(env, "int16");
      case kTfLiteComplex64:
        return Napi::String::New(env, "kTfLiteComplex64");
      case kTfLiteInt8:
        return Napi::String::New(env, "int8");
      case kTfLiteFloat16:
        return Napi::String::New(env, "kTfLiteFloat16");
      case kTfLiteFloat64:
        return Napi::String::New(env, "float64");
      case kTfLiteComplex128:
        return Napi::String::New(env, "kTfLiteComplex128");
      case kTfLiteUInt64:
        return Napi::String::New(env, "kTfLiteUInt64");
      case kTfLiteResource:
        return Napi::String::New(env, "kTfLiteResource");
      case kTfLiteVariant:
        return Napi::String::New(env, "kTfLiteVariant");
      case kTfLiteUInt32:
        return Napi::String::New(env, "uint32");
    }
  }

  Napi::Value GetShape(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    int numDims = TfLiteTensorNumDims(tensor);

    std::stringstream shape;
    for (int i = 0; i < numDims; i++) {
      if (i != 0) {
        shape << ",";
      }
      shape << TfLiteTensorDim(tensor, i);
    }

    return Napi::String::New(env, shape.str());
  }

  size_t getLength() {
    TfLiteType tensorType = TfLiteTensorType(tensor);
    size_t byteSize = TfLiteTensorByteSize(tensor);
    switch (tensorType) {
      case kTfLiteNoType:
        return byteSize;
      case kTfLiteFloat32:
        return byteSize / 4;
      case kTfLiteInt32:
        return byteSize / 4;
      case kTfLiteUInt8:
        return byteSize;
      case kTfLiteInt64:
        return byteSize / 8;
      case kTfLiteString:
        return byteSize;
      case kTfLiteBool:
        return byteSize;
      case kTfLiteInt16:
        return byteSize / 2;
      case kTfLiteComplex64:
        return byteSize / 8;
      case kTfLiteInt8:
        return byteSize;
      case kTfLiteFloat16:
        return byteSize / 2;
      case kTfLiteFloat64:
        return byteSize / 8;
      case kTfLiteComplex128:
        return byteSize / 16;
      case kTfLiteUInt64:
        return byteSize / 8;
      case kTfLiteResource:
        return byteSize;
      case kTfLiteVariant:
        return byteSize;
      case kTfLiteUInt32:
        return byteSize / 4;
    }
  }

  Napi::Value GetData(const Napi::CallbackInfo &info) {
    return dataBuffer.Value();
    // Napi::Env env = info.Env();
    // void* data = TfLiteTensorData(tensor);
    // if (!data) {
    //   Napi::Error::New(env, "Failed to get tensor data").ThrowAsJavaScriptException();
    // }

    // TfLiteType tensorType = TfLiteTensorType(tensor);
    // size_t length = getLength();
    // size_t byteSize = TfLiteTensorByteSize(tensor);
    // //auto buffer = Napi::ArrayBuffer::New(
    // //env, data, byteSize); // TODO: Finalizer?
    // auto buffer = Napi::Buffer<uint8_t>::New(
    //     env, (uint8_t*)data, byteSize); // TODO: Finalizer?

    // //auto array = Napi::TypedArrayOf<uint8_t>(env, buffer);
    // return buffer;
  }
};

Napi::FunctionReference TensorInfo::constructor;

class Interpreter : public Napi::ObjectWrap<Interpreter> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);
    Napi::Function func = DefineClass(env, "Interpreter", {
        InstanceMethod<&Interpreter::GetInputs>("getInputs"),
        InstanceMethod<&Interpreter::GetOutputs>("getOutputs"),
        InstanceMethod<&Interpreter::Infer>("infer"),
      });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();

    // Create a persistent reference to the class constructor. This will allow
    // a function called on a class prototype and a function
    // called on instance of a class to be distinguished from each other.
    *constructor = Napi::Persistent(func);
    exports.Set("Interpreter", func);

    return exports;
  }

  Interpreter(const Napi::CallbackInfo& info)
      : Napi::ObjectWrap<Interpreter>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    // TODO: Throw error on incorrect argument types.
    // Model is stored as a uint8 buffer.
    Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
    // Options are an object.
    Napi::Object options = info[1].As<Napi::Object>();

    // Set number of threads from options.
    int threads = 0;
    auto maybeThreads = options.Get("threads");
    if (maybeThreads.IsNumber()) {
      threads = maybeThreads.ToNumber().Int32Value();
    }

    // Create options for the interpreter.
    auto interpreterOptions = TfLiteInterpreterOptionsCreate();
    if (threads > 0) {
      TfLiteInterpreterOptionsSetNumThreads(interpreterOptions, threads);
    }

    // Create a model from the model buffer.
    modelData = std::vector<uint8_t>(
        buffer.Data(), buffer.Data() + buffer.ByteLength());

    auto model = TfLiteModelCreate(modelData.data(), modelData.size());
    if (!model) {
      Napi::Error::New(env, "Failed to create tflite model").ThrowAsJavaScriptException();
      TfLiteInterpreterOptionsDelete(interpreterOptions);
      return;
    }

    interpreter = TfLiteInterpreterCreate(model, interpreterOptions);
    if (!interpreter) {
      Napi::Error::New(env, "Failed to create tflite interpreter").ThrowAsJavaScriptException();
      TfLiteModelDelete(model);
      TfLiteInterpreterOptionsDelete(interpreterOptions);
      return;
    }

    // Allocate tensors
    throwIfError(env, "Failed to allocate tensors",
                TfLiteInterpreterAllocateTensors(interpreter));

    TfLiteModelDelete(model);
    TfLiteInterpreterOptionsDelete(interpreterOptions);

    // // Construct input tensor objects
    // int inputTensorCount = TfLiteInterpreterGetInputTensorCount(interpreter);
    // Napi::Array inputTensorArray = Napi::Array::New(env, inputTensorCount);
    // for (int id = 0; id < inputTensorCount; id++) {
    //   const TfLiteTensor* tensor = TfLiteInterpreterGetInputTensor(interpreter, id);
    //   auto wrappedTensorInfo = TensorInfo::constructor.New({});
    //   auto tensorInfo = TensorInfo::Unwrap(wrappedTensorInfo);
    //   tensorInfo->id = id;
    //   tensorInfo->tensor = tensor;

    //   inputTensorArray[id] = wrappedTensorInfo;
    // }
    // inputTensorInfos = inputTensorArray;

    // // Construct output tensor objects
    // int outputTensorCount = TfLiteInterpreterGetOutputTensorCount(interpreter);
    // Napi::Array outputTensorArray = Napi::Array::New(env, outputTensorCount);
    // for (int id = 0; id < outputTensorCount; id++) {
    //   const TfLiteTensor* tensor = TfLiteInterpreterGetOutputTensor(interpreter, id);
    //   auto wrappedTensorInfo = TensorInfo::constructor.New({});
    //   auto tensorInfo = TensorInfo::Unwrap(wrappedTensorInfo);
    //   tensorInfo->id = id;
    //   tensorInfo->tensor = tensor;

    //   outputTensorArray[id] = wrappedTensorInfo;
    // }
    // outputTensorInfos = outputTensorArray;
  }

  Napi::Value GetInputs(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int inputTensorCount = TfLiteInterpreterGetInputTensorCount(interpreter);
    Napi::Array inputTensorArray = Napi::Array::New(info.Env(), inputTensorCount);
    for (int id = 0; id < inputTensorCount; id++) {
      const TfLiteTensor* tensor = TfLiteInterpreterGetInputTensor(interpreter, id);
      auto wrappedTensorInfo = TensorInfo::constructor.New({});
      auto tensorInfo = TensorInfo::Unwrap(wrappedTensorInfo);
      tensorInfo->setTensor(env, tensor, id);
      // tensorInfo->id = id;
      // tensorInfo->tensor = tensor;
      inputTensorArray[id] = wrappedTensorInfo;
    }
    return inputTensorArray;
    //    return inputTensorInfos;
  }

  Napi::Value GetOutputs(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int outputTensorCount = TfLiteInterpreterGetOutputTensorCount(interpreter);
    Napi::Array outputTensorArray = Napi::Array::New(info.Env(), outputTensorCount);
    for (int id = 0; id < outputTensorCount; id++) {
      const TfLiteTensor* tensor = TfLiteInterpreterGetOutputTensor(interpreter, id);
      auto wrappedTensorInfo = TensorInfo::constructor.New({});
      auto tensorInfo = TensorInfo::Unwrap(wrappedTensorInfo);
      tensorInfo->setTensor(env, tensor, id);
      //tensorInfo->id = id;
      //tensorInfo->tensor = tensor;

      outputTensorArray[id] = wrappedTensorInfo;
    }
    return outputTensorArray;

    // return outputTensorInfos;
  }

  ~Interpreter() {
    TfLiteInterpreterDelete(interpreter);
  }

 private:
  TfLiteInterpreter *interpreter = nullptr;
  Napi::Value inputTensorInfos;
  Napi::Value outputTensorInfos;
  std::vector<uint8_t> modelData;

  Napi::Value Infer(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    throwIfError(env, "Failed to invoke interpreter", TfLiteInterpreterInvoke(interpreter));

    return Napi::Boolean::New(env, true);
  }

  void throwIfError(Napi::Env &env, std::string message, TfLiteStatus status) {
    if (status != kTfLiteOk) {
      Napi::Error::New(env, message + ": " + decodeStatus(status)).ThrowAsJavaScriptException();
    }
  }

  std::string decodeStatus(TfLiteStatus status) {
    switch (status) {
      case kTfLiteOk:
        return "Ok";
      case kTfLiteError:
        return "Unexpected Interpreter Error";
      case kTfLiteDelegateError:
        return "Error from delegate";
      case kTfLiteApplicationError:
        return "Incompatability between runtime and delegate, \
            possibly due to applying a delegate to a model graph \
            that is already immutable";
      case kTfLiteDelegateDataNotFound:
        return "Serialized delegate data not found";
      case kTfLiteDelegateDataWriteError:
        return "Could not write serialized data to delegate";
      case kTfLiteDelegateDataReadError:
        return "Could not read serialized data from delegate";
      case kTfLiteUnresolvedOps:
        return "Model contains ops that cannot be resolved at runtime";
    }
    return "Unknown status code";
  }

};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  Interpreter::Init(env, exports);
  TensorInfo::Init(env, exports);

  return exports;
}

NODE_API_MODULE(hello, Init)
