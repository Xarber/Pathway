// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const status = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
if (status)
  throw Error('Commit the intended changes before creating an exact-source staging package.');
const html = await readFile('apps/mobile/dist/index.html', 'utf8');
if (!html.includes(commit))
  throw Error(
    'Web export does not identify the current commit. Export with EXPO_PUBLIC_BUILD_COMMIT set to git rev-parse HEAD.',
  );
const destination = 'artifacts/xcenter';
await mkdir(destination, { recursive: true });
const archive = `${destination}/Pathway-${commit}.tar.gz`;
// This writes only tracked source. Environment files, private Ideas and local databases stay out.
execFileSync('git', ['archive', '--format=tar.gz', '--output=' + archive, commit]);
const checksum = createHash('sha256')
  .update(await readFile(archive))
  .digest('hex');
await writeFile(
  destination + '/staging-manifest.json',
  JSON.stringify(
    {
      application: 'Pathway',
      version: JSON.parse(await readFile('package.json', 'utf8')).version,
      commit,
      sourceArchive: archive.split('/').at(-1),
      sha256: checksum,
      web: 'apps/mobile/dist',
      target: 'X-Center private staging',
      activated: false,
    },
    null,
    2,
  ),
);
await writeFile(destination + '/SHA256SUMS', `${checksum}  ${archive.split('/').at(-1)}\n`);
console.log('Prepared X-Center source package and checksum for commit', commit);
