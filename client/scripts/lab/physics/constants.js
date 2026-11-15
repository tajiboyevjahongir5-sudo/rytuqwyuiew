// Fizikaviy doimiylar va atrof-muhit parametrlari

export const GRAVITY = Object.freeze({
  earth: { id: 'earth', name: 'Yer', g: 9.80665, color: '#38bdf8' },
  moon: { id: 'moon', name: 'Oy', g: 1.62, color: '#cbd5e1' },
  mars: { id: 'mars', name: 'Mars', g: 3.72, color: '#f87171' },
  jupiter: { id: 'jupiter', name: 'Yupiter', g: 24.79, color: '#fbbf24' },
  zero: { id: 'zero', name: 'Vaznsizlik (0 g)', g: 0.0, color: '#a78bfa' },
});

export const AIR_DENSITY = {
  vacuum: 0.0,
  air: 1.225, // kg/m^3 (15°C, 1 atm)
};

export const SHAPES = Object.freeze({
  sphere: { id: 'sphere', name: 'Metall shar', cd: 0.47, crossSection: (r) => Math.PI * r * r },
  cube: { id: 'cube', name: 'Kub', cd: 1.05, crossSection: (r) => 4 * r * r },
  feather: { id: 'feather', name: 'Yengil disk/pat', cd: 1.2, crossSection: (r) => Math.PI * r * r * 2.5 },
});
