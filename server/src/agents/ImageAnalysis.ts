import { Content } from '@google/genai';
import Memory from '../storage/Memory';
import LLM from './Agent';

class ImageAnalysisAgent extends LLM {
  constructor(memory: Memory) {
    super('image_analysis', memory);
  }

  public async run(imageData: string): Promise<string> {
    const contents: Content[] = [
      ImageAnalysisAgent.wrap(this.systemPrompt, 'model'),
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData,
            },
          },
        ],
      },
    ];

    const response = await this.model.generateContent({
      model: this.memory.model,
      contents,
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (part) {
      this.memory.recordMessage('user', part);
    }

    return part?.text || 'Unable to analyze the image.';
  }
}

export default ImageAnalysisAgent;
