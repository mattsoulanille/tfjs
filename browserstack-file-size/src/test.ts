async function sha256(buf: ArrayBuffer): Promise<string> {
  const shaBytes = await crypto.subtle.digest('SHA-256', buf);
  return [...(new Uint8Array(shaBytes))]
    .map(num => num.toString(16))
    .join('');
}

describe('file size test', () => {
  it('loads a large file', async () => {
    const response = await fetch('base/src/random.bin');
    const sha = await sha256(await response.arrayBuffer());
    // tslint:disable-next-line max-line-length
    expect(sha).toEqual('4366976e797721ec77ddcf3d1c266b98754ef5cf6de328e56847cea6e1a8da2f');
  });
});
