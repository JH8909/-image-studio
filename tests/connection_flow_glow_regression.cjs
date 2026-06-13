const fs = require('fs');
const assert = require('assert');

const canvasJs = fs.readFileSync('static/js/canvas.js', 'utf8');
const smartCanvasJs = fs.readFileSync('static/js/smart-canvas.js', 'utf8');
const canvasCss = fs.readFileSync('static/css/canvas.css', 'utf8');
const smartCanvasCss = fs.readFileSync('static/css/smart-canvas.css', 'utf8');

assert(
  canvasJs.includes('appendConnectionFlowGradient') && canvasJs.includes("'link link-flow-glow'"),
  'classic canvas should render continuous gradient glow paths for every connection'
);
assert(
  smartCanvasJs.includes('smartConnectionFlowDefs') && smartCanvasJs.includes('conn-flow-glow'),
  'smart canvas should render continuous gradient glow paths for every connection'
);
assert(
  /\.link-flow-glow\s*\{[\s\S]*stroke:url\(#connectionFlowGlow\)[\s\S]*stroke-width:3/.test(canvasCss),
  'classic canvas glow should use a continuous moving gradient stroke'
);
assert(
  /\.connection-layer\s+\.conn-flow-glow\s*\{[\s\S]*stroke:url\(#smartConnectionFlowGlow\)[\s\S]*stroke-width:2\.8/.test(smartCanvasCss),
  'smart canvas glow should use a continuous moving gradient stroke'
);
assert(!/flow-[a-z]+\s*\{[^}]*stroke-dasharray/.test(canvasCss), 'classic canvas flow glow should not use segmented dashes');
assert(!/conn-flow-[a-z]+\s*\{[^}]*stroke-dasharray/.test(smartCanvasCss), 'smart canvas flow glow should not use segmented dashes');
