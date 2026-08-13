import { Circle, G, Line, Path, Rect, Svg, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/**
 * Ilustrações das aulas do Modo Copiloto.
 *
 * Desenhadas em SVG no próprio código em vez de imagens: acompanham o tema
 * claro/escuro sozinhas, não pesam no bundle e não dependem de um pipeline de
 * assets. Em compensação precisam ser simples — são diagramas de apoio à voz,
 * não desenho técnico.
 *
 * O `viewBox` é sempre 100x100 pra que trocar de ilustração não mude o
 * tamanho da caixa na tela.
 */
export type IllustrationId = 'volante-maos' | 'pedais';

function VolanteMaos({ traco, destaque, texto }: Cores) {
  return (
    <>
      {/* Aro e cubo do volante */}
      <Circle cx={50} cy={52} r={30} stroke={traco} strokeWidth={4} fill="none" />
      <Circle cx={50} cy={52} r={9} fill={traco} />
      <Line x1={50} y1={43} x2={50} y2={26} stroke={traco} strokeWidth={3} />
      <Line x1={50} y1={58} x2={34} y2={72} stroke={traco} strokeWidth={3} />
      <Line x1={50} y1={58} x2={66} y2={72} stroke={traco} strokeWidth={3} />

      {/* As mãos: 9 e 3 horas, que é a posição que a aula ensina */}
      <G>
        <Rect x={12} y={44} width={13} height={16} rx={6} fill={destaque} />
        <Rect x={75} y={44} width={13} height={16} rx={6} fill={destaque} />
      </G>

      <SvgText x={18} y={34} fontSize={11} fontWeight="bold" fill={texto} textAnchor="middle">
        9
      </SvgText>
      <SvgText x={82} y={34} fontSize={11} fontWeight="bold" fill={texto} textAnchor="middle">
        3
      </SvgText>
    </>
  );
}

function Pedais({ traco, destaque, texto }: Cores) {
  // Ordem da esquerda pra direita no carro: embreagem, freio, acelerador.
  const pedais = [
    { x: 12, altura: 34, rotulo: 'A', destacado: true },
    { x: 42, altura: 30, rotulo: 'B', destacado: false },
    { x: 70, altura: 26, rotulo: 'C', destacado: false },
  ];

  return (
    <>
      {/* Assoalho */}
      <Path d="M6 80 H94" stroke={traco} strokeWidth={3} strokeLinecap="round" />

      {pedais.map((pedal) => (
        <G key={pedal.rotulo}>
          <Rect
            x={pedal.x}
            y={80 - pedal.altura}
            width={18}
            height={pedal.altura}
            rx={5}
            fill={pedal.destacado ? destaque : 'none'}
            stroke={pedal.destacado ? destaque : traco}
            strokeWidth={3}
          />
          <SvgText
            x={pedal.x + 9}
            y={92}
            fontSize={11}
            fontWeight="bold"
            fill={texto}
            textAnchor="middle">
            {pedal.rotulo}
          </SvgText>
        </G>
      ))}

      {/* A embreagem é a que a aula trata, por isso só ela vem preenchida.
          O rótulo fica centrado no desenho e aponta pro pedal por uma linha:
          centrado em cima do próprio pedal, que fica na ponta esquerda, a
          palavra estourava a borda do viewBox e aparecia cortada. */}
      <SvgText x={50} y={14} fontSize={9} fontWeight="bold" fill={texto} textAnchor="middle">
        embreagem
      </SvgText>
      <Line x1={44} y1={18} x2={21} y2={42} stroke={destaque} strokeWidth={2} />
    </>
  );
}

type Cores = { traco: string; destaque: string; texto: string };

const DESENHOS: Record<IllustrationId, (cores: Cores) => React.ReactElement> = {
  'volante-maos': VolanteMaos,
  pedais: Pedais,
};

export function LessonIllustration({ id, size = 160 }: { id: IllustrationId; size?: number }) {
  const theme = useTheme();
  const Desenho = DESENHOS[id];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Desenho traco={theme.textSecondary} destaque={theme.accent} texto={theme.text} />
    </Svg>
  );
}
