import ts from 'typescript';

const configPath = ts.findConfigFile('.', ts.sys.fileExists, 'tsconfig.json');

if (!configPath) {
  console.error('tsconfig.json not found');
  process.exit(1);
}

const readResult = ts.readConfigFile(configPath, ts.sys.readFile);

if (readResult.error) {
  console.error(ts.formatDiagnosticsWithColorAndContext([readResult.error], {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  }));
  process.exit(1);
}

const parsed = ts.parseJsonConfigFileContent(
  readResult.config,
  ts.sys,
  ts.getDirectoryPath(configPath),
);

const program = ts.createProgram({
  rootNames: parsed.fileNames,
  options: parsed.options,
});

const diagnostics = ts.getPreEmitDiagnostics(program);

if (diagnostics.length > 0) {
  const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  });
  console.error(formatted);
  process.exit(1);
}

console.log('typecheck passed');
