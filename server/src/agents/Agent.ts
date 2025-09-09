import { Content, GenerateContentConfig, GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import path from 'path';
import Memory from '../storage/Memory';
import { Role } from '../types';

const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to calculate week dates with any offset (0 = this week, -1 = last week, 1 = next week, etc.)
const getWeek = (date: Date, weekOffset: number) => {
  // Apply the offset to the input date first
  const offsetDate = new Date(date);
  offsetDate.setDate(date.getDate() + weekOffset * 7);

  // Now calculate the week for the offset date
  const start = new Date(offsetDate);
  start.setDate(offsetDate.getDate() - offsetDate.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start,
    end,
  };
};

// Helper function to get the correct day name for "Next [Day]"
const getNextDayName = (dayIndex: number) => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[dayIndex];
};

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
    const toolUse = `You must consider the cost of each tool use. Repetative tool use should be avoided.`;
    const text = `${this.date}\n${toolUse}\n${this.systemPrompt} `;

    return {
      systemInstruction: {
        parts: [
          {
            text,
          },
        ],
      },
    };
  }

  private get date() {
    const today = new Date();
    const currentTime = today.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const thisWeek = getWeek(today, 0);
    const lastWeek = getWeek(today, -1);
    const nextWeek = getWeek(today, 1);

    return `
**System Context:**
* **Today's Date:** ${formatDate(today)}
* **Current Time:** ${currentTime}
* **Time Zone:** ${timeZone}

**Relative Date Interpretation Rules:**
1.  "Today" refers to ${formatDate(today)}.
2.  "Yesterday" refers to ${formatDate(yesterday)}.
3.  "Tomorrow" refers to ${formatDate(tomorrow)}.
4.  "This week" refers to the period from ${formatDate(
      thisWeek.start
    )} to ${formatDate(thisWeek.end)}.
5.  "Last week" refers to the period from ${formatDate(
      lastWeek.start
    )} to ${formatDate(lastWeek.end)}.
6.  "Next week" refers to the period from ${formatDate(
      nextWeek.start
    )} to ${formatDate(nextWeek.end)}.
7.  "Next [Day]" (e.g., "next ${getNextDayName(
      (today.getDay() + 1) % 7
    )}") refers to the first instance of that day after this week.
8.  "In [N] days" (e.g., "in 3 days") refers to the date exactly N days from today.
  `;
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

  protected async generateContent(
    config?: GenerateContentConfig,
    param?: GenerateParam | null
  ) {
    const conversation = await this.memory.getConversation();
    const additional = param ? Agent.createContents(param) : [];
    const contents = [...conversation, ...additional];

    return this.model.generateContent({
      model: this.memory.model,
      contents,
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
