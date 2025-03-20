export declare class SafeBuffer extends Uint8Array {
  constructor(arg: number | ArrayBuffer | ArrayBufferView);
  
  static from(
    value: string | ArrayBuffer | ArrayBufferView, 
    encoding?: BufferEncoding
  ): SafeBuffer;
  
  static alloc(size: number, fill?: number | string): SafeBuffer;
  
  static concat(list: SafeBuffer[]): SafeBuffer;
  
  toString(encoding?: BufferEncoding): string;
  
  write(str: string, offset?: number, length?: number, encoding?: BufferEncoding): number;
  
  static isBuffer(obj: any): boolean;
}
