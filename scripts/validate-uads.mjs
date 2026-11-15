// SPDX-License-Identifier: AGPL-3.0-only
import Ajv from 'ajv';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const manifest = read(process.argv[2] || 'uads.json');
const registry = read('config/uads-requirements.json');
const validate = new Ajv({ allErrors: true }).compile(read('config/uads-schema.json'));
if (!validate(manifest)) throw new Error(JSON.stringify(validate.errors, null, 2));

function verifyFile(path) {
  const local = resolve(root, path);
  if (!local.startsWith(root + sep) || !statSync(local).isFile())
    throw new Error(`Invalid evidence or configuration path: ${path}`);
}
Object.values(manifest.quality).forEach(verifyFile);
const exceptions = new Map();
for (const exception of manifest.exceptions) {
  const { id, approvalDate, reviewDate } = exception;
  const validDate = (date) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().startsWith(date);
  if (
    !Object.hasOwn(registry, id) ||
    exceptions.has(id) ||
    !validDate(approvalDate) ||
    !validDate(reviewDate) ||
    approvalDate > reviewDate ||
    reviewDate < new Date().toISOString().slice(0, 10)
  )
    throw new Error(`Invalid or expired exception: ${id}`);
  exceptions.set(id, exception);
}
const declared = new Set();
for (const { id, applicability, state, evidence, reason } of manifest.requirements) {
  if (declared.has(id) || !Object.hasOwn(registry, id))
    throw new Error(`Duplicate or unknown requirement: ${id}`);
  declared.add(id);
  if (
    (applicability === 'approved-exception') !== exceptions.has(id) ||
    (state === 'waived') !== exceptions.has(id) ||
    (state === 'not-applicable') !== (applicability === 'not-applicable')
  )
    throw new Error(`Inconsistent applicability or exception: ${id}`);
  if ((['conditional', 'not-applicable'].includes(applicability) || state === 'blocked') && !reason)
    throw new Error(`Missing rationale: ${id}`);
  if (state === 'passed' && !evidence.length) throw new Error(`Missing evidence: ${id}`);
  evidence.forEach(verifyFile);
  verifyFile(registry[id].verification);
  registry[id].evidence.forEach(verifyFile);
}
for (const id of Object.keys(registry))
  if (!declared.has(id)) throw new Error(`Missing requirement: ${id}`);
console.log(`UADS structure and evidence paths validated for ${declared.size} requirements.`);
