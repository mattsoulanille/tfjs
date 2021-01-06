import {sha256} from 'js-sha256';

function timestamp() {
  const date = new Date();
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
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
    const response = await fetch('base/src/random.bin');
    const buffer = await response.arrayBuffer();
    console.log(`${timestamp()}: Got file. Calculating sha256`);
    const sha = sha256(buffer);
    console.log(`${timestamp()}: Calculated sha256 is ${sha}`);
    // tslint:disable-next-line max-line-length
    expect(sha).toEqual('4366976e797721ec77ddcf3d1c266b98754ef5cf6de328e56847cea6e1a8da2f');
    console.log(`${timestamp()}: Checked calculated sha256 with expected value`);
  });
});
