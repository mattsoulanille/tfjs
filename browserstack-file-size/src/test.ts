import {sha256} from 'js-sha256';

const MB = 10**6;
const MEM_BYTES = 500 * MB;

function randRange(range: number) {
  return Math.floor(Math.random() * range);
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
    const response = await fetch('base/src/random.bin');
    const sha = sha256(await response.arrayBuffer());
    // tslint:disable-next-line max-line-length
    expect(sha).toEqual('4366976e797721ec77ddcf3d1c266b98754ef5cf6de328e56847cea6e1a8da2f');
  });

  it('uses lots of memory', async () => {
    // Test using lots of memory on browserstack devices
    const array = new Uint8Array(MEM_BYTES);
    array.fill(123);

    expect(array[randRange(array.length)]).toEqual(123);
    expect(array[randRange(array.length)]).toEqual(123);
    expect(array[randRange(array.length)]).toEqual(123);
    expect(array[randRange(array.length)]).toEqual(123);
  });
});
