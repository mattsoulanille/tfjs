import {ArgumentParser} from 'argparse';
import * as fs from 'fs';
import * as path from 'path';
import {exec} from 'shelljs';

const packages = [
  'tfjs-core',
  'tfjs-backend-cpu',
  'tfjs-node',
  'e2e',
  'tfjs',
  'tfjs-vis',
  'tfjs-layers',
  'tfjs-backend-webgl',
  'tfjs-automl',
] as const;

type Package = (typeof packages)[number];

const toCopy = [
  'package.json',
  'karma.conf.js',
  '.nycrc',
];

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

async function makeReport(commit: string, yarn: string) {
  const pathPrefix = `/tmp/coverage_${commit}`;
  debugger;
  if (fs.existsSync(pathPrefix)) {
    runAsync(`rm -rf ${pathPrefix}`);
  }

  try {
    await runAsync(`git clone git@github.com:tensorflow/tfjs ${pathPrefix}`);
    await runAsync(`cd ${pathPrefix} && git remote add temp git@github.com:mattsoulanille/tfjs.git && git fetch temp && git checkout --track temp/tfjs-coverage && git checkout ${commit}`);
  } catch (e) {
    return [];
  }
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
      await runAsync(`cd ${packagePath} && ${yarn} && ${yarn} build-deps`);
    } catch (e) {
      console.log(e.message);
    }

    try {
      const result = await runAsync(`cd ${packagePath} && ${yarn} coverage`);
      const coverage = extractCoverage(result);
      results.push([packageName, coverage]);
    } catch (e) {
      console.log(e.message);
      results.push([packageName, e.message]);
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

  parts.push('=*');
  const regexp = new RegExp(parts.join(''));

  const matches = stdout.match(regexp);
  if (matches.length > 0) {
    return matches[0];
  } else {
    throw new Error('Failed to extract coverage from logs');
  }
}

async function main({commits, yarn}: {commits: string[], yarn: string}) {
  console.log(`Making coverage reports for ${commits}`);
  const reports = await Promise.all(commits.map(commit => makeReport(commit, yarn)));

  const out: string[] = [];
  for (let i = 0; i < reports.length; i++) {
    out.push(commits[i]);
    out.push("\n");
    const report = reports[i];
    for (const [packageName, coverage] of report) {
      out.push(packageName);
      out.push(coverage);
      out.push("\n");
    }
    out.push("\n-----------------------\n");
  }
  console.log(out.join('\n'));
}



const parser = new ArgumentParser(
    {description: 'Manually generate a test coverage report'});

parser.addArgument('commits', {
  help: 'The commits to generate reports for',
  type: 'string',
  nargs: '+',
})

parser.addArgument('--yarn', {
  help: 'Name / path to the yarn command',
  defaultValue: 'yarn',
  type: 'string',
  nargs: '?',
});

main(parser.parseArgs());
