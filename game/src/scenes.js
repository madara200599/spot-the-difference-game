// The three Lantern Cove scenes and every difference hidden in them. Positions are in scene
// coordinates (600 x 500, see config.js): x and y say where the changed detail sits in the
// picture and r is how close a click must land to count as finding it. The painter draws the
// left panel with no differences applied and the right panel with all of them applied, so a
// difference only exists where painter.js honours the same id. Levels rise in difficulty:
// more differences, smaller details, and less time per find.

export const LEVELS = [
  {
    id: 'cove',
    title: 'Lantern Cove',
    subtitle: 'Level 1 · The Dusk Harbour',
    timeSeconds: 180,
    differences: [
      { id: 'moon', label: 'the moon changed its face', x: 505, y: 62, r: 34 },
      { id: 'gull', label: 'a gull flew away', x: 215, y: 100, r: 20 },
      { id: 'hut-window', label: 'the harbour hut went dark', x: 105, y: 258, r: 22 },
      { id: 'lantern', label: 'a dock lantern went out', x: 250, y: 314, r: 24 },
      { id: 'sail', label: 'a sail changed colour', x: 348, y: 322, r: 30 },
      { id: 'buoy', label: 'the buoy was repainted', x: 520, y: 430, r: 22 },
      { id: 'fish', label: 'a fish leapt out of the sea', x: 150, y: 428, r: 24 },
    ],
  },
  {
    id: 'market',
    title: 'Star Lantern Market',
    subtitle: 'Level 2 · The Night Bazaar',
    timeSeconds: 200,
    differences: [
      { id: 'moon', label: 'the moon waxed full', x: 80, y: 55, r: 26 },
      { id: 'bulb', label: 'a string light went out', x: 371, y: 120, r: 18 },
      { id: 'bunting', label: 'a bunting flag changed colour', x: 300, y: 158, r: 18 },
      { id: 'sign', label: 'the hanging sign changed its charm', x: 410, y: 178, r: 20 },
      { id: 'awning', label: 'the middle awning was restriped', x: 300, y: 225, r: 30 },
      { id: 'lantern-shape', label: 'a paper lantern changed shape', x: 115, y: 300, r: 24 },
      { id: 'jar', label: 'a potion jar changed colour', x: 502, y: 326, r: 20 },
      { id: 'apples', label: 'an apple vanished from the crate', x: 300, y: 395, r: 26 },
      { id: 'cat', label: 'the market cat lost its scarf', x: 150, y: 445, r: 22 },
    ],
  },
  {
    id: 'lighthouse',
    title: 'Moonlit Lighthouse',
    subtitle: 'Level 3 · The Storm Coast',
    timeSeconds: 220,
    differences: [
      { id: 'star', label: 'a star blinked out', x: 480, y: 60, r: 18 },
      { id: 'cloud', label: 'a cloud drifted over the moon', x: 140, y: 78, r: 28 },
      { id: 'beam', label: 'the light beam fell short', x: 250, y: 118, r: 30 },
      { id: 'gull', label: 'a gull vanished into the storm', x: 330, y: 140, r: 18 },
      { id: 'stripe', label: 'the lighthouse lost a stripe', x: 445, y: 210, r: 30 },
      { id: 'door', label: 'the lighthouse door swung open', x: 445, y: 315, r: 20 },
      { id: 'cottage-window', label: 'the cottage window went dark', x: 105, y: 318, r: 18 },
      { id: 'fence', label: 'a fence post went missing', x: 300, y: 385, r: 18 },
      { id: 'ship-sail', label: 'the little ship lost its sail', x: 140, y: 398, r: 24 },
      { id: 'ring', label: 'the life ring was repainted', x: 520, y: 430, r: 20 },
      { id: 'wave', label: 'a wave crest disappeared', x: 240, y: 452, r: 24 },
    ],
  },
];

/** The difference with this id in a level, or null when the level has none. */
export function differenceById(level, id) {
  for (const difference of level.differences) {
    if (difference.id === id) return difference;
  }
  return null;
}
