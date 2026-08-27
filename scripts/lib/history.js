'use strict';
// Keep the version a review judged.
//
// A review loopback rewrites a screen in place: 60_qa keeps P-A-1 and P-A-2, but
// the screen those rounds were about has only one version on disk. The QA report
// then cites a file that no longer says what it said. Archiving before overwrite
// is the smallest thing that closes that gap.

const fs = require('fs');
const path = require('path');

function historyDir(file) {
  return path.join(path.dirname(file), '.history');
}

// Returns the archived path, or null when there was nothing to archive - the
// first write of a file is not an error, and treating it as one would put a
// try/catch in every caller.
function archive(file) {
  let body;
  try {
    body = fs.readFileSync(file);
  } catch {
    return null;
  }

  const dir = historyDir(file);
  fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(file);
  const base = path.basename(file, ext);

  let n = 1;
  let target;
  do {
    target = path.join(dir, `${base}.v${n}${ext}`);
    n += 1;
  } while (fs.existsSync(target));

  fs.writeFileSync(target, body);
  fs.readFileSync(target); // verify before returning
  return target;
}

module.exports = { archive, historyDir };
