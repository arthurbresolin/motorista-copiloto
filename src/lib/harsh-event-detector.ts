export type AccelerometerReading = {
  x: number;
  y: number;
  z: number;
};

// Frenagens/acelerações bruscas aparecem como uma mudança rápida na força total
// medida pelo acelerômetro. Comparar a diferença entre duas leituras seguidas
// (em vez do valor bruto) cancela a gravidade constante de ~1g, sem precisar
// saber a orientação do aparelho.
export const HARSH_EVENT_THRESHOLD_G = 0.4;

function magnitude(reading: AccelerometerReading): number {
  return Math.sqrt(reading.x ** 2 + reading.y ** 2 + reading.z ** 2);
}

export function isHarshEvent(
  previous: AccelerometerReading,
  current: AccelerometerReading,
  threshold: number = HARSH_EVENT_THRESHOLD_G,
): boolean {
  return Math.abs(magnitude(current) - magnitude(previous)) >= threshold;
}
