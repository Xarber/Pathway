// SPDX-License-Identifier: AGPL-3.0-only
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/infra', { recursive: true });
await copyFile('infra/schema.sql', 'dist/infra/schema.sql');
