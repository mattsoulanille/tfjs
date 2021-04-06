import {ArgumentParser} from 'argparse';
import * as fs from 'fs';
import * as path from 'path';
//import {$} from './release-util';
import {exec} from 'shelljs';

const packages = [
  'tfjs-core',
  'tfjs-backend-cpu',
] as const;

type Package = (typeof packages)[number];

const toCopy = [
  'package.json',
  '.nycrc',
];

function run(command: string) {
  console.log(command);
  return exec(command);
}

function runAsync(command: string) {
  console.log(command);
  return new Promise<string>((resolve, reject) => {
    exec(command, {}, (code, stdout, stderr) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr));
      }
    });
  });
}

async function makeReport(commit: string) {
  const pathPrefix = `/tmp/coverage_${commit}`;
  debugger;
  if (fs.existsSync(pathPrefix)) {
    run(`rm -rf ${pathPrefix}`);
  }

  await runAsync(`git clone git@github.com:tensorflow/tfjs ${pathPrefix}`);
  await runAsync(`cd ${pathPrefix} && git remote add temp git@github.com:mattsoulanille/tfjs.git && git fetch temp && git checkout --track temp/tfjs-coverage && git checkout ${commit}`);

  const results: [Package, string][] = [];

  for (const packageName of packages) {
    const packagePath = path.join(pathPrefix, packageName);
    for (const copy of toCopy) {
      try {
        await runAsync(`cd ${packagePath} && git checkout tfjs-coverage ${copy}`);
      } catch (e) {
        console.log(e.message);
      }
    }

    try {
      await runAsync(`cd ${packagePath} && yarn && yarn build-deps`);
    } catch (e) {
      console.log(e.message);
    }

    try {
      const result = await runAsync(`cd ${packagePath} && yarn coverage`);
      const coverage = extractCoverage(result);
      results.push([packageName, coverage]);
    } catch (e) {
      console.log(e.message);
    }
  }

  return results;
}


function extractCoverage(stdout: string) {
  const keys = ['Statements', 'Branches', 'Functions', 'Lines'];

  const start = '=+ Coverage summary =+\n*';

  const parts = [start];
  for (const key of keys) {
    parts.push(`${key} *: *([0-9]+\.[0-9]+)% *\\( *([0-9]+)\/([0-9]+) *\\)\n`);
  }

  //parts.push('=*');
  const regexp = new RegExp(parts.join(''));

  const matches = stdout.match(regexp)[0];
  if (matches.length < 0) {
    return matches[0];
  } else {
    throw new Error('Failed to extract coverage from logs');
  }
}

async function main({commits}: {commits: string[]}) {
  console.log(`Making coverage reports for ${commits}`);
  const reports = await Promise.all(commits.map(makeReport));

  const out: string[] = [];
  for (let i = 0; i < reports.length; i++) {
    out.push(commits[i]);
    out.push("\n");
    const report = reports[i];
    for (const [packageName, coverage] of report) {
      out.push(packageName);
      out.push("\n");
      out.push(coverage);
    }
  }
  console.log(out);
}



const parser = new ArgumentParser(
    {description: 'Manually generate a test coverage report'});

parser.addArgument('commits', {
  help: 'The commits to generate reports for',
  type: 'string',
  nargs: '+',
})

main(parser.parseArgs());
