function delay(ms: number) {
  return new Promise(fulfill => {
    setTimeout(fulfill, ms);
  });
}

const TIME = 1e4;

describe('delay test', () => {
  let timeout: number;
  beforeAll(() => {
    timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  it('delays 10 seconds', async () => {
    await delay(TIME);
    expect(123).toEqual(123);
  });
});
