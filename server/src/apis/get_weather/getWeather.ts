import { FunctionDeclaration, Type } from '@google/genai';
import { addDays } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { WeatherData } from '../../types';
import determineTimeZone from './determineTimeZone';
import pickModel from './pickModel';
import wmoWeatherCodes from './wmoWeatherCodes';

export const getWeatherFunctionDeclaration: FunctionDeclaration = {
  name: 'get_weather',
  description: 'Gets the weather for a given location',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'A human readable conclusion. e.g. I think New York!',
      },
      latitude: {
        type: Type.NUMBER,
        description: 'The latitude, e.g. 40.7128',
      },
      longitude: {
        type: Type.NUMBER,
        description: 'The longitude, e.g. 74.0060',
      },
    },
    required: ['latitude', 'longitude', 'name'],
  },
};

namespace WeatherResponse {
  type Daily = {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    wind_direction_10m_dominant: number[];
    wind_speed_10m_max: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };

  export type JSON = Record<string, unknown> & {
    daily: Daily;
  };
}

const BASE_PATH = 'https://api.open-meteo.com/v1/forecast';

const PARAMS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'weather_code',
  'wind_direction_10m_dominant',
  'wind_speed_10m_max',
  'precipitation_sum',
];
const DAILY = `daily=${PARAMS.join(',')}`;
const UNITS = `wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch`;

type FetchWeatherOptions = {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
};

const fetchWeather = async (options: FetchWeatherOptions) => {
  const { latitude, longitude, startDate, endDate } = options;
  const model = pickModel(latitude, longitude);
  const endpoint = `${BASE_PATH}?${UNITS}&${DAILY}&latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}${model}`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<WeatherResponse.JSON>;
};

const formatResponse = (response: WeatherResponse.JSON) => {
  const { daily } = response;
  return daily.time.map((day, index) => ({
    day,
    high: daily.temperature_2m_max[index],
    low: daily.temperature_2m_max[index],
    weather: wmoWeatherCodes[daily.weather_code[index]],
  }));
};

type GetWeatherOptions = {
  name: string;
  latitude: number;
  longitude: number;
};

const getWeather = async (options: GetWeatherOptions): Promise<WeatherData> => {
  const { latitude, longitude } = options;
  const localDate = new Date();
  const timezone = await determineTimeZone(latitude, longitude);
  const locationTime = toZonedTime(localDate, timezone.timeZoneId);

  const startDate = format(locationTime, 'yyyy-MM-dd', {
    timeZone: timezone.timeZoneId,
  });

  const endDate = format(addDays(locationTime, 7), 'yyyy-MM-dd', {
    timeZone: timezone.timeZoneId,
  });

  const weather = await fetchWeather({
    latitude,
    longitude,
    startDate,
    endDate,
  });

  const forecast = formatResponse(weather);

  return {
    ...options,
    forecast,
  };
};

export default getWeather;
