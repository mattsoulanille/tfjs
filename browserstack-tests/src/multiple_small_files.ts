import {sha256} from 'js-sha256';

function timestamp() {
  const date = new Date();
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function log(str: string) {
  console.log(`${timestamp()}: ${str}`);
}

async function fetchArray(url: string) {
  const response = await fetch(url);
  const out = await response.arrayBuffer();
  log(`Got ${url}`);
  return out;
}

describe('multiple small files test', () => {
  let timeout: number;
  beforeAll(() => {
    timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  it('loads many small files', async () => {
    log('Fetching file list');
    const fileList = await (await fetch('base/src/small_files/shas.json')).json();
    log('Got file list');
    const files = new Map<string,
        {fileData: Promise<ArrayBuffer>, expectedSha: string}>();

    log('Fetching files');
    for (const [fileName, sha] of Object.entries(fileList)) {
      files.set(fileName, {
        fileData: fetchArray(`base/src/small_files/${fileName}`),
        expectedSha: sha as string
      })
    }

    for (const [,{fileData, expectedSha}] of files) {
      expect(sha256(await fileData)).toEqual(expectedSha);
    }
  });
});
