import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const workspacePath = fileURLToPath(new URL('../src/components/ModuleWorkspace.jsx', import.meta.url))
const cssPath = fileURLToPath(new URL('../src/App.css', import.meta.url))

test('module Planning uses the reading-first card layout instead of the generic three-column squeeze', async () => {
  const [workspace, css] = await Promise.all([
    fs.readFile(workspacePath, 'utf8'),
    fs.readFile(cssPath, 'utf8'),
  ])

  assert.match(workspace, /className="focus-list module-planning-card-list"/)
  assert.match(css, /\.module-planning-card-list \.work-card:not\(\.compact\)/)
  assert.match(css, /"main progress"\s+"controls controls"/)
  assert.match(css, /\.module-planning-card-list \.work-card-controls/)
  assert.match(css, /border-top: 1px solid var\(--line\)/)
})
