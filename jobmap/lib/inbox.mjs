import {readdir, readFile, writeFile, rename, mkdir, appendFile, stat} from 'node:fs/promises';
import path from 'node:path';

// Scheduled searches cannot reach this computer's loopback API, so they leave a
// batch file in data/inbox/ instead. The running service picks it up from there.
const MAX_BYTES = 15 * 1024 * 1024;
const SETTLE_MS = 5000;   // ignore a file still being copied onto the disk
const POLL_MS = 60000;

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

export class Inbox {
 constructor(store, directory, logFile) {
  this.store = store;
  this.directory = directory;
  this.processed = path.join(directory, 'processed');
  this.failed = path.join(directory, 'failed');
  this.logFile = logFile;
  this.running = false;
  this.timer = null;
  this.last = null;
 }

 async init() {
  await mkdir(this.processed, {recursive: true});
  await mkdir(this.failed, {recursive: true});
  return this;
 }

 async pending() {
  const names = await readdir(this.directory, {withFileTypes: true}).catch(() => []);
  const now = Date.now();
  const out = [];
  for (const entry of names) {
   if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json')) continue;
   const file = path.join(this.directory, entry.name);
   const info = await stat(file).catch(() => null);
   if (!info) continue;
   out.push({name: entry.name, file, bytes: info.size, settled: now - info.mtimeMs >= SETTLE_MS});
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
 }

 async note(line) {
  await appendFile(this.logFile, line + '\n', 'utf8').catch(() => {});
 }

 async retire(file, name, directory, suffix = '') {
  const target = path.join(directory, `${stamp()}-${name}${suffix}`);
  await rename(file, target).catch(() => {});
  return target;
 }

 // One batch file. Returns a plain summary; never throws.
 async importFile({name, file, bytes}) {
  const at = new Date().toISOString();
  try {
   if (bytes > MAX_BYTES) throw new Error('Batch file is too large.');
   const batch = JSON.parse((await readFile(file, 'utf8')).replace(/^﻿/, ''));
   let result = null;
   for (let attempt = 0; attempt < 4 && !result; attempt++) {
    try {
     result = await this.store.ingest(batch, this.store.state.revision);
    } catch (error) {
     if (error.status !== 409 || attempt === 3) throw error;
    }
   }
   const counts = `${result.added.length} added, ${result.updated.length} updated, ${result.skipped.length} skipped`;
   await this.retire(file, name, this.processed);
   await this.note(`- ${at} · ${name} · ${result.repeated ? 'already imported, no change' : counts}`);
   return {name, ok: true, repeated: result.repeated, added: result.added.length, updated: result.updated.length, skipped: result.skipped};
  } catch (error) {
   const reason = error.message || 'Import failed.';
   const kept = await this.retire(file, name, this.failed);
   await writeFile(kept + '.error.txt', `${at}\n${reason}\n`, 'utf8').catch(() => {});
   await this.note(`- ${at} · ${name} · NOT imported — ${reason} (kept in inbox/failed/)`);
   return {name, ok: false, error: reason};
  }
 }

 async scan() {
  if (this.running) return {busy: true, results: []};
  this.running = true;
  const results = [];
  try {
   for (const entry of await this.pending()) {
    if (!entry.settled) continue;
    results.push(await this.importFile(entry));
   }
  } finally {
   this.running = false;
  }
  this.last = {at: new Date().toISOString(), results};
  return {busy: false, results};
 }

 async start() {
  await this.init();
  await this.scan();
  this.timer = setInterval(() => {
   this.scan().catch(error => console.error('Inbox: ' + error.message));
  }, POLL_MS);
  return this;
 }

 async status() {
  const waiting = await this.pending();
  return {
   directory: this.directory,
   waiting: waiting.map(w => w.name),
   lastScan: this.last,
   runs: (this.store.state.importRuns || []).slice(-20)
  };
 }
}

export async function createInbox(store, directory, logFile) {
 return new Inbox(store, directory, logFile).start();
}
