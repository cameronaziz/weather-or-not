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
      dateType: {
        type: Type.STRING,
        enum: ['default', 'specific_dates', 'historical_period'],
        description:
          'default: next 7 days, specific_dates: within next 16 days, historical_period: beyond 16 days using historical data',
      },
      startDate: {
        type: Type.STRING,
        description:
          'Start date in YYYY-MM-DD format. Only provide if dateType is specific_dates or historical_period',
      },
      endDate: {
        type: Type.STRING,
        description:
          'End date in YYYY-MM-DD format. Only provide if dateType is specific_dates or historical_period',
      },
      timeContext: {
        type: Type.STRING,
        description:
          'Human-readable time context: "this weekend", "next week", "in December", "for Christmas", etc. Leave empty if no specific time mentioned.',
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

const FORECAST_BASE_PATH = 'https://api.open-meteo.com/v1/forecast';
const HISTORICAL_BASE_PATH = 'https://archive-api.open-meteo.com/v1/archive';

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
  useHistorical?: boolean;
};

const fetchWeather = async (options: FetchWeatherOptions) => {
  const {
    latitude,
    longitude,
    startDate,
    endDate,
    useHistorical = false,
  } = options;
  const basePath = useHistorical ? HISTORICAL_BASE_PATH : FORECAST_BASE_PATH;
  const modelParam = useHistorical ? '' : pickModel(latitude, longitude);
  const endpoint = `${basePath}?${UNITS}&${DAILY}&latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}${modelParam}`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    console.error('Weather API error:', response.status, response.statusText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<WeatherResponse.JSON>;
};

const formatResponse = (response: WeatherResponse.JSON) => {
  const { daily } = response;
  return daily.time.map((day, index) => ({
    day,
    high: daily.temperature_2m_max[index],
    low: daily.temperature_2m_min[index],
    weather: wmoWeatherCodes[daily.weather_code[index]],
  }));
};

const getDates = async (options: GetWeatherOptions) => {
  const {
    latitude,
    longitude,
    dateType = 'default',
    startDate,
    endDate,
  } = options;
  const timezone = await determineTimeZone(latitude, longitude);
  const localDate = new Date();
  const locationTime = toZonedTime(localDate, timezone.timeZoneId);

  if (dateType === 'default') {
    return {
      startDate: format(locationTime, 'yyyy-MM-dd', {
        timeZone: timezone.timeZoneId,
      }),
      endDate: format(addDays(locationTime, 7), 'yyyy-MM-dd', {
        timeZone: timezone.timeZoneId,
      }),
      useHistorical: false,
    };
  } else if (dateType === 'specific_dates' && startDate && endDate) {
    return {
      startDate,
      endDate,
      useHistorical: false,
    };
  } else if (dateType === 'historical_period' && startDate && endDate) {
    return {
      startDate,
      endDate,
      useHistorical: true,
    };
  } else {
    // Fallback to default
    return {
      startDate: format(locationTime, 'yyyy-MM-dd', {
        timeZone: timezone.timeZoneId,
      }),
      endDate: format(addDays(locationTime, 7), 'yyyy-MM-dd', {
        timeZone: timezone.timeZoneId,
      }),
      useHistorical: false,
    };
  }
};

type GetWeatherOptions = {
  name: string;
  latitude: number;
  longitude: number;
  dateType?: string;
  startDate?: string;
  endDate?: string;
  timeContext?: string;
};

const getWeather = async (options: GetWeatherOptions): Promise<WeatherData> => {
  const { latitude, longitude, dateType = 'default' } = options;
  const { startDate, endDate, useHistorical } = await getDates(options);

  const weather = await fetchWeather({
    latitude,
    longitude,
    startDate,
    endDate,
    useHistorical,
  });

  const forecast = formatResponse(weather);

  return {
    ...options,
    forecast,
    dateType,
    timeContext: options.timeContext,
  };
};

export default getWeather;
