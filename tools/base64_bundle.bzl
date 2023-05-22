# Copyright 2023 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =============================================================================

load("@build_bazel_rules_nodejs//:providers.bzl", "run_node")

def _base64_bundle_impl(ctx):
    print("Hello")
    output_file = ctx.actions.declare_file(ctx.attr.name + ".ts")
    input_paths = [src.path for src in ctx.files.srcs]
    print(input_paths)

    run_node(
        ctx,
        executable = "base64_bundle_bin",
        inputs = ctx.files.srcs,
        outputs = [output_file],
        arguments = [
            "-o",
            output_file.path,
        ] + input_paths,
    )

    return [DefaultInfo(files = depset([output_file]))]

base64_bundle = rule(
    implementation = _base64_bundle_impl,
    attrs = {
        "base64_bundle_bin": attr.label(
            executable = True,
            cfg = "exec",
            default = Label("@//tools:base64_bundle_bin"),
            doc = "The script that generates the bundle",
        ),
        "srcs": attr.label_list(
            doc = "Files to bundle",
            allow_files = True,
            mandatory = True,
        ),
    },
    doc = """Bundle files as base64-encoded strings into a typescript file""",
)
