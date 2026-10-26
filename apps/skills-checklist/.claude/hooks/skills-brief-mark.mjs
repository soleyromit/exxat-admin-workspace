#!/usr/bin/env node
// PostToolUse(Read): record that the design brief was read, so skills-brief-gate.mjs lets app code edits through.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
let fp = ''; try { fp = JSON.parse(fs.readFileSync(0, 'utf8')).tool_input?.file_path || ''; } catch {}
if (fp.endsWith(path.join('docs', 'knowledge', '00-design-brief.md'))) {
  try { fs.writeFileSync(path.join(os.tmpdir(), 'skills-checklist-brief-read.stamp'), String(Date.now())); } catch {}
}
process.exit(0);
