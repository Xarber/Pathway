// SPDX-License-Identifier: AGPL-3.0-only
import { ideaExport, type Idea } from '../../../../packages/shared/src/index';
export function reviewImport(raw: string, current: Idea[]) {
  const data = ideaExport.parse(JSON.parse(raw));
  const seen = new Set<string>();
  const incoming = data.ideas.filter((i) => {
    if (seen.has(i.id)) throw Error('Duplicate identifiers in import');
    seen.add(i.id);
    return true;
  });
  return {
    incoming,
    added: incoming.filter((i) => !current.some((c) => c.id === i.id)),
    conflicts: incoming.filter((i) =>
      current.some((c) => c.id === i.id && JSON.stringify(c) !== JSON.stringify(i)),
    ),
  };
}
export function mergeIdeas(current: Idea[], incoming: Idea[], replace = false) {
  const map = new Map(current.map((i) => [i.id, i]));
  for (const item of incoming) if (!map.has(item.id) || replace) map.set(item.id, item);
  return [...map.values()];
}
