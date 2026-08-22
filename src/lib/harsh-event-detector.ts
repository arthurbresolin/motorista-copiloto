export type AccelerometerReading = {
  x: number;
  y: number;
  z: number;
};

export type EventSeverity = 'none' | 'moderate' | 'severe';

// Frenagens/acelerações bruscas aparecem como uma mudança rápida na força total
// medida pelo acelerômetro. Comparar a diferença entre duas leituras seguidas
// (em vez do valor bruto) cancela a gravidade constante de ~1g, sem precisar
// saber a orientação do aparelho — por isso também não dá pra distinguir freada
// de aceleração (exigiria saber pra que lado o celular está apontado), só a
// intensidade do movimento.
export const HARSH_EVENT_THRESHOLD_G = 0.4;
// Valor inicial (2x o limiar moderado) sem calibração em estrada real — ajustar
// se estiver disparando "grave" com frequência maior ou menor que o esperado.
export const SEVERE_EVENT_THRESHOLD_G = 0.8;

function magnitude(reading: AccelerometerReading): number {
  return Math.sqrt(reading.x ** 2 + reading.y ** 2 + reading.z ** 2);
}

export function classifyEvent(
  previous: AccelerometerReading,
  current: AccelerometerReading,
  moderateThreshold: number = HARSH_EVENT_THRESHOLD_G,
  severeThreshold: number = SEVERE_EVENT_THRESHOLD_G,
): EventSeverity {
  const delta = Math.abs(magnitude(current) - magnitude(previous));
  if (delta >= severeThreshold) {
    return 'severe';
  }
  if (delta >= moderateThreshold) {
    return 'moderate';
  }
  return 'none';
}
