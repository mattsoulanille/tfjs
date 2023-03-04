# TFLite WASM Build

Build with the following command (or build another target that depends on it). Note the required copts.
```
bazel build --copt=-Wno-deprecated-declarations --copt=-Wno-deprecated-builtins --copt=-Wno-unused-but-set-variable tflite_model_runner_wasm
```
