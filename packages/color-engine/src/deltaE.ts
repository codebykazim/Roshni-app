import type { Lab } from './convert';

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** CIEDE2000 colour difference (Sharma, Wu, Dalal 2005). */
export function deltaE2000(c1: Lab, c2: Lab): number {
  const { L: L1, a: a1, b: b1 } = c1;
  const { L: L2, a: a2, b: b2 } = c2;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  const hp = (b: number, ap: number) => {
    if (b === 0 && ap === 0) return 0;
    const h = deg(Math.atan2(b, ap));
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(b1, a1p);
  const h2p = hp(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp: number;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hbarp = (h1p + h2p + 360) / 2;
  } else {
    hbarp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.2 * Math.cos(rad(4 * hbarp - 63));

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Cbarp7 = Math.pow(Cbarp, 7);
  const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc;

  const l = dLp / Sl;
  const c = dCp / Sc;
  const h = dHp / Sh;
  return Math.sqrt(l * l + c * c + h * h + Rt * c * h);
}

/** Fast Euclidean distance in Lab (CIE76). Used for clustering, not for naming. */
export function deltaE76(c1: Lab, c2: Lab): number {
  return Math.hypot(c1.L - c2.L, c1.a - c2.a, c1.b - c2.b);
}
