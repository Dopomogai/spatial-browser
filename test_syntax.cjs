const fs = require('fs');
const ts = require('typescript');

const fileName = '/root/Documents/GitHub/spatial-browser/src/renderer/src/store/useCanvasStore.ts';
const sourceFile = ts.createSourceFile(
  fileName,
  fs.readFileSync(fileName, 'utf8'),
  ts.ScriptTarget.Latest,
  true
);

function printErrors() {
  const diagnostics = ts.getPreEmitDiagnostics(
    ts.createProgram([fileName], {
      noEmit: true,
      target: ts.ScriptTarget.Latest,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      skipLibCheck: true,
      strict: false,
    })
  );

  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\\n');
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\\n'));
    }
  });
}

printErrors();
