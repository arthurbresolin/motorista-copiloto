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
