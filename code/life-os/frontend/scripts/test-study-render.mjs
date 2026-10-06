import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const tempBase = path.resolve(tmpdir())
const temporary = await mkdtemp(path.join(tempBase, 'lifeos-study-render-'))
try {
  const output = path.join(temporary, 'study-render.test.cjs')
  await build({ entryPoints: [fileURLToPath(new URL('../test/study-render.test.jsx', import.meta.url))], outfile: output, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'error' })
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--test', output], { windowsHide: true, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => resolve(code ?? 1))
  })
} finally {
  if (!path.resolve(temporary).startsWith(`${tempBase}${path.sep}`) || !path.basename(temporary).startsWith('lifeos-study-render-')) throw new Error('Unsafe temporary cleanup path')
  await rm(temporary, { recursive: true, force: true })
}
