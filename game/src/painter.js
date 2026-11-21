// The painter: every picture in Lantern Cove is drawn here with canvas paths, once per panel.
// buildPanelImages paints a level twice onto off-screen canvases — the left picture with no
// differences applied, the right picture with every difference in scenes.js applied — and the
// renderer then blits those two pictures each frame. A difference id is honoured in exactly
// one place per scene, so what a player can click always matches what they can see.

import { PANEL } from './config.js';

const SCALE = 2;

/** A rounded rectangle path (the renderer and painter share this shape for frames). */
export function roundedRectPath(g, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + width - r, y);
  g.arcTo(x + width, y, x + width, y + r, r);
  g.lineTo(x + width, y + height - r);
  g.arcTo(x + width, y + height, x + width - r, y + height, r);
  g.lineTo(x + r, y + height);
  g.arcTo(x, y + height, x, y + height - r, r);
  g.lineTo(x, y + r);
  g.arcTo(x, y, x + r, y, r);
  g.closePath();
}

function fillRect(g, x, y, width, height, colour) {
  g.fillStyle = colour;
  g.fillRect(x, y, width, height);
}

function circle(g, x, y, radius, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

/** A soft radial glow, used for lantern light, the moon's halo and the lighthouse lamp. */
function glow(g, x, y, radius, colour) {
  const gradient = g.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, colour);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = gradient;
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawStars(g, points, skipIndex) {
  g.fillStyle = '#f5efce';
  for (let index = 0; index < points.length; index += 1) {
    if (index === skipIndex) continue;
    const [x, y, r] = points[index];
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 0.5;
    g.fillRect(x - r * 3, y - 0.6, r * 6, 1.2);
    g.fillRect(x - 0.6, y - r * 3, 1.2, r * 6);
    g.globalAlpha = 1;
  }
}

/** The moon: 'crescent' cuts a sky-coloured bite out of the disc; 'full' shows craters. */
function drawMoon(g, x, y, radius, kind, skyColour) {
  glow(g, x, y, radius * 2.6, 'rgba(245, 239, 206, 0.35)');
  circle(g, x, y, radius, '#f5efce');
  if (kind === 'crescent') {
    circle(g, x + radius * 0.45, y - radius * 0.25, radius * 0.85, skyColour);
  } else {
    g.fillStyle = 'rgba(190, 182, 150, 0.55)';
    for (const [dx, dy, r] of [[-8, -4, 5], [7, 6, 4], [2, -11, 3], [-3, 10, 2.6]]) {
      g.beginPath();
      g.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function drawCloud(g, x, y, scale, colour) {
  g.fillStyle = colour;
  for (const [dx, dy, r] of [[0, 0, 20], [-18, 5, 14], [18, 5, 15], [-6, -8, 13], [10, -6, 12]]) {
    g.beginPath();
    g.arc(x + dx * scale, y + dy * scale, r * scale, 0, Math.PI * 2);
    g.fill();
  }
  g.fillRect(x - 30 * scale, y, 60 * scale, 10 * scale);
}

/** A simple gull: two arcs for wings and a dot of a body. */
function drawGull(g, x, y, scale, colour) {
  g.strokeStyle = colour;
  g.lineWidth = 2.4 * scale;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x - 8 * scale, y, 8 * scale, Math.PI * 1.15, Math.PI * 1.85);
  g.stroke();
  g.beginPath();
  g.arc(x + 8 * scale, y, 8 * scale, Math.PI * 1.15, Math.PI * 1.85);
  g.stroke();
}

function drawWaveCrest(g, x, y, scale, colour) {
  g.strokeStyle = colour;
  g.lineWidth = 2.2 * scale;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x, y, 10 * scale, Math.PI * 1.05, Math.PI * 1.75);
  g.stroke();
  g.beginPath();
  g.arc(x + 14 * scale, y + 2 * scale, 6 * scale, Math.PI * 1.1, Math.PI * 1.8);
  g.stroke();
}

/** A hanging lantern on a post: lit shows warm glass and a glow, unlit shows dark glass. */
function drawLanternPost(g, x, groundY, lit) {
  g.strokeStyle = '#2c2137';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(x, groundY);
  g.lineTo(x, groundY - 62);
  g.quadraticCurveTo(x, groundY - 74, x + 14, groundY - 74);
  g.stroke();
  if (lit) glow(g, x + 16, groundY - 58, 44, 'rgba(255, 190, 90, 0.5)');
  g.fillStyle = '#2c2137';
  g.fillRect(x + 8, groundY - 74, 16, 6);
  roundedRectPath(g, x + 7, groundY - 68, 18, 24, 5);
  g.fillStyle = lit ? '#ffd98a' : '#3a3f55';
  g.fill();
  g.strokeStyle = '#2c2137';
  g.lineWidth = 2;
  g.stroke();
}

// ---------------------------------------------------------------------------
// Scene 1: Lantern Cove, the dusk harbour.
// ---------------------------------------------------------------------------

function drawCove(g, changed) {
  const sky = g.createLinearGradient(0, 0, 0, 310);
  sky.addColorStop(0, '#2b2350');
  sky.addColorStop(0.55, '#7a3d63');
  sky.addColorStop(1, '#e8875a');
  fillRect(g, 0, 0, PANEL.width, 310, '#000');
  g.fillStyle = sky;
  g.fillRect(0, 0, PANEL.width, 310);

  drawStars(g, [[60, 40, 1.8], [150, 84, 1.4], [255, 36, 1.6], [350, 70, 1.3], [430, 130, 1.4], [90, 150, 1.2], [560, 150, 1.5]], -1);
  drawMoon(g, 505, 62, 26, changed.has('moon') ? 'full' : 'crescent', '#3a2a58');
  drawCloud(g, 140, 66, 1, 'rgba(64, 44, 92, 0.85)');
  drawCloud(g, 330, 118, 0.7, 'rgba(64, 44, 92, 0.7)');
  drawGull(g, 180, 122, 1, '#f2e7d5');
  if (!changed.has('gull')) drawGull(g, 215, 100, 0.85, '#f2e7d5');
  drawGull(g, 430, 92, 0.9, '#f2e7d5');

  // Distant hills and the harbour hut on the left shore.
  g.fillStyle = '#3d2c50';
  g.beginPath();
  g.moveTo(0, 310);
  g.quadraticCurveTo(120, 238, 260, 292);
  g.quadraticCurveTo(420, 330, 600, 282);
  g.lineTo(600, 310);
  g.closePath();
  g.fill();
  g.fillStyle = '#54382e';
  g.fillRect(52, 238, 106, 72);
  g.fillStyle = '#33222e';
  g.beginPath();
  g.moveTo(40, 240);
  g.lineTo(105, 202);
  g.lineTo(170, 240);
  g.closePath();
  g.fill();
  fillRect(g, 128, 268, 18, 42, '#241a26');
  if (changed.has('hut-window')) {
    fillRect(g, 88, 248, 34, 26, '#241a26');
  } else {
    glow(g, 105, 261, 30, 'rgba(255, 196, 96, 0.55)');
    fillRect(g, 88, 248, 34, 26, '#ffcf7d');
    g.strokeStyle = '#241a26';
    g.lineWidth = 3;
    g.strokeRect(88, 248, 34, 26);
    g.beginPath();
    g.moveTo(105, 248);
    g.lineTo(105, 274);
    g.stroke();
  }

  // The sea, with a moon path and dusk reflections.
  const sea = g.createLinearGradient(0, 300, 0, 500);
  sea.addColorStop(0, '#7a4460');
  sea.addColorStop(0.25, '#4a3560');
  sea.addColorStop(1, '#232038');
  g.fillStyle = sea;
  g.fillRect(0, 300, PANEL.width, 200);
  g.strokeStyle = 'rgba(245, 220, 180, 0.35)';
  g.lineWidth = 2;
  for (let row = 0; row < 6; row += 1) {
    const y = 322 + row * 16;
    const wobble = (row % 2) * 14;
    g.beginPath();
    g.moveTo(478 + wobble, y);
    g.lineTo(532 - wobble, y);
    g.stroke();
  }
  g.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  for (const [x, y, s] of [[70, 350, 1], [210, 470, 1.2], [420, 350, 0.9], [560, 380, 1], [330, 480, 1]]) {
    drawWaveCrest(g, x, y, s, 'rgba(255, 255, 255, 0.16)');
  }

  // The wooden dock reaching into the water, with crates and a lantern post.
  g.fillStyle = '#4c3423';
  g.beginPath();
  g.moveTo(180, 500);
  g.lineTo(268, 372);
  g.lineTo(316, 372);
  g.lineTo(430, 500);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(20, 12, 8, 0.5)';
  g.lineWidth = 2;
  for (let index = 0; index < 5; index += 1) {
    const y = 396 + index * 26;
    g.beginPath();
    g.moveTo(252 - index * 14, y);
    g.lineTo(338 + index * 16, y);
    g.stroke();
  }
  fillRect(g, 196, 420, 34, 30, '#6b4a2c');
  fillRect(g, 202, 398, 26, 24, '#7d5734');
  g.strokeStyle = '#3c2817';
  g.strokeRect(196, 420, 34, 30);
  drawLanternPost(g, 234, 372, !changed.has('lantern'));

  // The hero boat with the changeable sail, riding centre-frame.
  g.fillStyle = '#5d3a24';
  g.beginPath();
  g.moveTo(272, 372);
  g.lineTo(392, 372);
  g.quadraticCurveTo(378, 398, 344, 402);
  g.lineTo(292, 402);
  g.quadraticCurveTo(276, 394, 272, 372);
  g.closePath();
  g.fill();
  g.strokeStyle = '#2c1c10';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(332, 372);
  g.lineTo(332, 268);
  g.stroke();
  g.fillStyle = changed.has('sail') ? '#e4574f' : '#f6ead2';
  g.beginPath();
  g.moveTo(338, 274);
  g.lineTo(338, 356);
  g.lineTo(382, 356);
  g.closePath();
  g.fill();
  g.fillStyle = changed.has('sail') ? '#f6ead2' : '#e8b34b';
  g.beginPath();
  g.moveTo(326, 282);
  g.lineTo(326, 350);
  g.lineTo(292, 350);
  g.closePath();
  g.fill();
  g.fillStyle = '#e4574f';
  g.beginPath();
  g.moveTo(332, 268);
  g.lineTo(356, 274);
  g.lineTo(332, 282);
  g.closePath();
  g.fill();

  // A small rowboat to the right, and the striped buoy bobbing beyond it.
  g.fillStyle = '#3f5a52';
  g.beginPath();
  g.moveTo(448, 402);
  g.lineTo(528, 402);
  g.quadraticCurveTo(516, 420, 492, 422);
  g.lineTo(466, 422);
  g.quadraticCurveTo(452, 416, 448, 402);
  g.closePath();
  g.fill();
  g.strokeStyle = '#2c1c10';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(470, 400);
  g.lineTo(512, 378);
  g.stroke();
  const buoyColours = changed.has('buoy') ? ['#4f7de4', '#f2ede2'] : ['#e4574f', '#f2ede2'];
  g.beginPath();
  g.moveTo(520, 404);
  g.lineTo(536, 438);
  g.quadraticCurveTo(520, 448, 504, 438);
  g.closePath();
  g.fillStyle = buoyColours[0];
  g.fill();
  g.save();
  g.clip();
  fillRect(g, 502, 420, 36, 9, buoyColours[1]);
  g.restore();
  circle(g, 520, 402, 4, '#2c2137');

  // In the changed picture only, a fish leaps by the dock with a splash.
  if (changed.has('fish')) {
    g.strokeStyle = 'rgba(220, 240, 255, 0.8)';
    g.lineWidth = 2;
    for (const dx of [-12, 0, 12]) {
      g.beginPath();
      g.moveTo(150 + dx, 452);
      g.quadraticCurveTo(150 + dx * 1.4, 440, 150 + dx * 1.8, 446);
      g.stroke();
    }
    g.fillStyle = '#ffb35c';
    g.beginPath();
    g.ellipse(150, 428, 17, 8, -0.5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(164, 420);
    g.lineTo(176, 410);
    g.lineTo(174, 426);
    g.closePath();
    g.fill();
    circle(g, 140, 425, 2.2, '#232038');
  }
}

// ---------------------------------------------------------------------------
// Scene 2: Star Lantern Market, the night bazaar.
// ---------------------------------------------------------------------------

function drawMarketStall(g, x, awningTop, awningColours, drawGoods) {
  const width = 170;
  g.fillStyle = '#241a30';
  g.fillRect(x, awningTop + 26, width, 190);
  g.fillStyle = '#31223f';
  g.fillRect(x + 8, awningTop + 40, width - 16, 120);
  // Scalloped striped awning.
  for (let stripe = 0; stripe < 6; stripe += 1) {
    g.fillStyle = awningColours[stripe % 2];
    g.beginPath();
    g.moveTo(x + stripe * (width / 6), awningTop + 26);
    g.lineTo(x + (stripe + 1) * (width / 6), awningTop + 26);
    g.lineTo(x + (stripe + 0.82) * (width / 6), awningTop);
    g.lineTo(x + (stripe + 0.18) * (width / 6), awningTop);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(x + (stripe + 0.5) * (width / 6), awningTop + 26, width / 12, 0, Math.PI);
    g.fill();
  }
  // Counter and legs.
  fillRect(g, x - 4, awningTop + 158, width + 8, 14, '#5d3a24');
  fillRect(g, x + 4, awningTop + 172, 10, 44, '#3c2817');
  fillRect(g, x + width - 14, awningTop + 172, 10, 44, '#3c2817');
  drawGoods(g, x);
}

function drawMarket(g, changed) {
  const sky = g.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, '#141433');
  sky.addColorStop(0.6, '#2c2350');
  sky.addColorStop(1, '#3a2a55');
  g.fillStyle = sky;
  g.fillRect(0, 0, PANEL.width, PANEL.height);

  drawStars(g, [[140, 30, 1.5], [230, 58, 1.2], [330, 26, 1.6], [430, 48, 1.3], [520, 30, 1.5], [560, 84, 1.2], [180, 96, 1.1]], -1);
  drawMoon(g, 80, 55, 24, changed.has('moon') ? 'full' : 'crescent', '#1c1c42');

  // Rooftops behind the stalls.
  g.fillStyle = '#1d1838';
  g.fillRect(0, 132, 600, 90);
  g.fillStyle = '#171230';
  for (const [x, w] of [[10, 90], [150, 120], [330, 100], [470, 110]]) {
    g.beginPath();
    g.moveTo(x - 8, 140);
    g.lineTo(x + w / 2, 108);
    g.lineTo(x + w + 8, 140);
    g.closePath();
    g.fill();
  }
  fillRect(g, 196, 168, 16, 20, '#ffd98a');
  fillRect(g, 512, 176, 14, 18, '#ffd98a');

  // Two swags of string lights across the top of the market.
  const bulbPoints = [];
  for (const [x0, x1, sag] of [[16, 300, 128], [300, 584, 128]]) {
    g.strokeStyle = 'rgba(10, 8, 20, 0.9)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(x0, 84);
    g.quadraticCurveTo((x0 + x1) / 2, sag + 34, x1, 84);
    g.stroke();
    for (let step = 1; step < 8; step += 1) {
      const t = step / 8;
      const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
      const by = (1 - t) * (1 - t) * 84 + 2 * (1 - t) * t * (sag + 34) + t * t * 84;
      bulbPoints.push([bx, by + 8]);
    }
  }
  for (const [bx, by] of bulbPoints) {
    const isTarget = Math.abs(bx - 360) < 22 && Math.abs(by - 106) < 22;
    const lit = !(isTarget && changed.has('bulb'));
    if (lit) glow(g, bx, by, 20, 'rgba(255, 196, 96, 0.55)');
    circle(g, bx, by, 5.5, lit ? '#ffd98a' : '#3a3f55');
    g.fillStyle = '#14101f';
    g.fillRect(bx - 2, by - 10, 4, 5);
  }

  // Bunting strung under the lights; the middle flag changes colour.
  g.strokeStyle = 'rgba(10, 8, 20, 0.8)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(30, 146);
  g.quadraticCurveTo(300, 176, 570, 146);
  g.stroke();
  const flagColours = ['#e4574f', '#e8b34b', '#4fae8a', '#4f7de4', '#b565d8', '#e8b34b', '#e4574f', '#4fae8a', '#4f7de4'];
  for (let index = 0; index < flagColours.length; index += 1) {
    const t = (index + 0.5) / flagColours.length;
    const fx = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 300 + t * t * 570;
    const fy = (1 - t) * (1 - t) * 146 + 2 * (1 - t) * t * 176 + t * t * 146;
    let colour = flagColours[index];
    if (index === 4 && changed.has('bunting')) colour = '#ff7ac1';
    if (index === 4 && !changed.has('bunting')) colour = '#2fd4c4';
    g.fillStyle = colour;
    g.beginPath();
    g.moveTo(fx - 11, fy);
    g.lineTo(fx + 11, fy);
    g.lineTo(fx, fy + 20);
    g.closePath();
    g.fill();
  }

  // Ground.
  const ground = g.createLinearGradient(0, 420, 0, 500);
  ground.addColorStop(0, '#3a2a4a');
  ground.addColorStop(1, '#241a33');
  g.fillStyle = ground;
  g.fillRect(0, 420, PANEL.width, 80);
  g.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  for (const y of [448, 472]) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(600, y);
    g.stroke();
  }

  // Left stall: paper lanterns. The middle lantern changes shape.
  drawMarketStall(g, 30, 210, ['#e4574f', '#f6ead2'], (g2, x) => {
    const lanterns = [[x + 38, 286, '#e8b34b'], [x + 85, 300, '#e4574f'], [x + 132, 286, '#4fae8a']];
    for (const [lx, ly, colour] of lanterns) {
      g2.strokeStyle = '#14101f';
      g2.lineWidth = 2;
      g2.beginPath();
      g2.moveTo(lx, 252);
      g2.lineTo(lx, ly - 16);
      g2.stroke();
      glow(g2, lx, ly, 30, 'rgba(255, 190, 90, 0.35)');
      g2.fillStyle = colour;
      if (lx === x + 85 && changed.has('lantern-shape')) {
        roundedRectPath(g2, lx - 15, ly - 16, 30, 32, 4);
        g2.fill();
      } else {
        g2.beginPath();
        g2.ellipse(lx, ly, 16, 19, 0, 0, Math.PI * 2);
        g2.fill();
      }
      g2.strokeStyle = 'rgba(90, 30, 20, 0.5)';
      g2.beginPath();
      g2.moveTo(lx - 10, ly - 12);
      g2.quadraticCurveTo(lx, ly, lx - 10, ly + 12);
      g2.moveTo(lx + 10, ly - 12);
      g2.quadraticCurveTo(lx, ly, lx + 10, ly + 12);
      g2.stroke();
    }
    fillRect(g2, x + 22, 384, 52, 26, '#6b4a2c');
    fillRect(g2, x + 96, 384, 52, 26, '#6b4a2c');
  });

  // Middle stall: fruit. Its awning is restriped and an apple can vanish.
  const middleAwning = changed.has('awning') ? ['#2f9e8f', '#f6ead2'] : ['#e4574f', '#f6ead2'];
  drawMarketStall(g, 215, 210, middleAwning, (g2, x) => {
    // A shelf of bread loaves above the fruit crates.
    fillRect(g2, x + 20, 322, 130, 6, '#5d3a24');
    for (let index = 0; index < 3; index += 1) {
      g2.fillStyle = '#d9a05f';
      g2.beginPath();
      g2.ellipse(x + 42 + index * 44, 314, 16, 9, 0, 0, Math.PI * 2);
      g2.fill();
      g2.strokeStyle = 'rgba(120, 70, 30, 0.6)';
      g2.lineWidth = 1.6;
      g2.beginPath();
      g2.moveTo(x + 34 + index * 44, 310);
      g2.lineTo(x + 40 + index * 44, 316);
      g2.moveTo(x + 44 + index * 44, 309);
      g2.lineTo(x + 50 + index * 44, 315);
      g2.stroke();
    }
    fillRect(g2, x + 18, 372, 62, 34, '#6b4a2c');
    g2.strokeStyle = '#3c2817';
    g2.lineWidth = 2;
    g2.strokeRect(x + 18, 372, 62, 34);
    const appleSpots = [[32, 384], [52, 380], [70, 386], [42, 396], [62, 398], [86, 388]];
    appleSpots.forEach(([ax, ay], index) => {
      if (index === 5 && changed.has('apples')) return;
      circle(g2, x + ax, ay, 8, index % 2 ? '#c93a34' : '#e4574f');
      g2.strokeStyle = '#3c5a2e';
      g2.beginPath();
      g2.moveTo(x + ax, ay - 7);
      g2.quadraticCurveTo(x + ax + 2, ay - 12, x + ax + 6, ay - 12);
      g2.stroke();
    });
    for (let index = 0; index < 4; index += 1) {
      circle(g2, x + 104 + index * 14, 388 + (index % 2) * 8, 8, '#e8a33d');
    }
    fillRect(g2, x + 96, 372, 62, 34, '#6b4a2c');
    g2.strokeRect(x + 96, 372, 62, 34);
    for (let index = 0; index < 4; index += 1) {
      circle(g2, x + 110 + index * 14, 388 + (index % 2) * 8, 8, '#e8a33d');
    }
  });

  // Right stall: potion jars on shelves. One jar changes colour.
  drawMarketStall(g, 400, 210, ['#4f7de4', '#f6ead2'], (g2, x) => {
    // A round lantern hangs over the potion shelves.
    g2.strokeStyle = '#14101f';
    g2.lineWidth = 2;
    g2.beginPath();
    g2.moveTo(x + 85, 252);
    g2.lineTo(x + 85, 262);
    g2.stroke();
    glow(g2, x + 85, 278, 28, 'rgba(255, 190, 90, 0.35)');
    g2.fillStyle = '#e8b34b';
    g2.beginPath();
    g2.ellipse(x + 85, 278, 14, 16, 0, 0, Math.PI * 2);
    g2.fill();
    for (const shelfY of [316, 356]) {
      fillRect(g2, x + 14, shelfY + 22, 142, 6, '#5d3a24');
      for (let index = 0; index < 4; index += 1) {
        const jx = x + 30 + index * 36;
        const isTarget = shelfY === 316 && index === 2;
        let colour = ['#4fae8a', '#e8b34b', '#57b6e4', '#b565d8'][(index + (shelfY === 356 ? 1 : 0)) % 4];
        if (isTarget) colour = changed.has('jar') ? '#b565d8' : '#4fae8a';
        g2.fillStyle = colour;
        roundedRectPath(g2, jx - 9, shelfY - 2, 18, 24, 5);
        g2.fill();
        fillRect(g2, jx - 4, shelfY - 8, 8, 6, '#2c2137');
        g2.fillStyle = 'rgba(255, 255, 255, 0.35)';
        g2.fillRect(jx - 5, shelfY + 2, 3, 12);
      }
    }
  });

  // The hanging sign between the middle and right stalls: star charm or moon charm.
  g.strokeStyle = '#14101f';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(410, 150);
  g.lineTo(410, 162);
  g.stroke();
  g.fillStyle = '#5d3a24';
  roundedRectPath(g, 388, 162, 44, 34, 5);
  g.fill();
  g.strokeStyle = '#2c1c10';
  g.lineWidth = 2;
  g.stroke();
  if (changed.has('sign')) {
    drawMoon(g, 410, 179, 9, 'crescent', '#5d3a24');
  } else {
    g.fillStyle = '#ffd98a';
    g.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const radius = point % 2 ? 4.4 : 10;
      const px = 410 + Math.cos(angle) * radius;
      const py = 179 + Math.sin(angle) * radius;
      if (point === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  }

  // The market cat, sitting on the ground in front of the lantern stall, scarf or not.
  const catX = 150;
  const catY = 452;
  g.fillStyle = '#7d7396';
  g.beginPath();
  g.ellipse(catX, catY, 19, 14, 0, 0, Math.PI * 2);
  g.fill();
  circle(g, catX + 2, catY - 17, 11, '#7d7396');
  g.beginPath();
  g.moveTo(catX - 6, catY - 23);
  g.lineTo(catX - 2, catY - 32);
  g.lineTo(catX + 2, catY - 24);
  g.moveTo(catX + 6, catY - 24);
  g.lineTo(catX + 11, catY - 32);
  g.lineTo(catX + 13, catY - 22);
  g.closePath();
  g.fill();
  g.strokeStyle = '#7d7396';
  g.lineWidth = 4.5;
  g.beginPath();
  g.moveTo(catX - 17, catY + 7);
  g.quadraticCurveTo(catX - 31, catY + 2, catX - 26, catY - 12);
  g.stroke();
  circle(g, catX - 1, catY - 17, 1.7, '#ffd98a');
  circle(g, catX + 6, catY - 17, 1.7, '#ffd98a');
  if (!changed.has('cat')) {
    g.fillStyle = '#e4574f';
    g.fillRect(catX - 8, catY - 9, 19, 6);
    g.fillRect(catX + 7, catY - 9, 5, 13);
  }
}

// ---------------------------------------------------------------------------
// Scene 3: Moonlit Lighthouse, the storm coast.
// ---------------------------------------------------------------------------

function drawLighthouse(g, changed) {
  const sky = g.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, '#101528');
  sky.addColorStop(0.55, '#27335c');
  sky.addColorStop(1, '#3d4a75');
  g.fillStyle = sky;
  g.fillRect(0, 0, PANEL.width, PANEL.height);

  const starPoints = [[40, 120, 1.4], [200, 40, 1.5], [300, 84, 1.2], [392, 36, 1.4], [480, 60, 1.9], [540, 110, 1.3], [580, 44, 1.5], [250, 150, 1.1]];
  drawStars(g, starPoints, changed.has('star') ? 4 : -1);
  drawMoon(g, 92, 68, 27, 'full', '#232c52');
  drawCloud(g, 210, 52, 0.9, 'rgba(16, 20, 40, 0.9)');
  drawCloud(g, 520, 150, 1.1, 'rgba(16, 20, 40, 0.85)');
  if (changed.has('cloud')) drawCloud(g, 140, 78, 0.85, 'rgba(13, 16, 34, 0.95)');
  if (!changed.has('gull')) drawGull(g, 330, 140, 0.9, '#cfd8ee');
  drawGull(g, 282, 168, 0.75, '#cfd8ee');

  // The beam sweeps left from the lamp; in the changed picture it falls short.
  const beamEndX = changed.has('beam') ? 330 : 58;
  const beamGradient = g.createLinearGradient(445, 105, beamEndX, 128);
  beamGradient.addColorStop(0, 'rgba(255, 240, 190, 0.5)');
  beamGradient.addColorStop(1, 'rgba(255, 240, 190, 0)');
  g.fillStyle = beamGradient;
  g.beginPath();
  g.moveTo(438, 96);
  g.lineTo(beamEndX, 84);
  g.lineTo(beamEndX, 168);
  g.lineTo(438, 116);
  g.closePath();
  g.fill();

  // The cliff, rising from the sea to the lighthouse on the right.
  g.fillStyle = '#1c2138';
  g.beginPath();
  g.moveTo(250, 500);
  g.quadraticCurveTo(300, 380, 372, 348);
  g.lineTo(560, 348);
  g.quadraticCurveTo(600, 420, 600, 500);
  g.closePath();
  g.fill();
  g.fillStyle = '#262c47';
  g.beginPath();
  g.moveTo(372, 348);
  g.lineTo(560, 348);
  g.quadraticCurveTo(580, 400, 588, 440);
  g.lineTo(430, 440);
  g.quadraticCurveTo(390, 400, 372, 348);
  g.closePath();
  g.fill();

  // The lighthouse tower: tapered, banded, with a lamp room and a door.
  g.fillStyle = '#e8e2d2';
  g.beginPath();
  g.moveTo(408, 348);
  g.lineTo(424, 128);
  g.lineTo(466, 128);
  g.lineTo(482, 348);
  g.closePath();
  g.fill();
  g.save();
  g.clip();
  fillRect(g, 400, 150, 90, 26, '#c93a34');
  if (!changed.has('stripe')) fillRect(g, 400, 198, 90, 26, '#c93a34');
  fillRect(g, 400, 246, 90, 26, '#c93a34');
  fillRect(g, 400, 294, 90, 26, '#c93a34');
  g.restore();
  g.strokeStyle = 'rgba(30, 30, 50, 0.35)';
  g.lineWidth = 2;
  g.stroke();
  fillRect(g, 418, 108, 54, 22, '#232038');
  glow(g, 445, 106, 42, 'rgba(255, 240, 190, 0.65)');
  circle(g, 445, 106, 9, '#ffedb5');
  fillRect(g, 412, 100, 66, 8, '#c93a34');
  g.beginPath();
  g.moveTo(408, 100);
  g.lineTo(445, 78);
  g.lineTo(482, 100);
  g.closePath();
  g.fillStyle = '#a02c28';
  g.fill();
  fillRect(g, 436, 168, 18, 22, '#ffd98a');
  g.strokeStyle = '#232038';
  g.strokeRect(436, 168, 18, 22);
  // The door: shut with a brass knob, or swung open onto darkness.
  if (changed.has('door')) {
    fillRect(g, 432, 302, 26, 46, '#10101e');
    g.fillStyle = '#5d3a24';
    g.beginPath();
    g.moveTo(458, 302);
    g.lineTo(472, 310);
    g.lineTo(472, 352);
    g.lineTo(458, 348);
    g.closePath();
    g.fill();
  } else {
    fillRect(g, 432, 302, 26, 46, '#5d3a24');
    g.strokeStyle = '#2c1c10';
    g.strokeRect(432, 302, 26, 46);
    circle(g, 452, 326, 2.6, '#e8b34b');
  }

  // A winding path with a fence; one post can go missing.
  g.strokeStyle = 'rgba(210, 200, 170, 0.28)';
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(238, 452);
  g.quadraticCurveTo(320, 400, 420, 356);
  g.stroke();
  const fencePosts = [[252, 428], [276, 408], [300, 390], [326, 374], [352, 362]];
  g.strokeStyle = '#4c3a26';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(246, 414);
  g.quadraticCurveTo(300, 372, 360, 348);
  g.stroke();
  for (const [px, py] of fencePosts) {
    if (px === 300 && changed.has('fence')) continue;
    fillRect(g, px - 3, py - 16, 6, 22, '#5d422a');
  }
  // The post that can go missing stands at (300, 390) on the path, drawn y 374..396.

  // The keeper's cottage on the left headland.
  g.fillStyle = '#232038';
  g.beginPath();
  g.moveTo(0, 500);
  g.quadraticCurveTo(60, 380, 150, 356);
  g.lineTo(250, 356);
  g.quadraticCurveTo(258, 430, 250, 500);
  g.closePath();
  g.fill();
  fillRect(g, 58, 292, 96, 62, '#4a4266');
  g.fillStyle = '#2c2440';
  g.beginPath();
  g.moveTo(48, 294);
  g.lineTo(106, 262);
  g.lineTo(164, 294);
  g.closePath();
  g.fill();
  fillRect(g, 122, 318, 18, 36, '#241a26');
  if (changed.has('cottage-window')) {
    fillRect(g, 84, 306, 26, 24, '#241a26');
  } else {
    glow(g, 97, 318, 26, 'rgba(255, 196, 96, 0.5)');
    fillRect(g, 84, 306, 26, 24, '#ffcf7d');
    g.strokeStyle = '#241a26';
    g.lineWidth = 2.5;
    g.strokeRect(84, 306, 26, 24);
  }
  fillRect(g, 132, 268, 12, 20, '#332b4d');

  // The sea in front, with the little ship and the foam crests.
  const sea = g.createLinearGradient(0, 420, 0, 500);
  sea.addColorStop(0, 'rgba(38, 48, 88, 0)');
  sea.addColorStop(1, '#141a30');
  g.fillStyle = sea;
  g.fillRect(0, 420, PANEL.width, 80);
  g.fillStyle = '#0f1428';
  g.fillRect(0, 462, PANEL.width, 38);
  // The little ship, which can lose its sail.
  g.strokeStyle = '#0d0f1c';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(140, 428);
  g.lineTo(140, 384);
  g.stroke();
  if (!changed.has('ship-sail')) {
    g.fillStyle = '#dfe6f5';
    g.beginPath();
    g.moveTo(146, 388);
    g.lineTo(146, 420);
    g.lineTo(172, 420);
    g.closePath();
    g.fill();
  }
  g.fillStyle = '#1f2a4a';
  g.beginPath();
  g.moveTo(104, 428);
  g.lineTo(178, 428);
  g.quadraticCurveTo(168, 444, 148, 446);
  g.lineTo(122, 446);
  g.quadraticCurveTo(108, 440, 104, 428);
  g.closePath();
  g.fill();
  for (const [x, y, s] of [[60, 470, 1.1], [240, 452, 1.2], [330, 478, 1], [470, 470, 0.9]]) {
    if (x === 240 && changed.has('wave')) continue;
    drawWaveCrest(g, x, y, s, 'rgba(200, 220, 255, 0.5)');
  }

  // The life ring hanging on the rocks below the lighthouse.
  const ringColour = changed.has('ring') ? '#4f7de4' : '#e8793a';
  circle(g, 520, 430, 15, ringColour);
  circle(g, 520, 430, 8, '#1c2138');
  g.fillStyle = '#f2ede2';
  for (const angle of [0.4, 1.9, 3.5, 5.0]) {
    g.save();
    g.translate(520, 430);
    g.rotate(angle);
    g.fillRect(6, -3.4, 9, 6.8);
    g.restore();
  }
  g.strokeStyle = '#0d0f1c';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(520, 415);
  g.lineTo(520, 398);
  g.stroke();
}

// ---------------------------------------------------------------------------
// Panel building: one painter per scene id, chosen by level.
// ---------------------------------------------------------------------------

const PAINTERS = { cove: drawCove, market: drawMarket, lighthouse: drawLighthouse };

function paintPanel(level, changedIds) {
  const canvas = document.createElement('canvas');
  canvas.width = PANEL.width * SCALE;
  canvas.height = PANEL.height * SCALE;
  const g = canvas.getContext('2d');
  g.scale(SCALE, SCALE);
  PAINTERS[level.id](g, changedIds);
  // A gentle inner vignette so both pictures feel like framed prints.
  const vignette = g.createRadialGradient(300, 250, 190, 300, 250, 430);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(5, 5, 15, 0.28)');
  g.fillStyle = vignette;
  g.fillRect(0, 0, PANEL.width, PANEL.height);
  return canvas;
}

/**
 * Paint a level's two pictures: the original (no differences) and the changed copy (every
 * difference applied). Returns { original, changed } canvases in scene resolution x2.
 */
export function buildPanelImages(level) {
  const allChanged = new Set(level.differences.map((difference) => difference.id));
  return {
    original: paintPanel(level, new Set()),
    changed: paintPanel(level, allChanged),
  };
}
