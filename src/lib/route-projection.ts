export type RoutePoint = {
  lat: number;
  lng: number;
  harsh: boolean;
};

export type ProjectedPoint = {
  x: number;
  y: number;
  harsh: boolean;
};

// Projeta lat/lng num viewBox 0-100 estilizado (não é um mapa real com
// escala geográfica correta) via normalização min/max por eixo.
export function projectRoute(points: RoutePoint[]): ProjectedPoint[] {
  if (points.length === 0) {
    return [];
  }
  if (points.length === 1) {
    return [{ x: 50, y: 50, harsh: points[0].harsh }];
  }

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  return points.map((point) => ({
    x: lngRange === 0 ? 50 : ((point.lng - minLng) / lngRange) * 100,
    // latitude cresce pra norte, SVG cresce pra baixo — precisa inverter o eixo Y.
    y: latRange === 0 ? 50 : 100 - ((point.lat - minLat) / latRange) * 100,
    harsh: point.harsh,
  }));
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// Distância entre dois pontos por fórmula de haversine — suficiente pra estimar
// km percorridos numa sessão, não pra navegação de precisão.
function haversineDistanceKm(a: RoutePoint, b: RoutePoint) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeRouteDistanceKm(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistanceKm(points[i - 1], points[i]);
  }
  return total;
}
