load("@rules_nodejs//nodejs:providers.bzl", "DeclarationInfo", "JSModuleInfo", "LinkablePackageInfo")
load("@build_bazel_rules_nodejs//:providers.bzl", "JSEcmaScriptModuleInfo", "JSNamedModuleInfo")
load("@build_bazel_rules_nodejs//internal/pkg_npm:pkg_npm.bzl", "create_package", "PKG_NPM_ATTRS", "PKG_NPM_OUTPUTS")



def _tfjs_package(ctx):
    deps_files_depsets = []

    for dep in ctx.attr.deps:
        # Collect whatever is in the "data"
        deps_files_depsets.append(dep.data_runfiles.files)

        # Only collect DefaultInfo files (not transitive)
        deps_files_depsets.append(dep.files)

        # All direct & transitive JavaScript-producing deps
        if JSModuleInfo in dep:
            deps_files_depsets.append(dep[JSModuleInfo].sources)

        # # All direct and transitive deps that produce CommonJS modules
        if JSNamedModuleInfo in dep:
            print(dir(ctx))
            print(dep)
            print(dir(dep))
            print(dep.module_name)
            f = dep[JSNamedModuleInfo].sources.to_list()[10]
            print(dir(f))
            print(f.owner)
            print(dir(f.owner))
            print(f.owner)
            deps_files_depsets.append(dep[JSNamedModuleInfo].sources)

        # All direct and transitive deps that produce ES6 modules
        if JSEcmaScriptModuleInfo in dep:
            deps_files_depsets.append(dep[JSEcmaScriptModuleInfo].sources)

        # Include all transitive declarations
        if DeclarationInfo in dep:
            deps_files_depsets.append(dep[DeclarationInfo].transitive_declarations)

    # Note: to_list() should be called once per rule!
    deps_files = depset(transitive = deps_files_depsets).to_list()

    package_dir = create_package(ctx, deps_files, ctx.files.nested_packages)

    package_dir_depset = depset([package_dir])

    result = [
        DefaultInfo(
            files = package_dir_depset,
            runfiles = ctx.runfiles([package_dir]),
        ),
    ]

    if ctx.attr.package_name:
        result.append(LinkablePackageInfo(
            package_name = ctx.attr.package_name,
            package_path = ctx.attr.package_path,
            path = package_dir.path,
            files = package_dir_depset,
        ))

    return result

_tfjs_package_rule = rule(
    implementation = _tfjs_package,
    attrs = PKG_NPM_ATTRS,
#    doc = _DOC,
    outputs = PKG_NPM_OUTPUTS,
)

def tfjs_package(name, tgz = None, **kwargs):
    """Wrapper macro around pkg_npm
    Args:
        name: Unique name for this target
        tgz: If provided, creates a `.tar` target that can be used as an action input version of `.pack`
        **kwargs: All other args forwarded to pkg_npm
    """
    _tfjs_package_rule(
        name = name,
        **kwargs
    )

    native.alias(
        name = name + ".pack",
        actual = select({
            "@bazel_tools//src/conditions:host_windows": name + ".pack.bat",
            "//conditions:default": name + ".pack.sh",
        }),
    )

    native.alias(
        name = name + ".publish",
        actual = select({
            "@bazel_tools//src/conditions:host_windows": name + ".publish.bat",
            "//conditions:default": name + ".publish.sh",
        }),
    )

    if tgz != None:
        if not tgz.endswith(".tgz"):
            fail("tgz output for pkg_npm %s must produce a .tgz file" % name)

        native.genrule(
            name = "%s.tar" % name,
            outs = [tgz],
            # NOTE(mattem): on windows, it seems to output a buch of other stuff on stdout when piping, so pipe to tail
            # and grab the last line
            cmd = "$(location :%s.pack) 2>/dev/null | tail -1 | xargs -I {} cp {} $@" % name,
            srcs = [
                name,
            ],
            tools = [
                ":%s.pack" % name,
            ],
            tags = [
                "local",
            ],
            visibility = kwargs.get("visibility"),
        )
