import { Content, GenerateContentConfig, GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import path from 'path';
import Memory from '../storage/Memory';
import { Role } from '../types';

type GenerateInput = string | Content;
type GenerateParam = GenerateInput | GenerateInput[];

const gemini = new GoogleGenAI({
  apiKey: process.env.GCP_API_KEY,
});

abstract class Agent {
  protected systemPrompt: string;
  private _model = gemini.models;

  constructor(systemPrompt: string, protected memory: Memory) {
    this.systemPrompt = readFileSync(
      path.join(__dirname, 'prompts', `${systemPrompt}.txt`),
      'utf-8'
    );
  }

  protected get model() {
    return this._model;
  }

  protected get config(): GenerateContentConfig {
    return {
      systemInstruction: {
        parts: [
          {
            text: this.systemPrompt,
          },
        ],
      },
    };
  }

  private static createContent(content: GenerateInput): Content {
    if (typeof content === 'string') {
      return Agent.wrap(content, 'user');
    }
    return content;
  }

  private static createContents(contents: GenerateParam): Content[] {
    const contentsList = Array.isArray(contents) ? contents : [contents];
    return contentsList.map((content) => Agent.createContent(content));
  }

  protected generateContent(
    config?: GenerateContentConfig,
    contents?: GenerateParam | null
  ) {
    const conversation = this.memory.getConversation();
    const additional = contents ? Agent.createContents(contents) : [];

    return this.model.generateContent({
      model: this.memory.model,
      contents: [...conversation, ...additional],
      config: {
        ...this.config,
        ...config,
      },
    });
  }

  protected static wrap(text: string, role: Role): Content {
    return {
      role,
      parts: [{ text }],
    };
  }
}

export default Agent;
