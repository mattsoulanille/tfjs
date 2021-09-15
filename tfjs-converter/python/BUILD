load("@rules_python//python:defs.bzl", "py_runtime_pair")
load("@rules_python//python:packaging.bzl", "py_package", "py_wheel")

package(default_visibility = ["//visibility:public"])

py_runtime(
    name = "python3_runtime",
    files = ["@python3_interpreter//:files"],
    interpreter = "@python3_interpreter//:python3_bin",
    python_version = "PY3",
    visibility = ["//visibility:public"],
)

py_runtime(
    name = "python2_runtime",
    files = ["@python2_interpreter//:files"],
    interpreter = "@python2_interpreter//:python_bin",
    python_version = "PY2",
    visibility = ["//visibility:public"],
)

py_runtime_pair(
    name = "tfjs_py_runtime_pair",
    py2_runtime = ":python2_runtime",
    py3_runtime = ":python3_runtime",
)

toolchain(
    name = "tfjs_py_toolchain",
    toolchain = ":tfjs_py_runtime_pair",
    toolchain_type = "@bazel_tools//tools/python:toolchain_type",
)

constraint_value(
    name = "usr_bin_python2",
    constraint_setting = "@bazel_tools//tools/python:py2_interpreter_path",
)

constraint_value(
    name = "usr_bin_python3",
    constraint_setting = "@bazel_tools//tools/python:py3_interpreter_path",
)

platform(
    name = "native_python",
    constraint_values = [
        ":usr_bin_python2",
        ":usr_bin_python3",
    ],
)

py_runtime(
    name = "native_python2_runtime",
    interpreter_path = "/usr/bin/python2",
    python_version = "PY2",
)

py_runtime(
    name = "native_python3_runtime",
    interpreter_path = "/usr/bin/python3",
    python_version = "PY3",
)

py_runtime_pair(
    name = "native_py_runtime_pair",
    py2_runtime = ":native_python2_runtime",
    py3_runtime = ":native_python3_runtime",
)

toolchain(
    name = "native_py_toolchain",
    target_compatible_with = [
        # Make sure this toolchain is only selected for a target platform that
        # advertises that it has interpreters available under /usr/bin.
        ":usr_bin_python2",
        ":usr_bin_python3",
    ],
    toolchain = ":native_py_runtime_pair",
    toolchain_type = "@bazel_tools//tools/python:toolchain_type",
)

# Used for CI
platform(
    name = "native_python_platform",
    constraint_values = [
        "@platforms//os:linux",
        "@platforms//cpu:x86_64",
        ":usr_bin_python2",
        ":usr_bin_python3",
    ],
)

licenses(["notice"])  # Apache 2.0

CONSOLE_SCRIPTS = {
    "tensorflowjs_converter": "tensorflowjs.converters.converter:pip_main",
    "tensorflowjs_wizard": "tensorflowjs.converters.wizard:pip_main",
}

py_package(
    name = "tensorflowjs_pkg",
    # Only include these Python packages.
    packages = ["tfjs-converter/python/tensorflowjs"],
    deps = ["//tfjs-converter/python/tensorflowjs"],
)

py_wheel(
    name = "python3_wheel",
    author = "Google LLC",
    author_email = "opensource@google.com",
    classifiers = [
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Intended Audience :: Education",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: JavaScript",
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 3",
        "Topic :: Scientific/Engineering",
        "Topic :: Scientific/Engineering :: Mathematics",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Software Development",
        "Topic :: Software Development :: Libraries",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    console_scripts = CONSOLE_SCRIPTS,
    description_file = ":README.md",
    distribution = "tensorflowjs",
    extra_requires = {
        "PyInquirer": ["PyInquirer==1.0.3"],
        "all": ["PyInquirer==1.0.3"],
        "wizard": ["PyInquirer==1.0.3"],
    },
    homepage = "https://js.tensorflow.org/",
    license = "Apache 2.0",
    python_tag = "py3",
    requires = [
        "tensorflow>=2.1.0,<3",
        "six>=1.12.0,<2",
        "tensorflow-hub>=0.7.0,<0.13",
    ],
    strip_path_prefixes = [
        "tfjs-converter/python",
    ],
    version = "0.0.0",
    #keywords='tensorflow javascript machine deep learning converter',
    deps = [
        ":tensorflowjs_pkg",
        "//tfjs-converter/python/tensorflowjs",
    ],
)

py_wheel(
    name = "python2_wheel",
    author = "Google LLC",
    author_email = "opensource@google.com",
    classifiers = [
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Intended Audience :: Education",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: JavaScript",
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 3",
        "Topic :: Scientific/Engineering",
        "Topic :: Scientific/Engineering :: Mathematics",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Software Development",
        "Topic :: Software Development :: Libraries",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    console_scripts = CONSOLE_SCRIPTS,
    description_file = ":README.md",
    distribution = "tensorflowjs",
    extra_requires = {
        "PyInquirer": ["PyInquirer==1.0.3"],
        "all": ["PyInquirer==1.0.3"],
        "wizard": ["PyInquirer==1.0.3"],
    },
    homepage = "https://js.tensorflow.org/",
    license = "Apache 2.0",
    python_tag = "py2",
    requires = [
        "tensorflow>=2.1.0,<3",
        "protobuf==3.17.3",
        "six>=1.12.0,<2",
        "tensorflow-hub>=0.7.0,<0.10",
    ],
    strip_path_prefixes = [
        "tfjs-converter/python",
    ],
    version = "0.0.0",
    #keywords='tensorflow javascript machine deep learning converter',
    deps = [
        ":tensorflowjs_pkg",
        "//tfjs-converter/python/tensorflowjs",
    ],
)
