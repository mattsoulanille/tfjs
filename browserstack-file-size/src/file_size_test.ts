import {sha256} from 'js-sha256';

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
    console.log('Fetching file');
    const response = await fetch('base/src/random.bin');
    console.log('Got file. Calculating sha256');
    const sha = sha256(await response.arrayBuffer());
    console.log(`Calculated sha256 is ${sha}`);
    // tslint:disable-next-line max-line-length
    expect(sha).toEqual('4366976e797721ec77ddcf3d1c266b98754ef5cf6de328e56847cea6e1a8da2f');
    console.log('Checked calculated sha256 with expected value');
  });
});
