// Bundles test/tasks-render.test.jsx with esbuild (with the @shared alias the app uses) and runs it with node --test.
import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const tempBase = path.resolve(tmpdir())
const temporary = await mkdtemp(path.join(tempBase, 'lifeos-tasks-render-'))
try {
  const output = path.join(temporary, 'tasks-render.test.cjs')
  await build({
    entryPoints: [fileURLToPath(new URL('../test/tasks-render.test.jsx', import.meta.url))], outfile: output, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'error',
    alias: { '@shared': fileURLToPath(new URL('../../shared', import.meta.url)) },
    define: { 'import.meta.env': '{}' },
  })
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--test', output], { windowsHide: true, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => resolve(code ?? 1))
  })
} finally {
  if (!path.resolve(temporary).startsWith(`${tempBase}${path.sep}`) || !path.basename(temporary).startsWith('lifeos-tasks-render-')) throw new Error('Unsafe temporary cleanup path')
  await rm(temporary, { recursive: true, force: true })
}
