import { HashAlgorithm } from './hash/enums';

interface MCardOptions {
  storeAsBlob?: boolean;
}

declare class MCard {
  constructor(
    content: string | Buffer, 
    hashFunction?: string, 
    options?: MCardOptions
  );

  hash: string;
  content: Buffer;
  g_time: string;
}

export { MCard, MCardOptions };
