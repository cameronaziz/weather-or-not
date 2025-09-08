const isInCanadaHRDPSRegion = (latitude: number, longitude: number) => {
  const isCanada =
    latitude >= 40.0 &&
    latitude <= 85.0 &&
    longitude >= -150.0 &&
    longitude <= -40.0;

  const isAlaska =
    latitude >= 54.0 &&
    latitude <= 72.0 &&
    longitude >= -180.0 &&
    longitude <= -130.0;

  return isCanada || isAlaska;
};

const isInCentralEurope = (latitude: number, longitude: number) =>
  latitude >= 45.0 && latitude <= 56.0 && longitude >= 2.0 && longitude <= 18.0;

const isInFranceRegion = (latitude: number, longitude: number) =>
  latitude >= 38.0 &&
  latitude <= 55.0 &&
  longitude >= -10.0 &&
  longitude <= 12.0;

const isInNordicRegion = (latitude: number, longitude: number) =>
  latitude >= 54.0 && latitude <= 72.0 && longitude >= 2.0 && longitude <= 35.0;

const isInUSHRRRRegion = (latitude: number, longitude: number) =>
  latitude >= 20.0 &&
  latitude <= 52.0 &&
  longitude >= -130.0 &&
  longitude <= -60.0;

const determineModel = (latitude: number, longitude: number) => {
  if (isInCanadaHRDPSRegion(latitude, longitude)) {
    return 'gem_seamless';
  }

  if (isInCentralEurope(latitude, longitude)) {
    return 'icon_seamless';
  }

  if (isInFranceRegion(latitude, longitude)) {
    return 'meteofrance_seamless';
  }

  if (isInNordicRegion(latitude, longitude)) {
    return 'metno_seamless';
  }

  if (isInUSHRRRRegion(latitude, longitude)) {
    return 'gfs_seamless';
  }

  return null;
};

const pickModel = (latitude: number, longitude: number) => {
  const model = determineModel(latitude, longitude);
  return model ? `&models=${model}` : '';
};

export default pickModel;
