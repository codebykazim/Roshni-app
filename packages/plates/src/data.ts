import data from '../data/plates.json';

import type { PlateSet } from './types';

/** The generated plate set. Static data: nothing is randomised at runtime. */
export const plateSet = data as unknown as PlateSet;
