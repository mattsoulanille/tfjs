const GB = 0.5;

function randRange(range: number) {
  return Math.floor(Math.random() * range);
}

describe('memory test', () => {
  let timeout: number;
  beforeAll(() => {
    timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  it(`uses ${GB} of ram`, async () => {
    // Test using lots of memory on browserstack devices
    const array = new Uint8Array(GB * 1e9);
    array.fill(123);

    expect(array[randRange(array.length)]).toEqual(123);
    expect(array[randRange(array.length)]).toEqual(123);
    expect(array[randRange(array.length)]).toEqual(123);
    expect(array[randRange(array.length)]).toEqual(123);
  });
});
