import { TaskConfig, TaskType } from "./types";

export const AVAILABLE_TASKS: TaskConfig[] = [
  {
    id: '5.1',
    type: TaskType.TextToImage,
    name: 'Text to Image',
    description: 'Generate high-quality visuals from text prompts using Gemini 3.0 Pro Image.',
    icon: 'Image'
  },
  {
    id: '5.2',
    type: TaskType.TextToVideo,
    name: 'Text to Video',
    description: 'Create cinematic videos from simple text descriptions using Veo.',
    icon: 'Video'
  },
  {
    id: '5.3',
    type: TaskType.AudioToVideo,
    name: 'Audio to Video',
    description: 'Drive video generation with audio and reference images.',
    icon: 'Mic' 
  },
  {
    id: '5.4',
    type: TaskType.ImageToVideo,
    name: 'Image to Video',
    description: 'Animate static images or create transitions between start and end frames.',
    icon: 'Film'
  }
];

export const TASK_MODELS: Record<TaskType, { id: string; name: string }[]> = {
  [TaskType.TextToImage]: [
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Pro Image (Quality)' },
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (Fast)' },
  ],
  [TaskType.TextToVideo]: [
    { id: 'veo-3.1-generate-preview', name: 'Veo 3.1 (High Quality)' },
    { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast' },
  ],
  [TaskType.AudioToVideo]: [
    { id: 'veo-3.1-generate-preview', name: 'Veo 3.1 (High Quality)' },
    { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast' },
  ],
  [TaskType.ImageToVideo]: [
    { id: 'veo-3.1-generate-preview', name: 'Veo 3.1 (High Quality)' },
    { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast' },
  ]
};