// Checks files for personal data before anything is published: generic patterns (email addresses,
// phone numbers, keys and tokens, home folders) and the owner's own markers (names, accounts,
// places, course codes) from a private, untracked list. It prints file, line numbers and the kind of
// finding, never what matched, and exits with 1 when anything is found.
//   node scripts/privacy-scan.mjs                  every file git tracks in this repository
//   node scripts/privacy-scan.mjs <folder>         every file in a folder (the public version)
//   --markers <file>   the owner's markers, one per line, # for notes (default .private/markers.txt)
//   --summary          counts per top folder instead of every file
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BINARY = /\.(png|jpe?g|gif|webp|ico|bmp|pdf|woff2?|ttf|otf|eot|mp3|mp4|wav|ogg|m4a|webm|mov|zip|gz|7z|rar|dump|db|sqlite3?|ipynb)$/i
const MAX_BYTES = 2 * 1024 * 1024

// Made-up addresses (example.com, example.ac.uk, …) and the placeholder sender are not personal.
const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}/g
const ALLOWED_EMAIL = /@([a-z0-9-]+\.)*example\.[a-z.]+$|^(no-?reply|noreply)@|@users\.noreply\.github\.com$/i
// Each pattern first checks the one character or word it needs, so long minified lines stay quick;
// an address is read around its @ only.
const around = (line, index) => line.slice(Math.max(0, index - 80), index + 120)
export const PATTERNS = {
  'email address': (line) => {
    for (let at = line.indexOf('@'); at >= 0; at = line.indexOf('@', at + 1)) {
      if ([...around(line, at).matchAll(EMAIL)].some((match) => !ALLOWED_EMAIL.test(match[0]))) return true
    }
    return false
  },
  'phone number': (line) => /\d{3}/.test(line) && /(?:\+44\s?7\d{3}|\b07\d{3})\s?\d{3}\s?\d{3}\b/.test(line),
  'key or token': (line) => /sk-|ghp_|github_pat_|AIza|xox/.test(line) && /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/.test(line),
  // A real home folder starts a path (not /api/home/…); "me", "you" and <placeholders> are made up.
  'home folder': (line) => /Users|home\//i.test(line) && /[A-Za-z]:[\\/]+Users[\\/]+(?!Public\b|Default\b|me\b|you\b|<)[A-Za-z0-9_.-]+|(?<![A-Za-z0-9_.-])\/(?:Users|home)\/(?!me\b|you\b|<)[A-Za-z0-9_.-]+/i.test(line),
}

export function readMarkers(file) {
  let text = ''
  try { text = fs.readFileSync(file, 'utf8') } catch { return [] }
  return text.split(/\r?\n/).map((line) => line.replace(/#.*/, '').trim()).filter(Boolean)
    .map((word) => new RegExp(`(?<![A-Za-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`, 'i'))
}

// Findings in one text: [{ line, kinds }], kinds named, never the matched words.
export function scanText(text, markers = []) {
  const findings = []
  text.split(/\r?\n/).forEach((line, index) => {
    const kinds = Object.entries(PATTERNS).filter(([, test]) => test(line)).map(([kind]) => kind)
    if (markers.some((marker) => marker.test(line))) kinds.push('owner marker')
    if (kinds.length) findings.push({ line: index + 1, kinds })
  })
  return findings
}

function filesOf(folder) {
  if (!folder) return execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).map((file) => ({ file, full: path.join(root, file) }))
  const out = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else out.push({ file: path.relative(folder, full).split(path.sep).join('/'), full })
    }
  }
  walk(folder)
  return out
}

export function scanFiles(folder, markers) {
  const results = []
  for (const { file, full } of filesOf(folder)) {
    if (BINARY.test(file)) continue
    let stat
    try { stat = fs.statSync(full) } catch { continue }
    if (!stat.isFile()) continue
    if (stat.size > MAX_BYTES) { results.push({ file, findings: [{ line: 0, kinds: ['too large to read: check by hand'] }] }); continue }
    const findings = scanText(fs.readFileSync(full, 'utf8'), markers)
    if (findings.length) results.push({ file, findings })
  }
  return results
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const option = (name) => { const at = args.indexOf(name); return at >= 0 ? args[at + 1] : undefined }
  const folder = args.find((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--markers')
  const markerFile = option('--markers') ?? path.join(root, '.private/markers.txt')
  const markers = readMarkers(markerFile)
  if (!markers.length) console.log(`Note: no owner markers read from ${path.relative(root, markerFile) || markerFile}; only generic patterns are checked.`)
  const results = scanFiles(folder ? path.resolve(folder) : null, markers)
  if (args.includes('--summary')) {
    const byFolder = {}
    for (const { file, findings } of results) {
      const top = file.includes('/') ? file.split('/')[0] : '(root)'
      byFolder[top] ??= { files: 0, lines: 0 }
      byFolder[top].files += 1
      byFolder[top].lines += findings.length
    }
    for (const [top, count] of Object.entries(byFolder).sort((a, b) => b[1].files - a[1].files)) console.log(`${top}: ${count.files} files, ${count.lines} lines`)
  } else {
    for (const { file, findings } of results) {
      const kinds = [...new Set(findings.flatMap((finding) => finding.kinds))].join(', ')
      const lines = findings.slice(0, 12).map((finding) => finding.line).join(', ') + (findings.length > 12 ? ', …' : '')
      console.log(`${file}: ${findings.length} (${kinds}) at lines ${lines}`)
    }
  }
  console.log(results.length ? `${results.length} files hold something personal.` : 'Clean: nothing personal found.')
  process.exitCode = results.length ? 1 : 0
}
