export type PlateKind = 'demo' | 'rg' | 'by';

/** The viewers a plate is validated against. `normal` is full colour vision. */
export type Viewer = 'normal' | 'protan' | 'deutan' | 'tritan';

export interface Plate {
  id: string;
  kind: PlateKind;
  /** The number hidden in the plate, as text (for example "29"). */
  answer: string;
  /** Answer options shown to the player: the answer plus distractors, already shuffled. */
  choices: string[];
  /**
   * Dots, flattened four numbers each: x, y, r, rgb. The plate is a disc of radius 1000 centred on
   * (0, 0); x, y and r are in those units; rgb is 0xRRGGBB.
   */
  dots: number[];
  /**
   * How well each viewer could tell the number's dots from the background, as balanced accuracy of
   * a nearest-colour classifier after simulating that viewer (0.5 = no better than chance).
   */
  metrics: Record<Viewer, number>;
  seed: number;
}

export interface PlateSet {
  /** Bump when the plates change, so stored results stay interpretable. */
  version: string;
  /** Honest status of the set. */
  status: string;
  plates: Plate[];
}

export interface DotView {
  /** Unit coordinates: the plate is a disc of radius 1 centred on (0, 0). */
  x: number;
  y: number;
  r: number;
  color: string;
}
