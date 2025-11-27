import { GoogleGenAI } from "@google/genai";
import { GenerationParams, TaskType } from "../types";

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix (e.g. "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const generateSample = async (
  taskType: TaskType,
  params: GenerationParams
): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing. Check process.env.API_KEY");
    // Throwing error to be caught by UI
    throw new Error("API Key not found. Please select a paid API key using the key selector.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const results: string[] = [];

  try {
    // ---------------------------------------------------------
    // 5.1 Text to Image
    // ---------------------------------------------------------
    if (taskType === TaskType.TextToImage) {
      // Use selected model or default
      const model = params.model || 'gemini-3-pro-image-preview';
      
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: params.prompt }],
        },
        config: {
          imageConfig: {
            // Using mapped aspect ratio or default
            aspectRatio: params.aspectRatio as "1:1" | "16:9" | "4:3" | "3:4" | "9:16",
            count: params.sampleCount, 
            imageSize: "1K"
          }
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            results.push(`data:image/png;base64,${part.inlineData.data}`);
          }
        }
      }
    } 
    // ---------------------------------------------------------
    // 5.2 Text to Video
    // ---------------------------------------------------------
    else if (taskType === TaskType.TextToVideo) {
      const model = params.model || 'veo-3.1-fast-generate-preview';
      
      // Veo operations are long-running
      let operation = await ai.models.generateVideos({
        model,
        prompt: params.prompt,
        config: {
          numberOfVideos: 1, // API restriction: usually 1 per req
          resolution: params.resolution === '1080p' ? '1080p' : '720p',
          aspectRatio: params.aspectRatio as "16:9" | "9:16",
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        // We must append key to fetch the binary
        // Note: For display in <video src="...">, this URL works if the key is appended
        results.push(`${videoUri}&key=${apiKey}`);
      }
    }
    // ---------------------------------------------------------
    // 5.3 Audio to Video (Audio Driven)
    // ---------------------------------------------------------
    else if (taskType === TaskType.AudioToVideo) {
        // NOTE: Current Veo API public docs primarily support Prompt + Image + LastFrame.
        // Explicit Audio-driving-video is not yet fully documented in the standard snippets provided.
        // We will implement this as an Image-to-Video flow with the audio context passed 
        // as a prompt description or assume future support. 
        // For this demo, we will utilize the Base Image + Prompt.
        
        const model = params.model || 'veo-3.1-fast-generate-preview';
        let imagePart = undefined;

        if (params.referenceImages && params.referenceImages.length > 0) {
            const b64 = await fileToBase64(params.referenceImages[0]);
            imagePart = {
                imageBytes: b64,
                mimeType: params.referenceImages[0].type
            };
        }

        // We use the prompt to describe the audio action if actual audio buffer isn't supported
        // in the `generateVideos` payload yet.
        const effectivePrompt = params.prompt || "Animate this character speaking.";

        let operation = await ai.models.generateVideos({
            model,
            prompt: effectivePrompt,
            image: imagePart,
            config: {
                numberOfVideos: 1,
                resolution: params.resolution === '1080p' ? '1080p' : '720p',
                aspectRatio: params.aspectRatio as "16:9" | "9:16",
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            results.push(`${videoUri}&key=${apiKey}`);
        }
    }
    // ---------------------------------------------------------
    // 5.4 Image to Video (First/Last Frame)
    // ---------------------------------------------------------
    else if (taskType === TaskType.ImageToVideo) {
        const model = params.model || 'veo-3.1-fast-generate-preview';
        let startImagePart = undefined;
        let lastFramePart = undefined;

        if (params.startImage) {
            const b64 = await fileToBase64(params.startImage);
            startImagePart = {
                imageBytes: b64,
                mimeType: params.startImage.type
            };
        }

        if (params.endImage) {
            const b64 = await fileToBase64(params.endImage);
            lastFramePart = {
                imageBytes: b64,
                mimeType: params.endImage.type
            };
        }

        let operation = await ai.models.generateVideos({
            model,
            prompt: params.prompt, // Required
            image: startImagePart,
            config: {
                numberOfVideos: 1,
                resolution: params.resolution === '1080p' ? '1080p' : '720p',
                aspectRatio: params.aspectRatio as "16:9" | "9:16",
                lastFrame: lastFramePart
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            results.push(`${videoUri}&key=${apiKey}`);
        }
    }

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }

  return results;
};


// Simulate Database Insertion
export const saveBatchToDatabase = async (taskName: string, count: number, type: TaskType) => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            console.log(`[DB SUCCESS] Batch job '${taskName}' (${type}) with ${count} items saved to database.`);
            resolve();
        }, 1500);
    });
};