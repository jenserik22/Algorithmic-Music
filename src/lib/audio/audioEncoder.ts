import { encode as wavEncode } from 'wav-encoder';

// Types for audio encoding
export type AudioFormat = 'wav' | 'mp3';

export interface AudioEncodingOptions {
  format: AudioFormat;
  quality?: number; // For MP3: 0-9 (higher = better quality)
  bitrate?: number; // For MP3: kbps (128, 192, 256, 320)
}

/**
 * Encodes audio buffer to the specified format
 */
export async function encodeAudio(
  audioBuffer: AudioBuffer,
  options: AudioEncodingOptions
): Promise<ArrayBuffer> {
  const { format, quality = 2, bitrate = 128 } = options;

  switch (format) {
    case 'wav':
      return await encodeToWav(audioBuffer);
    case 'mp3':
      return await encodeToMp3(audioBuffer, { quality, bitrate });
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Encode to WAV format
 */
async function encodeToWav(audioBuffer: AudioBuffer): Promise<ArrayBuffer> {
  // Convert AudioBuffer to the format expected by wav-encoder
  const audioData = {
    sampleRate: audioBuffer.sampleRate,
    channelData: Array.from({ length: audioBuffer.numberOfChannels }, (_, i) =>
      audioBuffer.getChannelData(i)
    )
  };

  return await wavEncode(audioData);
}

/**
 * Encode to MP3 format using lamejs
 */
async function encodeToMp3(
  audioBuffer: AudioBuffer,
  options: { quality: number; bitrate: number }
): Promise<ArrayBuffer> {
  // Dynamic import to avoid bundling issues
  const lamejs = await import('lamejs');
  
  const { quality, bitrate } = options;
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  
  // Create MP3 encoder - use lamejs directly
  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate);
  const mp3Data: Uint8Array[] = [];

  // Convert float32 samples to int16
  const blockSize = 1152; // Standard MP3 frame size
  const samplesPerChannel = audioBuffer.length;

  if (numChannels === 1) {
    // Mono
    const samples = audioBuffer.getChannelData(0);
    const int16Samples = floatTo16BitPCM(samples);
    
    for (let i = 0; i < int16Samples.length; i += blockSize) {
      const chunk = int16Samples.subarray(i, i + blockSize);
      const mp3buf = encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
  } else {
    // Stereo
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    const leftInt16 = floatTo16BitPCM(left);
    const rightInt16 = floatTo16BitPCM(right);
    
    for (let i = 0; i < leftInt16.length; i += blockSize) {
      const leftChunk = leftInt16.subarray(i, i + blockSize);
      const rightChunk = rightInt16.subarray(i, i + blockSize);
      const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
  }

  // Flush remaining data
  const finalBuffer = encoder.flush();
  if (finalBuffer.length > 0) {
    mp3Data.push(finalBuffer);
  }

  // Combine all MP3 data
  const totalLength = mp3Data.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of mp3Data) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Convert Float32Array to Int16Array (PCM)
 */
function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  return int16Array;
}

/**
 * Create downloadable file from encoded audio
 */
export function createDownloadLink(
  encodedAudio: ArrayBuffer,
  filename: string,
  format: AudioFormat
): string {
  const mimeType = format === 'wav' ? 'audio/wav' : 'audio/mp3';
  const blob = new Blob([encodedAudio], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Trigger download of encoded audio file
 */
export function downloadAudio(
  encodedAudio: ArrayBuffer,
  filename: string,
  format: AudioFormat
): void {
  const url = createDownloadLink(encodedAudio, filename, format);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${format}`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}