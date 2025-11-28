export enum TaskType {
  TextToImage = 'Text-to-Image',
  TextToVideo = 'Text-to-Video',
  AudioToVideo = 'Audio-to-Video',
  ImageToVideo = 'Image-to-Video',
}

export interface TaskConfig {
  id: string;
  type: TaskType;
  name: string;
  description: string;
  icon: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  tags?: string[];
}

export interface GenerationParams {
  model?: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  resolution?: '720p' | '1080p' | '1K' | '2K' | '4K';
  seed?: number;
  // File inputs
  referenceImages?: File[];
  driverAudio?: File;
  startImage?: File;
  endImage?: File;
  // Config
  sampleCount: number;
  // Batch Config
  audioSourceDir?: string;
  imageSourceDir?: string;
}

export interface GeneratedResult {
  id: string;
  type: 'image' | 'video';
  url: string;
  status: 'pending' | 'completed' | 'failed';
}