// Sorts every tracked file with something personal (scripts/privacy-scan.mjs) into what stage 7
// does with it, and writes the private inventory documents/briefs/stage-7-inventory.md (paths and
// counts only). Run again after each checkpoint: the "make generic" and "configure" lists should shrink.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readMarkers, scanFiles } from './privacy-scan.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// Private: project memory, agent instructions, research, one-off migrations, personal planning and
// course materials. They stay in this working copy and are never in the public version. The list is
// private too (.private/private-paths.txt, one regular expression per line).
export function readPrivatePaths(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map((line) => new RegExp(line))
}
const PRIVATE = readPrivatePaths(path.join(root, '.private/private-paths.txt'))
const CONFIGURE = new Set(['home folder', 'email address', 'phone number', 'key or token'])
const bucket = (file, kinds) => (PRIVATE.some((rule) => rule.test(file)) ? 'private'
  : kinds.some((kind) => CONFIGURE.has(kind)) ? 'configure' : 'generic')

const results = scanFiles(null, readMarkers(path.join(root, '.private/markers.txt')))
const groups = { private: [], configure: [], generic: [] }
for (const { file, findings } of results) groups[bucket(file, [...new Set(findings.flatMap((finding) => finding.kinds))])].push({ file, lines: findings.length })
const part = (file) => file.split('/').slice(0, file.startsWith('code/') ? 4 : 1).join('/')
const list = (rows) => {
  const byPart = new Map()
  for (const row of rows) { const key = part(row.file); byPart.set(key, [...(byPart.get(key) ?? []), row]) }
  return [...byPart].sort((a, b) => b[1].length - a[1].length).map(([key, items]) => `- **${key}**: ${items.length} files, ${items.reduce((sum, row) => sum + row.lines, 0)} lines${items.length <= 12 ? `: ${items.map((row) => `\`${row.file.replace(`${key}/`, '')}\``).join(', ')}` : ''}`).join('\n')
}
const text = `# Stage 7 inventory: what holds something personal, and what becomes of it

**Private.** Written by \`node scripts/privacy-inventory.mjs\` on ${new Date().toISOString().slice(0, 10)} from \`scripts/privacy-scan.mjs\` (generic patterns plus the owner's markers in \`.private/markers.txt\`). Paths and counts only. ${results.length} tracked files hold something personal.

## Private, never in the public version (${groups.private.length} files)
Project memory and agent instructions, events research, one-off migrations, personal planning and receipts, and the course materials (also someone else's copyright). They stay in this working copy.

${list(groups.private)}

## Configure: a home folder, an address or a key in code (${groups.configure.length} files)
CP2 moves these into configuration with a committed example.

${list(groups.configure)}

## Make generic: names, places and courses in code (${groups.generic.length} files)
CP4: courses and cards become data with an example set; the events page works for any city; tests and examples use made-up places; the Guide and labels are anyone's.

${list(groups.generic)}
`
fs.writeFileSync(path.join(root, 'documents/briefs/stage-7-inventory.md'), text)
console.log(`private ${groups.private.length}, configure ${groups.configure.length}, generic ${groups.generic.length}`)
