const getRefreshToken = async () => {
  const {
    SP_API_REFRESH: refreshToken,
    SP_API_ID: id,
    SP_API_SECRET: secret,
  } = process.env;

  if (!refreshToken || !id || !secret) {
    throw new Error('ENV VAR(s) not set');
  }
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

  const urlencoded = new URLSearchParams();
  urlencoded.append('grant_type', 'refresh_token');
  urlencoded.append('refresh_token', refreshToken);
  urlencoded.append('client_id', id);
  urlencoded.append('client_secret', secret);

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow',
  };

  const response = await fetch(
    'https://api.amazon.com/auth/o2/token',
    requestOptions
  );
  return response.text();
};

export default getRefreshToken;
