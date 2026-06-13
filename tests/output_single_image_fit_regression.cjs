const fs = require('fs');
const assert = require('assert');

const canvasJs = fs.readFileSync('static/js/canvas.js', 'utf8');
const canvasCss = fs.readFileSync('static/css/canvas.css', 'utf8');
const smartCanvasJs = fs.readFileSync('static/js/smart-canvas.js', 'utf8');
const smartCanvasCss = fs.readFileSync('static/css/smart-canvas.css', 'utf8');

assert(
  canvasJs.includes("single ? ' single-output' : ''"),
  'single output image grids should receive the single-output class'
);
assert(
  /\.output-grid\.single-output\s*\{[\s\S]*height:100%[\s\S]*grid-template-columns:minmax\(0, 1fr\)/.test(canvasCss),
  'single output grid should fill the output node body'
);
assert(
  /\.output-grid\.single-output\s+\.output-img-wrap\s*\{[\s\S]*height:100%[\s\S]*aspect-ratio:auto/.test(canvasCss),
  'single output wrapper should follow node size instead of staying square'
);
assert(
  /\.output-grid\.single-output\s+img\s*\{[\s\S]*object-fit:contain/.test(canvasCss),
  'single output images should be fully visible without cropping'
);
assert(
  /\.image-node\.has-image\s+img\s*\{[\s\S]*object-fit:contain/.test(canvasCss),
  'uploaded image nodes should keep their full image ratio in the node frame'
);
assert(
  /\.image-node\.has-image\s+\.node-body\s*\{[\s\S]*padding:0/.test(canvasCss),
  'uploaded image nodes should not leave padding around the preview'
);
assert(
  smartCanvasJs.includes('isSmartGeneratedOutputNode') && smartCanvasJs.includes('generated-output-wrap'),
  'smart canvas generated output nodes should receive a dedicated fit class'
);
assert(
  /\.generated-output-wrap\s*>\s*\.node-img\s*\{[\s\S]*object-fit:contain/.test(smartCanvasCss),
  'smart canvas generated output images should be fully visible without cropping'
);
