import 'jest';

import { TextDecoder } from 'util';

// The util TextEncoder does not output instance of ArrayBuffer, so I had to do my own implementation
class TextEncoder {
  // eslint-disable-next-line class-methods-use-this
  public encode(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);

    for (let i = 0, strLen = str.length; i < strLen; i += 1) {
      bufView[i] = str.charCodeAt(i);
    }

    return { buffer: buf };
  }
}

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
