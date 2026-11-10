import { plateDots, type Plate } from '@roshni/plates';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { useMemo } from 'react';

interface Props {
  plate: Plate;
  size: number;
}

/** Draws one colour-vision plate. Dots come from stored data, so every phone shows the same plate. */
export function PlateView({ plate, size }: Props) {
  const dots = useMemo(() => plateDots(plate), [plate]);
  const half = size / 2;
  return (
    <Canvas style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no">
      {dots.map((d, i) => (
        <Circle key={i} cx={half + d.x * half} cy={half + d.y * half} r={d.r * half} color={d.color} />
      ))}
    </Canvas>
  );
}
