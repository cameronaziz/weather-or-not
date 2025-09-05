type WindForecast = {
  speed: number;
  direction: number;
};

type TemperatureValue = {
  high: number;
  low: number;
  icon: string;
};

type Temperature = TemperatureValue & {
  label: string;
  daytime: TemperatureValue;
  nightime: TemperatureValue;
};

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type Forecast = {
  date: string;
  dayOfWeek: DayOfWeek;
  temperature: Temperature;
  precipitation: number;
  wind: WindForecast;
};

export type Units = {
  temperature: 'f' | 'c';
  speed: 'mph' | 'kph' | 'kn';
  length: 'in' | 'cm';
};

export type AssessmentContextBaseValue = {
  locationName: string;
  recommendation: string;
};

export type SetAssessmentContext<
  T extends keyof AssessmentContextBaseValue = keyof AssessmentContextBaseValue
> = {
  (key: T, value: AssessmentContextBaseValue[T]): void;
  (param: Partial<AssessmentContextBaseValue>, value?: never): void;
};

export type AssessmentContextValue = AssessmentContextBaseValue & {
  set: SetAssessmentContext;
  reset(): void;
};

export type Message = {
  id: string;
  role: 'user' | 'system';
  text: string;
};

export type ConvoContextBaseValue = {
  input: string;
  isConvoMode: boolean;
  confidence: number;
  messages: Message[];
};

export type SetConvoContext<
  T extends keyof ConvoContextBaseValue = keyof ConvoContextBaseValue
> = {
  (key: T, value: ConvoContextBaseValue[T]): void;
  (param: Partial<ConvoContextBaseValue>, value?: never): void;
};

export type ConvoContextValue = ConvoContextBaseValue & {
  set: SetConvoContext;
  addMessage(message: Message | Message[]): void;
};

export type ProductListing = {
  name: string;
  imageURL: string;
  link: string;
};

export type Attire = {
  locationName: string;
  recommendation: string;
  listings: ProductListing[];
};

export type Followup = {
  question: string;
};

export type Location = {
  message: string;
};

export type ResultGeneric<T extends string, U> = {
  action: T;
  data: U;
  convoId: string;
};

export type RequestResult =
  | ResultGeneric<'complete', Attire>
  | ResultGeneric<'followup', Followup>
  | ResultGeneric<'location_confirmed', Location>;
