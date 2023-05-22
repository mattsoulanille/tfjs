import {promisify} from 'util';
import {ArgumentParser} from 'argparse';
import * as fs from 'fs';

const readFilePromise = promisify(fs.readFile);
const writeFilePromise = promisify(fs.writeFile);

const parser = new ArgumentParser({
  description: "Bundle files as base64 into a single TypeScript file.",
});

parser.addArgument(['-o', '--output'], {
  action: 'store',
  required: true,
  help: 'The output path for the typescript bundle',
});

parser.addArgument('file', {
  help: 'The file to bundle as base64',
});

async function main() {
  const args = parser.parseArgs();
  const path = args.file as string;
  const buffer = await readFilePromise(path);
  const base64 = buffer.toString('base64');

  // Code generation
  const sourcecode = `// This file is generated by tfjs/tools/base64_bundle.ts
// (likely by //tools:base64_bundle.bzl).

const base64 = ${JSON.stringify(base64)};
const byteString = atob(base64);
export const data = Uint8Array.from(byteString, c => c.charCodeAt(0));
`;
 
  writeFilePromise(args.output, sourcecode);
}

main();
