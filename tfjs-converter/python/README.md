# tensorflowjs: The Python Package for TensorFlow.js

The **tensorflowjs** pip package contains libraries and tools for
[TensorFlow.js](https://js.tensorflow.org).

Use following command to install the library with support of interactive CLI:
```bash
pip install tensorflowjs[wizard]
```

Then, run the following to see a list of CLI options

```bash
tensorflowjs_converter --help
```

or, use the wizard

```bash
tensorflowjs_wizard
```

Alternatively, run the converter via its Bazel target. This must be run from withing the tfjs repo:

```bash
yarn bazel run //tfjs-converter/python/tensorflowjs/converters:converter -- --help
```

## Development

The python tests are run with Bazel.

```bash
yarn bazel test //tfjs-converter/python/...
```

Alternatively, run `yarn run-python-tests` to run the above command.

To debug a specific test case, use the `--test-filter` option. For example,

```bash
yarn bazel test //tfjs-converter/python/tensorflowjs/converters:tf_saved_model_conversion_v2_test --test_filter=ConvertTest.test_convert_saved_model_above_2gb
```
