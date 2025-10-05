declare module 'wav-encoder' {
  export function encode(audioData: {
    sampleRate: number;
    channelData: Float32Array[];
  }): Promise<ArrayBuffer>;
}

declare module 'lamejs' {
  const lamejs: any;
  export default lamejs;
}
