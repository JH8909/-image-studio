const fs = require('fs');
const assert = require('assert');

const canvasJs = fs.readFileSync('static/js/canvas.js', 'utf8');
const indexHtml = fs.readFileSync('static/index.html', 'utf8');

assert(
  canvasJs.includes("const LAST_OPEN_CANVAS_ID_KEY = 'canvas_last_open_id'"),
  'classic canvas should remember the last opened canvas id'
);
assert(
  canvasJs.includes('function canvasIdFromLocation()') && canvasJs.includes('function rememberOpenCanvasId(id)'),
  'classic canvas should restore from URL id or remembered id'
);
assert(
  /const restoreId = canvasIdFromLocation\(\) \|\| lastOpenCanvasId\(\);[\s\S]*await openCanvas\(restoreId\);/.test(canvasJs),
  'canvas startup should reopen the saved canvas instead of always showing the create gate'
);
assert(
  indexHtml.includes("const CANVAS_FRAME_URL_KEY = 'studio_canvas_frame_url'"),
  'shell should persist the current canvas iframe URL'
);
assert(
  indexHtml.includes("event.data?.type === 'canvas-frame-url'") && indexHtml.includes('canvasFrame.dataset.src = canvasFrameUrl'),
  'shell should restore the canvas iframe URL after page refresh'
);
