const BASE_ENDPOINT = `https://maps.googleapis.com/maps/api/timezone/json?key=${process.env.GCP_API_KEY}&`;

type Timezone = {
  dstOffset: number;
  rawOffset: number;
  status: string;
  timeZoneId: string;
  timeZoneName: string;
};

const determineTimeZone = async (latitude: number, longitude: number) => {
  const response = await fetch(
    `${BASE_ENDPOINT}location=${latitude}%2C${longitude}&timestamp=${Math.floor(
      Date.now() / 1000
    )}`
  );

  const text = await response.text();
  return JSON.parse(text) as Timezone;
};

export default determineTimeZone;
