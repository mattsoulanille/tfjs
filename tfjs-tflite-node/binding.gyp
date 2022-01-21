##
# @license
# Copyright 2022 Google LLC. All Rights Reserved.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =============================================================================

# Node.js TensorFlow Binding config:
{
  'variables' : {
    'tflite_include_dir' : '<(module_root_dir)/deps/include',
    'tflite_headers' : [
      '<@(tflite_include_dir)/tflite/c/c_api.h',
      '<@(tflite_include_dir)/tflite/c/eager/c_api.h',
    ],
    'tflite-library-action': 'move'
  },
  'targets' : [{
    'target_name' : 'node_tflite_binding',
    'sources' : [
#      'binding/tfjs_backend.cc',
      'binding/node_tflite_binding.cc'
    ],
    'include_dirs' : [
        '..',
        '<(tflite_include_dir)',
        "<!@(node -p \"require('node-addon-api').include\")"
    ],
    'conditions' : [
      [
        'OS=="linux"', {
          'libraries' : [
            '<(module_root_dir)/deps/lib/libtensorflowlite_c.so',
            '-Wl,-rpath,\$$ORIGIN/../../deps/lib'
            #'-ltensorflowlite',
            #'-ltflite_framework',
          ]
#          'library_dirs' : ['<(module_root_dir)/deps/lib'],
        }
      ]
    #   [
    #     'OS=="mac"', {
    #       'libraries' : [
    #         '<(module_root_dir)/deps/lib/libtflite.2.dylib',
    #         '<(module_root_dir)/deps/lib/libtflite_framework.2.dylib',
    #       ],
    #       'postbuilds': [
    #         {
    #           'postbuild_name': 'Adjust libtflite load path',
    #           'action': [
    #             'install_name_tool',
    #             "-change",
    #             "@rpath/libtflite.2.dylib",
    #             "@loader_path/../../deps/lib/libtflite.2.dylib",
    #             "<(PRODUCT_DIR)/node_tflite_binding.node"
    #           ]
    #         },
    #         {
    #           'postbuild_name': 'Adjust libtflite_framework load path',
    #           'action': [
    #             'install_name_tool',
    #             "-change",
    #             "@rpath/libtflite_framework.2.dylib",
    #             "@loader_path/../../deps/lib/libtflite_framework.2.dylib",
    #             "<(PRODUCT_DIR)/node_tflite_binding.node"
    #           ]
    #         }
    #       ],
    #     }
    #   ],
    #   [
    #     'OS=="win"', {
    #       'defines': ['COMPILER_MSVC'],
    #       'libraries': ['tflite'],
    #       'library_dirs' : ['<(module_root_dir)/deps/lib'],
    #       'variables': {
    #         'tflite-library-target': 'windows'
    #       },
    #       'msvs_disabled_warnings': [
    #         # Warning	C4190: 'TF_NewWhile' has C-linkage specified, but returns
    #         # UDT 'TF_WhileParams' which is incompatible with C.
    #         # (in include/tflite/c/c_api.h)
    #         4190
    #       ]
    #     },
    #   ],
    ],
    "defines" : [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
    ]
  }
  # , {
  #     "target_name": "action_after_build",
  #     "type": "none",
  #     "dependencies": [ "<(module_name)" ],
  #     "copies": [
  #       {
  #         "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
  #         "destination": "<(module_path)"
  #       }
  #     ]
  #   }
    ],
  "defines": [
      "NAPI_VERSION=<(napi_build_version)"
  ]
}
