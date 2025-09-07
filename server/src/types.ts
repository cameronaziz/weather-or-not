import { Part } from '@google/genai';

export type Role = 'model' | 'user';

export type Route = 'direct_weather' | 'location_description';

export type Message = {
  id: string;
  text: Part;
  dateTime: string;
  role: Role;
};

export type MessageToStore = {
  text: string;
  dateTime: string;
  role: Role;
};

export type RecordFunctionCall = {
  name: string;
  args?: Record<string, unknown>;
};

export type RecordMessage = {
  role: Role;
  input: string | Part;
};

export type StoredConversation = {
  convoId: string;
  lastMessageDateTime: string;
  messages: Message[];
};

export type UserStorage = Record<string, Record<string, StoredConversation>>;

export type PromptRequestBody = {
  userId: string;
  hostname: string;
  convoId?: string | null;
  prompt: string;
  image?: Buffer;
};

export type WeatherDay = {
  day: string;
  high: number;
  low: number;
  weather: string;
};

export type WeatherData = {
  name: string;
  latitude: number;
  longitude: number;
  forecast: WeatherDay[];
};

export type Followup = {
  question: string;
};

export type ResultGeneric<T extends string, U> = {
  convoId: string;
  action: T;
  data: U;
};

export type LocationResult =
  | ResultGeneric<'weather', WeatherData>
  | ResultGeneric<'followup', Followup>
  | ResultGeneric<
      'location_confirmed',
      { message: string; weather: WeatherData }
    >;

export type ProductListing = {
  name: string;
  imageURL: string;
  link: string;
};

export type Attire = {
  recommendation: string;
  listings: ProductListing[];
};

export type AttireResult =
  | ResultGeneric<'attire', Attire>
  | ResultGeneric<'followup', Followup>;

export type SystemResultGeneric<T extends string, U> = {
  action: T;
  data: U;
  convoId: string;
};

export type Location = {
  message: string;
};

export type SystemResult =
  | SystemResultGeneric<'complete', Attire>
  | SystemResultGeneric<'followup', Followup>
  | SystemResultGeneric<'location', Location>;
