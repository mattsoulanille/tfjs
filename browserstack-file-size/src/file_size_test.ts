import {sha256} from 'js-sha256';

function timestamp() {
  const date = new Date();
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

// async function delay(ms: number): Promise<void> {
//   await new Promise(fulfill => {
//     setTimeout(fulfill, ms);
//   });
// }

//const TIMEOUT = 60000 * 4; // 4 minutes

async function fetchWithLogs(url: string, logPeriod = 1000,
                             log=console.log): Promise<Uint8Array> {

  const response = await fetch(url);
  const reader = response.body.getReader();

  const chunks: Uint8Array[] = [];
  let receivedLength = 0;

  const logInterval = setInterval(() => {
    log(`${timestamp()}: Received ${receivedLength} bytes`);
  }, logPeriod);

  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

  }

  clearInterval(logInterval);

  const outBuf = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    outBuf.set(chunk, position);
    position += chunk.length;
  }

  return outBuf;
}


describe('file size test', () => {
  let timeout: number;
  beforeAll(() => {
    timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  it('loads a large file', async () => {
    console.log(`${timestamp()}: Fetching file`);
    const data = await fetchWithLogs('base/src/random.bin');
    console.log(`${timestamp()}: Got file. Calculating sha256`);
    const sha = sha256(data);
    console.log(`${timestamp()}: Calculated sha256 is ${sha}`);
    // tslint:disable-next-line max-line-length
    expect(sha).toEqual('4366976e797721ec77ddcf3d1c266b98754ef5cf6de328e56847cea6e1a8da2f');
    console.log(`${timestamp()}: Checked calculated sha256 with expected value`);
  });
});
