import moduleFactory from './sentencepiece';

async function main() {
  (window as any).sentencepiece = await moduleFactory();
}

main();
