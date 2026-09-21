
```
suika_v6
├─ README.md
├─ backend
│  ├─ .python-version
│  ├─ .venv
│  │  ├─ .lock
│  │  ├─ CACHEDIR.TAG
│  │  ├─ bin
│  │  │  ├─ activate
│  │  │  ├─ activate.bat
│  │  │  ├─ activate.csh
│  │  │  ├─ activate.fish
│  │  │  ├─ activate.nu
│  │  │  ├─ activate.ps1
│  │  │  ├─ activate.xsh
│  │  │  ├─ activate_this.py
│  │  │  ├─ alembic
│  │  │  ├─ backend
│  │  │  ├─ deactivate.bat
│  │  │  ├─ dotenv
│  │  │  ├─ fastapi
│  │  │  ├─ idna
│  │  │  ├─ mako-render
│  │  │  ├─ pydoc.bat
│  │  │  ├─ python
│  │  │  ├─ python3
│  │  │  ├─ python3.14
│  │  │  └─ uvicorn
│  │  ├─ lib
│  │  │  └─ python3.14
│  │  │     └─ site-packages
│  │  │        ├─ _virtualenv.pth
│  │  │        ├─ _virtualenv.py
│  │  │        ├─ alembic
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ __main__.py
│  │  │        │  ├─ autogenerate
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ api.py
│  │  │        │  │  ├─ compare
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ comments.py
│  │  │        │  │  │  ├─ constraints.py
│  │  │        │  │  │  ├─ schema.py
│  │  │        │  │  │  ├─ server_defaults.py
│  │  │        │  │  │  ├─ tables.py
│  │  │        │  │  │  ├─ types.py
│  │  │        │  │  │  └─ util.py
│  │  │        │  │  ├─ render.py
│  │  │        │  │  └─ rewriter.py
│  │  │        │  ├─ command.py
│  │  │        │  ├─ config.py
│  │  │        │  ├─ context.py
│  │  │        │  ├─ context.pyi
│  │  │        │  ├─ ddl
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _autogen.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ impl.py
│  │  │        │  │  ├─ mssql.py
│  │  │        │  │  ├─ mysql.py
│  │  │        │  │  ├─ oracle.py
│  │  │        │  │  ├─ postgresql.py
│  │  │        │  │  └─ sqlite.py
│  │  │        │  ├─ environment.py
│  │  │        │  ├─ ext
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  └─ checkconstraint_byname.py
│  │  │        │  ├─ migration.py
│  │  │        │  ├─ op.py
│  │  │        │  ├─ op.pyi
│  │  │        │  ├─ operations
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ batch.py
│  │  │        │  │  ├─ ops.py
│  │  │        │  │  ├─ schemaobj.py
│  │  │        │  │  └─ toimpl.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ runtime
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ environment.py
│  │  │        │  │  ├─ migration.py
│  │  │        │  │  └─ plugins.py
│  │  │        │  ├─ script
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ revision.py
│  │  │        │  │  └─ write_hooks.py
│  │  │        │  ├─ templates
│  │  │        │  │  ├─ async
│  │  │        │  │  │  ├─ README
│  │  │        │  │  │  ├─ alembic.ini.mako
│  │  │        │  │  │  ├─ env.py
│  │  │        │  │  │  └─ script.py.mako
│  │  │        │  │  ├─ generic
│  │  │        │  │  │  ├─ README
│  │  │        │  │  │  ├─ alembic.ini.mako
│  │  │        │  │  │  ├─ env.py
│  │  │        │  │  │  └─ script.py.mako
│  │  │        │  │  ├─ multidb
│  │  │        │  │  │  ├─ README
│  │  │        │  │  │  ├─ alembic.ini.mako
│  │  │        │  │  │  ├─ env.py
│  │  │        │  │  │  └─ script.py.mako
│  │  │        │  │  ├─ pyproject
│  │  │        │  │  │  ├─ README
│  │  │        │  │  │  ├─ alembic.ini.mako
│  │  │        │  │  │  ├─ env.py
│  │  │        │  │  │  ├─ pyproject.toml.mako
│  │  │        │  │  │  └─ script.py.mako
│  │  │        │  │  └─ pyproject_async
│  │  │        │  │     ├─ README
│  │  │        │  │     ├─ alembic.ini.mako
│  │  │        │  │     ├─ env.py
│  │  │        │  │     ├─ pyproject.toml.mako
│  │  │        │  │     └─ script.py.mako
│  │  │        │  ├─ testing
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ assertions.py
│  │  │        │  │  ├─ env.py
│  │  │        │  │  ├─ fixtures.py
│  │  │        │  │  ├─ plugin
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  └─ bootstrap.py
│  │  │        │  │  ├─ requirements.py
│  │  │        │  │  ├─ schemacompare.py
│  │  │        │  │  ├─ suite
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ _autogen_fixtures.py
│  │  │        │  │  │  ├─ test_autogen_comments.py
│  │  │        │  │  │  ├─ test_autogen_computed.py
│  │  │        │  │  │  ├─ test_autogen_diffs.py
│  │  │        │  │  │  ├─ test_autogen_fks.py
│  │  │        │  │  │  ├─ test_autogen_identity.py
│  │  │        │  │  │  ├─ test_environment.py
│  │  │        │  │  │  └─ test_op.py
│  │  │        │  │  ├─ util.py
│  │  │        │  │  └─ warnings.py
│  │  │        │  └─ util
│  │  │        │     ├─ __init__.py
│  │  │        │     ├─ compat.py
│  │  │        │     ├─ editor.py
│  │  │        │     ├─ exc.py
│  │  │        │     ├─ langhelpers.py
│  │  │        │     ├─ messaging.py
│  │  │        │     ├─ pyfiles.py
│  │  │        │     └─ sqla_compat.py
│  │  │        ├─ alembic-1.20.0.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ entry_points.txt
│  │  │        │  ├─ licenses
│  │  │        │  │  └─ LICENSE
│  │  │        │  └─ top_level.txt
│  │  │        ├─ annotated_doc
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ main.py
│  │  │        │  └─ py.typed
│  │  │        ├─ annotated_doc-0.0.5.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ entry_points.txt
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE
│  │  │        ├─ annotated_types
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ py.typed
│  │  │        │  └─ test_cases.py
│  │  │        ├─ annotated_types-0.8.0.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE
│  │  │        ├─ anyio
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _backends
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _asyncio.py
│  │  │        │  │  └─ _trio.py
│  │  │        │  ├─ _core
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _asyncio_selector_thread.py
│  │  │        │  │  ├─ _concurrency_utils.py
│  │  │        │  │  ├─ _contextmanagers.py
│  │  │        │  │  ├─ _eventloop.py
│  │  │        │  │  ├─ _exceptions.py
│  │  │        │  │  ├─ _fileio.py
│  │  │        │  │  ├─ _futures.py
│  │  │        │  │  ├─ _resources.py
│  │  │        │  │  ├─ _signals.py
│  │  │        │  │  ├─ _sockets.py
│  │  │        │  │  ├─ _streams.py
│  │  │        │  │  ├─ _subprocesses.py
│  │  │        │  │  ├─ _synchronization.py
│  │  │        │  │  ├─ _tasks.py
│  │  │        │  │  ├─ _tempfile.py
│  │  │        │  │  ├─ _testing.py
│  │  │        │  │  └─ _typedattr.py
│  │  │        │  ├─ _lazyimport.py
│  │  │        │  ├─ abc
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _eventloop.py
│  │  │        │  │  ├─ _resources.py
│  │  │        │  │  ├─ _sockets.py
│  │  │        │  │  ├─ _streams.py
│  │  │        │  │  ├─ _subprocesses.py
│  │  │        │  │  ├─ _tasks.py
│  │  │        │  │  └─ _testing.py
│  │  │        │  ├─ from_thread.py
│  │  │        │  ├─ functools.py
│  │  │        │  ├─ itertools.py
│  │  │        │  ├─ lowlevel.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ pytest_plugin.py
│  │  │        │  ├─ streams
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ buffered.py
│  │  │        │  │  ├─ file.py
│  │  │        │  │  ├─ memory.py
│  │  │        │  │  ├─ stapled.py
│  │  │        │  │  ├─ text.py
│  │  │        │  │  └─ tls.py
│  │  │        │  ├─ to_interpreter.py
│  │  │        │  ├─ to_process.py
│  │  │        │  └─ to_thread.py
│  │  │        ├─ anyio-4.15.1.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ entry_points.txt
│  │  │        │  ├─ licenses
│  │  │        │  │  └─ LICENSE
│  │  │        │  └─ top_level.txt
│  │  │        ├─ backend-0.1.0.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ direct_url.json
│  │  │        │  ├─ entry_points.txt
│  │  │        │  ├─ uv_build.json
│  │  │        │  └─ uv_cache.json
│  │  │        ├─ backend.pth
│  │  │        ├─ click
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _compat.py
│  │  │        │  ├─ _termui_impl.py
│  │  │        │  ├─ _textwrap.py
│  │  │        │  ├─ _utils.py
│  │  │        │  ├─ _winconsole.py
│  │  │        │  ├─ core.py
│  │  │        │  ├─ decorators.py
│  │  │        │  ├─ exceptions.py
│  │  │        │  ├─ formatting.py
│  │  │        │  ├─ globals.py
│  │  │        │  ├─ parser.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ shell_completion.py
│  │  │        │  ├─ termui.py
│  │  │        │  ├─ testing.py
│  │  │        │  ├─ types.py
│  │  │        │  └─ utils.py
│  │  │        ├─ click-8.5.0.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE.txt
│  │  │        ├─ dotenv
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ __main__.py
│  │  │        │  ├─ cli.py
│  │  │        │  ├─ ipython.py
│  │  │        │  ├─ main.py
│  │  │        │  ├─ parser.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ variables.py
│  │  │        │  └─ version.py
│  │  │        ├─ fastapi
│  │  │        │  ├─ .agents
│  │  │        │  │  └─ skills
│  │  │        │  │     └─ fastapi
│  │  │        │  │        ├─ SKILL.md
│  │  │        │  │        └─ references
│  │  │        │  │           ├─ dependencies.md
│  │  │        │  │           ├─ other-tools.md
│  │  │        │  │           ├─ path-operations.md
│  │  │        │  │           ├─ pydantic.md
│  │  │        │  │           ├─ responses.md
│  │  │        │  │           └─ streaming.md
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ __main__.py
│  │  │        │  ├─ _compat
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ shared.py
│  │  │        │  │  └─ v2.py
│  │  │        │  ├─ applications.py
│  │  │        │  ├─ background.py
│  │  │        │  ├─ cli.py
│  │  │        │  ├─ concurrency.py
│  │  │        │  ├─ datastructures.py
│  │  │        │  ├─ dependencies
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ models.py
│  │  │        │  │  └─ utils.py
│  │  │        │  ├─ encoders.py
│  │  │        │  ├─ exception_handlers.py
│  │  │        │  ├─ exceptions.py
│  │  │        │  ├─ logger.py
│  │  │        │  ├─ middleware
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ asyncexitstack.py
│  │  │        │  │  ├─ cors.py
│  │  │        │  │  ├─ gzip.py
│  │  │        │  │  ├─ httpsredirect.py
│  │  │        │  │  ├─ trustedhost.py
│  │  │        │  │  └─ wsgi.py
│  │  │        │  ├─ openapi
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ constants.py
│  │  │        │  │  ├─ docs.py
│  │  │        │  │  ├─ models.py
│  │  │        │  │  └─ utils.py
│  │  │        │  ├─ param_functions.py
│  │  │        │  ├─ params.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ requests.py
│  │  │        │  ├─ responses.py
│  │  │        │  ├─ routing.py
│  │  │        │  ├─ security
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ api_key.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ http.py
│  │  │        │  │  ├─ oauth2.py
│  │  │        │  │  ├─ open_id_connect_url.py
│  │  │        │  │  └─ utils.py
│  │  │        │  ├─ sse.py
│  │  │        │  ├─ staticfiles.py
│  │  │        │  ├─ templating.py
│  │  │        │  ├─ testclient.py
│  │  │        │  ├─ types.py
│  │  │        │  ├─ utils.py
│  │  │        │  └─ websockets.py
│  │  │        ├─ fastapi-0.141.1.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ entry_points.txt
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE
│  │  │        ├─ h11
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _abnf.py
│  │  │        │  ├─ _connection.py
│  │  │        │  ├─ _events.py
│  │  │        │  ├─ _headers.py
│  │  │        │  ├─ _readers.py
│  │  │        │  ├─ _receivebuffer.py
│  │  │        │  ├─ _state.py
│  │  │        │  ├─ _util.py
│  │  │        │  ├─ _version.py
│  │  │        │  ├─ _writers.py
│  │  │        │  └─ py.typed
│  │  │        ├─ h11-0.16.0.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ licenses
│  │  │        │  │  └─ LICENSE.txt
│  │  │        │  └─ top_level.txt
│  │  │        ├─ idna
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ __main__.py
│  │  │        │  ├─ cli.py
│  │  │        │  ├─ codec.py
│  │  │        │  ├─ compat.py
│  │  │        │  ├─ core.py
│  │  │        │  ├─ idnadata.py
│  │  │        │  ├─ intranges.py
│  │  │        │  ├─ package_data.py
│  │  │        │  ├─ py.typed
│  │  │        │  └─ uts46data.py
│  │  │        ├─ idna-3.20.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ entry_points.txt
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE.md
│  │  │        ├─ mako
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _ast_util.py
│  │  │        │  ├─ ast.py
│  │  │        │  ├─ cache.py
│  │  │        │  ├─ cmd.py
│  │  │        │  ├─ codegen.py
│  │  │        │  ├─ compat.py
│  │  │        │  ├─ exceptions.py
│  │  │        │  ├─ ext
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ autohandler.py
│  │  │        │  │  ├─ babelplugin.py
│  │  │        │  │  ├─ beaker_cache.py
│  │  │        │  │  ├─ extract.py
│  │  │        │  │  ├─ linguaplugin.py
│  │  │        │  │  ├─ preprocessors.py
│  │  │        │  │  ├─ pygmentplugin.py
│  │  │        │  │  └─ turbogears.py
│  │  │        │  ├─ filters.py
│  │  │        │  ├─ lexer.py
│  │  │        │  ├─ lookup.py
│  │  │        │  ├─ parsetree.py
│  │  │        │  ├─ pygen.py
│  │  │        │  ├─ pyparser.py
│  │  │        │  ├─ runtime.py
│  │  │        │  ├─ template.py
│  │  │        │  ├─ testing
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _config.py
│  │  │        │  │  ├─ assertions.py
│  │  │        │  │  ├─ config.py
│  │  │        │  │  ├─ exclusions.py
│  │  │        │  │  ├─ fixtures.py
│  │  │        │  │  └─ helpers.py
│  │  │        │  └─ util.py
│  │  │        ├─ mako-1.4.1.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ entry_points.txt
│  │  │        │  ├─ licenses
│  │  │        │  │  └─ LICENSE
│  │  │        │  └─ top_level.txt
│  │  │        ├─ markupsafe
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _native.py
│  │  │        │  ├─ _speedups.c
│  │  │        │  ├─ _speedups.cpython-314-darwin.so
│  │  │        │  ├─ _speedups.pyi
│  │  │        │  └─ py.typed
│  │  │        ├─ markupsafe-3.0.3.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ licenses
│  │  │        │  │  └─ LICENSE.txt
│  │  │        │  └─ top_level.txt
│  │  │        ├─ psycopg2
│  │  │        │  ├─ .dylibs
│  │  │        │  │  ├─ libcom_err.3.0.dylib
│  │  │        │  │  ├─ libcrypto.3.dylib
│  │  │        │  │  ├─ libgssapi_krb5.2.2.dylib
│  │  │        │  │  ├─ libk5crypto.3.1.dylib
│  │  │        │  │  ├─ libkrb5.3.3.dylib
│  │  │        │  │  ├─ libkrb5support.1.1.dylib
│  │  │        │  │  ├─ liblber.2.dylib
│  │  │        │  │  ├─ libldap.2.dylib
│  │  │        │  │  ├─ libpq.5.dylib
│  │  │        │  │  └─ libssl.3.dylib
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _ipaddress.py
│  │  │        │  ├─ _json.py
│  │  │        │  ├─ _psycopg.cpython-314-darwin.so
│  │  │        │  ├─ _range.py
│  │  │        │  ├─ errorcodes.py
│  │  │        │  ├─ errors.py
│  │  │        │  ├─ extensions.py
│  │  │        │  ├─ extras.py
│  │  │        │  ├─ pool.py
│  │  │        │  ├─ sql.py
│  │  │        │  └─ tz.py
│  │  │        ├─ psycopg2_binary-2.9.13.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ licenses
│  │  │        │  │  └─ LICENSE
│  │  │        │  └─ top_level.txt
│  │  │        ├─ pydantic
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _internal
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _config.py
│  │  │        │  │  ├─ _core_metadata.py
│  │  │        │  │  ├─ _core_utils.py
│  │  │        │  │  ├─ _dataclasses.py
│  │  │        │  │  ├─ _decorators.py
│  │  │        │  │  ├─ _decorators_v1.py
│  │  │        │  │  ├─ _discriminated_union.py
│  │  │        │  │  ├─ _docs_extraction.py
│  │  │        │  │  ├─ _fields.py
│  │  │        │  │  ├─ _forward_ref.py
│  │  │        │  │  ├─ _generate_schema.py
│  │  │        │  │  ├─ _generics.py
│  │  │        │  │  ├─ _git.py
│  │  │        │  │  ├─ _import_utils.py
│  │  │        │  │  ├─ _internal_dataclass.py
│  │  │        │  │  ├─ _known_annotated_metadata.py
│  │  │        │  │  ├─ _mock_val_ser.py
│  │  │        │  │  ├─ _model_construction.py
│  │  │        │  │  ├─ _namespace_utils.py
│  │  │        │  │  ├─ _repr.py
│  │  │        │  │  ├─ _schema_gather.py
│  │  │        │  │  ├─ _schema_generation_shared.py
│  │  │        │  │  ├─ _serializers.py
│  │  │        │  │  ├─ _signature.py
│  │  │        │  │  ├─ _typing_extra.py
│  │  │        │  │  ├─ _utils.py
│  │  │        │  │  ├─ _validate_call.py
│  │  │        │  │  └─ _validators.py
│  │  │        │  ├─ _migration.py
│  │  │        │  ├─ alias_generators.py
│  │  │        │  ├─ aliases.py
│  │  │        │  ├─ annotated_handlers.py
│  │  │        │  ├─ class_validators.py
│  │  │        │  ├─ color.py
│  │  │        │  ├─ config.py
│  │  │        │  ├─ dataclasses.py
│  │  │        │  ├─ datetime_parse.py
│  │  │        │  ├─ decorator.py
│  │  │        │  ├─ deprecated
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ class_validators.py
│  │  │        │  │  ├─ config.py
│  │  │        │  │  ├─ copy_internals.py
│  │  │        │  │  ├─ decorator.py
│  │  │        │  │  ├─ json.py
│  │  │        │  │  ├─ parse.py
│  │  │        │  │  └─ tools.py
│  │  │        │  ├─ env_settings.py
│  │  │        │  ├─ error_wrappers.py
│  │  │        │  ├─ errors.py
│  │  │        │  ├─ experimental
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ arguments_schema.py
│  │  │        │  │  ├─ missing_sentinel.py
│  │  │        │  │  └─ pipeline.py
│  │  │        │  ├─ fields.py
│  │  │        │  ├─ functional_serializers.py
│  │  │        │  ├─ functional_validators.py
│  │  │        │  ├─ generics.py
│  │  │        │  ├─ json.py
│  │  │        │  ├─ json_schema.py
│  │  │        │  ├─ main.py
│  │  │        │  ├─ mypy.py
│  │  │        │  ├─ networks.py
│  │  │        │  ├─ parse.py
│  │  │        │  ├─ plugin
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _loader.py
│  │  │        │  │  └─ _schema_validator.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ root_model.py
│  │  │        │  ├─ schema.py
│  │  │        │  ├─ tools.py
│  │  │        │  ├─ type_adapter.py
│  │  │        │  ├─ types.py
│  │  │        │  ├─ typing.py
│  │  │        │  ├─ utils.py
│  │  │        │  ├─ v1
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _hypothesis_plugin.py
│  │  │        │  │  ├─ annotated_types.py
│  │  │        │  │  ├─ class_validators.py
│  │  │        │  │  ├─ color.py
│  │  │        │  │  ├─ config.py
│  │  │        │  │  ├─ dataclasses.py
│  │  │        │  │  ├─ datetime_parse.py
│  │  │        │  │  ├─ decorator.py
│  │  │        │  │  ├─ env_settings.py
│  │  │        │  │  ├─ error_wrappers.py
│  │  │        │  │  ├─ errors.py
│  │  │        │  │  ├─ fields.py
│  │  │        │  │  ├─ generics.py
│  │  │        │  │  ├─ json.py
│  │  │        │  │  ├─ main.py
│  │  │        │  │  ├─ mypy.py
│  │  │        │  │  ├─ networks.py
│  │  │        │  │  ├─ parse.py
│  │  │        │  │  ├─ py.typed
│  │  │        │  │  ├─ schema.py
│  │  │        │  │  ├─ tools.py
│  │  │        │  │  ├─ types.py
│  │  │        │  │  ├─ typing.py
│  │  │        │  │  ├─ utils.py
│  │  │        │  │  ├─ validators.py
│  │  │        │  │  └─ version.py
│  │  │        │  ├─ validate_call_decorator.py
│  │  │        │  ├─ validators.py
│  │  │        │  ├─ version.py
│  │  │        │  └─ warnings.py
│  │  │        ├─ pydantic-2.13.5.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE
│  │  │        ├─ pydantic_core
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _pydantic_core.cpython-314-darwin.so
│  │  │        │  ├─ _pydantic_core.pyi
│  │  │        │  ├─ core_schema.py
│  │  │        │  └─ py.typed
│  │  │        ├─ pydantic_core-2.46.5.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ licenses
│  │  │        │  │  └─ LICENSE
│  │  │        │  └─ sboms
│  │  │        │     └─ pydantic-core.cyclonedx.json
│  │  │        ├─ python_dotenv-1.2.3.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ entry_points.txt
│  │  │        │  ├─ licenses
│  │  │        │  │  └─ LICENSE
│  │  │        │  └─ top_level.txt
│  │  │        ├─ sqlalchemy
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ connectors
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ aioodbc.py
│  │  │        │  │  ├─ asyncio.py
│  │  │        │  │  └─ pyodbc.py
│  │  │        │  ├─ cyextension
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ collections.cpython-314-darwin.so
│  │  │        │  │  ├─ collections.pyx
│  │  │        │  │  ├─ immutabledict.cpython-314-darwin.so
│  │  │        │  │  ├─ immutabledict.pxd
│  │  │        │  │  ├─ immutabledict.pyx
│  │  │        │  │  ├─ processors.cpython-314-darwin.so
│  │  │        │  │  ├─ processors.pyx
│  │  │        │  │  ├─ resultproxy.cpython-314-darwin.so
│  │  │        │  │  ├─ resultproxy.pyx
│  │  │        │  │  ├─ util.cpython-314-darwin.so
│  │  │        │  │  └─ util.pyx
│  │  │        │  ├─ dialects
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _typing.py
│  │  │        │  │  ├─ mssql
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ aioodbc.py
│  │  │        │  │  │  ├─ base.py
│  │  │        │  │  │  ├─ information_schema.py
│  │  │        │  │  │  ├─ json.py
│  │  │        │  │  │  ├─ provision.py
│  │  │        │  │  │  ├─ pymssql.py
│  │  │        │  │  │  └─ pyodbc.py
│  │  │        │  │  ├─ mysql
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ aiomysql.py
│  │  │        │  │  │  ├─ asyncmy.py
│  │  │        │  │  │  ├─ base.py
│  │  │        │  │  │  ├─ cymysql.py
│  │  │        │  │  │  ├─ dml.py
│  │  │        │  │  │  ├─ enumerated.py
│  │  │        │  │  │  ├─ expression.py
│  │  │        │  │  │  ├─ json.py
│  │  │        │  │  │  ├─ mariadb.py
│  │  │        │  │  │  ├─ mariadbconnector.py
│  │  │        │  │  │  ├─ mysqlconnector.py
│  │  │        │  │  │  ├─ mysqldb.py
│  │  │        │  │  │  ├─ provision.py
│  │  │        │  │  │  ├─ pymysql.py
│  │  │        │  │  │  ├─ pyodbc.py
│  │  │        │  │  │  ├─ reflection.py
│  │  │        │  │  │  ├─ reserved_words.py
│  │  │        │  │  │  └─ types.py
│  │  │        │  │  ├─ oracle
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ base.py
│  │  │        │  │  │  ├─ cx_oracle.py
│  │  │        │  │  │  ├─ dictionary.py
│  │  │        │  │  │  ├─ oracledb.py
│  │  │        │  │  │  ├─ provision.py
│  │  │        │  │  │  ├─ types.py
│  │  │        │  │  │  └─ vector.py
│  │  │        │  │  ├─ postgresql
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ _psycopg_common.py
│  │  │        │  │  │  ├─ array.py
│  │  │        │  │  │  ├─ asyncpg.py
│  │  │        │  │  │  ├─ base.py
│  │  │        │  │  │  ├─ dml.py
│  │  │        │  │  │  ├─ ext.py
│  │  │        │  │  │  ├─ hstore.py
│  │  │        │  │  │  ├─ json.py
│  │  │        │  │  │  ├─ named_types.py
│  │  │        │  │  │  ├─ operators.py
│  │  │        │  │  │  ├─ pg8000.py
│  │  │        │  │  │  ├─ pg_catalog.py
│  │  │        │  │  │  ├─ provision.py
│  │  │        │  │  │  ├─ psycopg.py
│  │  │        │  │  │  ├─ psycopg2.py
│  │  │        │  │  │  ├─ psycopg2cffi.py
│  │  │        │  │  │  ├─ ranges.py
│  │  │        │  │  │  └─ types.py
│  │  │        │  │  ├─ sqlite
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ aiosqlite.py
│  │  │        │  │  │  ├─ base.py
│  │  │        │  │  │  ├─ dml.py
│  │  │        │  │  │  ├─ json.py
│  │  │        │  │  │  ├─ provision.py
│  │  │        │  │  │  ├─ pysqlcipher.py
│  │  │        │  │  │  └─ pysqlite.py
│  │  │        │  │  └─ type_migration_guidelines.txt
│  │  │        │  ├─ engine
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _py_processors.py
│  │  │        │  │  ├─ _py_row.py
│  │  │        │  │  ├─ _py_util.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ characteristics.py
│  │  │        │  │  ├─ create.py
│  │  │        │  │  ├─ cursor.py
│  │  │        │  │  ├─ default.py
│  │  │        │  │  ├─ events.py
│  │  │        │  │  ├─ interfaces.py
│  │  │        │  │  ├─ mock.py
│  │  │        │  │  ├─ processors.py
│  │  │        │  │  ├─ reflection.py
│  │  │        │  │  ├─ result.py
│  │  │        │  │  ├─ row.py
│  │  │        │  │  ├─ strategies.py
│  │  │        │  │  ├─ url.py
│  │  │        │  │  └─ util.py
│  │  │        │  ├─ event
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ api.py
│  │  │        │  │  ├─ attr.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ legacy.py
│  │  │        │  │  └─ registry.py
│  │  │        │  ├─ events.py
│  │  │        │  ├─ exc.py
│  │  │        │  ├─ ext
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ associationproxy.py
│  │  │        │  │  ├─ asyncio
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ base.py
│  │  │        │  │  │  ├─ engine.py
│  │  │        │  │  │  ├─ exc.py
│  │  │        │  │  │  ├─ result.py
│  │  │        │  │  │  ├─ scoping.py
│  │  │        │  │  │  └─ session.py
│  │  │        │  │  ├─ automap.py
│  │  │        │  │  ├─ baked.py
│  │  │        │  │  ├─ compiler.py
│  │  │        │  │  ├─ declarative
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  └─ extensions.py
│  │  │        │  │  ├─ horizontal_shard.py
│  │  │        │  │  ├─ hybrid.py
│  │  │        │  │  ├─ indexable.py
│  │  │        │  │  ├─ instrumentation.py
│  │  │        │  │  ├─ mutable.py
│  │  │        │  │  ├─ mypy
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ apply.py
│  │  │        │  │  │  ├─ decl_class.py
│  │  │        │  │  │  ├─ infer.py
│  │  │        │  │  │  ├─ names.py
│  │  │        │  │  │  ├─ plugin.py
│  │  │        │  │  │  └─ util.py
│  │  │        │  │  ├─ orderinglist.py
│  │  │        │  │  └─ serializer.py
│  │  │        │  ├─ future
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  └─ engine.py
│  │  │        │  ├─ inspection.py
│  │  │        │  ├─ log.py
│  │  │        │  ├─ orm
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _orm_constructors.py
│  │  │        │  │  ├─ _typing.py
│  │  │        │  │  ├─ attributes.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ bulk_persistence.py
│  │  │        │  │  ├─ clsregistry.py
│  │  │        │  │  ├─ collections.py
│  │  │        │  │  ├─ context.py
│  │  │        │  │  ├─ decl_api.py
│  │  │        │  │  ├─ decl_base.py
│  │  │        │  │  ├─ dependency.py
│  │  │        │  │  ├─ descriptor_props.py
│  │  │        │  │  ├─ dynamic.py
│  │  │        │  │  ├─ evaluator.py
│  │  │        │  │  ├─ events.py
│  │  │        │  │  ├─ exc.py
│  │  │        │  │  ├─ identity.py
│  │  │        │  │  ├─ instrumentation.py
│  │  │        │  │  ├─ interfaces.py
│  │  │        │  │  ├─ loading.py
│  │  │        │  │  ├─ mapped_collection.py
│  │  │        │  │  ├─ mapper.py
│  │  │        │  │  ├─ path_registry.py
│  │  │        │  │  ├─ persistence.py
│  │  │        │  │  ├─ properties.py
│  │  │        │  │  ├─ query.py
│  │  │        │  │  ├─ relationships.py
│  │  │        │  │  ├─ scoping.py
│  │  │        │  │  ├─ session.py
│  │  │        │  │  ├─ state.py
│  │  │        │  │  ├─ state_changes.py
│  │  │        │  │  ├─ strategies.py
│  │  │        │  │  ├─ strategy_options.py
│  │  │        │  │  ├─ sync.py
│  │  │        │  │  ├─ unitofwork.py
│  │  │        │  │  ├─ util.py
│  │  │        │  │  └─ writeonly.py
│  │  │        │  ├─ pool
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ events.py
│  │  │        │  │  └─ impl.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ schema.py
│  │  │        │  ├─ sql
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ _dml_constructors.py
│  │  │        │  │  ├─ _elements_constructors.py
│  │  │        │  │  ├─ _orm_types.py
│  │  │        │  │  ├─ _py_util.py
│  │  │        │  │  ├─ _selectable_constructors.py
│  │  │        │  │  ├─ _typing.py
│  │  │        │  │  ├─ annotation.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ cache_key.py
│  │  │        │  │  ├─ coercions.py
│  │  │        │  │  ├─ compiler.py
│  │  │        │  │  ├─ crud.py
│  │  │        │  │  ├─ ddl.py
│  │  │        │  │  ├─ default_comparator.py
│  │  │        │  │  ├─ dml.py
│  │  │        │  │  ├─ elements.py
│  │  │        │  │  ├─ events.py
│  │  │        │  │  ├─ expression.py
│  │  │        │  │  ├─ functions.py
│  │  │        │  │  ├─ lambdas.py
│  │  │        │  │  ├─ naming.py
│  │  │        │  │  ├─ operators.py
│  │  │        │  │  ├─ roles.py
│  │  │        │  │  ├─ schema.py
│  │  │        │  │  ├─ selectable.py
│  │  │        │  │  ├─ sqltypes.py
│  │  │        │  │  ├─ traversals.py
│  │  │        │  │  ├─ type_api.py
│  │  │        │  │  ├─ util.py
│  │  │        │  │  └─ visitors.py
│  │  │        │  ├─ testing
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ assertions.py
│  │  │        │  │  ├─ assertsql.py
│  │  │        │  │  ├─ asyncio.py
│  │  │        │  │  ├─ cancellation.py
│  │  │        │  │  ├─ config.py
│  │  │        │  │  ├─ engines.py
│  │  │        │  │  ├─ entities.py
│  │  │        │  │  ├─ exclusions.py
│  │  │        │  │  ├─ fixtures
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ base.py
│  │  │        │  │  │  ├─ mypy.py
│  │  │        │  │  │  ├─ orm.py
│  │  │        │  │  │  └─ sql.py
│  │  │        │  │  ├─ pickleable.py
│  │  │        │  │  ├─ plugin
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ bootstrap.py
│  │  │        │  │  │  ├─ plugin_base.py
│  │  │        │  │  │  └─ pytestplugin.py
│  │  │        │  │  ├─ profiling.py
│  │  │        │  │  ├─ provision.py
│  │  │        │  │  ├─ requirements.py
│  │  │        │  │  ├─ schema.py
│  │  │        │  │  ├─ suite
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ test_cte.py
│  │  │        │  │  │  ├─ test_ddl.py
│  │  │        │  │  │  ├─ test_deprecations.py
│  │  │        │  │  │  ├─ test_dialect.py
│  │  │        │  │  │  ├─ test_insert.py
│  │  │        │  │  │  ├─ test_reflection.py
│  │  │        │  │  │  ├─ test_results.py
│  │  │        │  │  │  ├─ test_rowcount.py
│  │  │        │  │  │  ├─ test_select.py
│  │  │        │  │  │  ├─ test_sequence.py
│  │  │        │  │  │  ├─ test_types.py
│  │  │        │  │  │  ├─ test_unicode_ddl.py
│  │  │        │  │  │  └─ test_update_delete.py
│  │  │        │  │  ├─ util.py
│  │  │        │  │  └─ warnings.py
│  │  │        │  ├─ types.py
│  │  │        │  └─ util
│  │  │        │     ├─ __init__.py
│  │  │        │     ├─ _collections.py
│  │  │        │     ├─ _concurrency_py3k.py
│  │  │        │     ├─ _has_cy.py
│  │  │        │     ├─ _py_collections.py
│  │  │        │     ├─ compat.py
│  │  │        │     ├─ concurrency.py
│  │  │        │     ├─ deprecations.py
│  │  │        │     ├─ langhelpers.py
│  │  │        │     ├─ preloaded.py
│  │  │        │     ├─ queue.py
│  │  │        │     ├─ tool_support.py
│  │  │        │     ├─ topological.py
│  │  │        │     └─ typing.py
│  │  │        ├─ sqlalchemy-2.0.54.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  ├─ licenses
│  │  │        │  │  ├─ AUTHORS
│  │  │        │  │  └─ LICENSE
│  │  │        │  └─ top_level.txt
│  │  │        ├─ starlette
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ _exception_handler.py
│  │  │        │  ├─ _utils.py
│  │  │        │  ├─ applications.py
│  │  │        │  ├─ authentication.py
│  │  │        │  ├─ background.py
│  │  │        │  ├─ concurrency.py
│  │  │        │  ├─ config.py
│  │  │        │  ├─ convertors.py
│  │  │        │  ├─ datastructures.py
│  │  │        │  ├─ endpoints.py
│  │  │        │  ├─ exceptions.py
│  │  │        │  ├─ formparsers.py
│  │  │        │  ├─ middleware
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ authentication.py
│  │  │        │  │  ├─ base.py
│  │  │        │  │  ├─ body_limit.py
│  │  │        │  │  ├─ cors.py
│  │  │        │  │  ├─ errors.py
│  │  │        │  │  ├─ exceptions.py
│  │  │        │  │  ├─ gzip.py
│  │  │        │  │  ├─ httpsredirect.py
│  │  │        │  │  ├─ sessions.py
│  │  │        │  │  ├─ trustedhost.py
│  │  │        │  │  └─ wsgi.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ requests.py
│  │  │        │  ├─ responses.py
│  │  │        │  ├─ routing.py
│  │  │        │  ├─ schemas.py
│  │  │        │  ├─ staticfiles.py
│  │  │        │  ├─ status.py
│  │  │        │  ├─ templating.py
│  │  │        │  ├─ testclient.py
│  │  │        │  ├─ types.py
│  │  │        │  └─ websockets.py
│  │  │        ├─ starlette-1.6.0.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE.md
│  │  │        ├─ typing_extensions-4.16.0.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE
│  │  │        ├─ typing_extensions.py
│  │  │        ├─ typing_inspection
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ introspection.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ typing_objects.py
│  │  │        │  └─ typing_objects.pyi
│  │  │        ├─ typing_inspection-0.4.4.dist-info
│  │  │        │  ├─ INSTALLER
│  │  │        │  ├─ METADATA
│  │  │        │  ├─ RECORD
│  │  │        │  ├─ REQUESTED
│  │  │        │  ├─ WHEEL
│  │  │        │  └─ licenses
│  │  │        │     └─ LICENSE
│  │  │        ├─ uvicorn
│  │  │        │  ├─ __init__.py
│  │  │        │  ├─ __main__.py
│  │  │        │  ├─ _ansi.py
│  │  │        │  ├─ _compat.py
│  │  │        │  ├─ _subprocess.py
│  │  │        │  ├─ _types.py
│  │  │        │  ├─ config.py
│  │  │        │  ├─ importer.py
│  │  │        │  ├─ lifespan
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ off.py
│  │  │        │  │  └─ on.py
│  │  │        │  ├─ logging.py
│  │  │        │  ├─ loops
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ asyncio.py
│  │  │        │  │  ├─ auto.py
│  │  │        │  │  ├─ uvloop.py
│  │  │        │  │  └─ zuvloop.py
│  │  │        │  ├─ main.py
│  │  │        │  ├─ middleware
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ asgi2.py
│  │  │        │  │  ├─ message_logger.py
│  │  │        │  │  ├─ proxy_headers.py
│  │  │        │  │  └─ wsgi.py
│  │  │        │  ├─ protocols
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ http
│  │  │        │  │  │  ├─ __init__.py
│  │  │        │  │  │  ├─ auto.py
│  │  │        │  │  │  ├─ auto_zttp_impl.py
│  │  │        │  │  │  ├─ flow_control.py
│  │  │        │  │  │  ├─ h11_impl.py
│  │  │        │  │  │  ├─ httptools_impl.py
│  │  │        │  │  │  ├─ zttp_h2_impl.py
│  │  │        │  │  │  └─ zttp_impl.py
│  │  │        │  │  ├─ utils.py
│  │  │        │  │  └─ websockets
│  │  │        │  │     ├─ __init__.py
│  │  │        │  │     ├─ auto.py
│  │  │        │  │     ├─ websockets_impl.py
│  │  │        │  │     ├─ websockets_sansio_impl.py
│  │  │        │  │     └─ wsproto_impl.py
│  │  │        │  ├─ py.typed
│  │  │        │  ├─ server.py
│  │  │        │  ├─ supervisors
│  │  │        │  │  ├─ __init__.py
│  │  │        │  │  ├─ basereload.py
│  │  │        │  │  ├─ multiprocess.py
│  │  │        │  │  ├─ statreload.py
│  │  │        │  │  └─ watchfilesreload.py
│  │  │        │  └─ workers.py
│  │  │        └─ uvicorn-0.53.0.dist-info
│  │  │           ├─ INSTALLER
│  │  │           ├─ METADATA
│  │  │           ├─ RECORD
│  │  │           ├─ REQUESTED
│  │  │           ├─ WHEEL
│  │  │           ├─ entry_points.txt
│  │  │           └─ licenses
│  │  │              └─ LICENSE.md
│  │  └─ pyvenv.cfg
│  ├─ README.md
│  ├─ pyproject.toml
│  ├─ src
│  │  └─ backend
│  │     └─ __init__.py
│  └─ uv.lock
├─ docker-compose.yml
└─ frontend
   ├─ .next
   │  └─ types
   │     ├─ cache-life.d.ts
   │     ├─ root-params.d.ts
   │     ├─ routes.d.ts
   │     └─ validator.ts
   ├─ AGENTS.md
   ├─ CLAUDE.md
   ├─ README.md
   ├─ bun.lock
   ├─ next-env.d.ts
   ├─ next.config.ts
   ├─ package.json
   ├─ postcss.config.mjs
   ├─ public
   │  ├─ file.svg
   │  ├─ globe.svg
   │  ├─ next.svg
   │  ├─ vercel.svg
   │  └─ window.svg
   ├─ src
   │  └─ app
   │     ├─ favicon.ico
   │     ├─ globals.css
   │     ├─ layout.tsx
   │     └─ page.tsx
   └─ tsconfig.json

```