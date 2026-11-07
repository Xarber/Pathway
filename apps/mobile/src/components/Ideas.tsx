// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { ideaSchema, ideaExport, type Idea } from '../../../../packages/shared/src/index';
import { storage } from '../lib/storage';
import { mergeIdeas, reviewImport } from '../lib/ideas';
import { useSession } from '../lib/session';
import { Card, Button, Chip, Field, Heading, Label, Row } from './ui';
export default function Ideas() {
  const { act, setNotice } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Idea['category']>('feature');
  const [priority, setPriority] = useState<Idea['priority']>('medium');
  const [status, setStatus] = useState<Idea['status']>('new');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [review, setReview] = useState<ReturnType<typeof reviewImport> | null>(null);
  const [raw, setRaw] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  useEffect(() => {
    void storage
      .get('ideas')
      .then((v) => {
        if (v) setIdeas(ideaExport.parse(JSON.parse(v)).ideas);
        setLoaded(true);
      })
      .catch(() =>
        setNotice(
          'The stored Ideas collection could not be read. It has been preserved; recover a backup before saving changes.',
        ),
      );
  }, []);
  async function save(next: Idea[]) {
    if (!loaded) throw Error('Existing Ideas must load successfully before changes can be saved.');
    await storage.set(
      'ideas',
      JSON.stringify({
        schemaVersion: 1,
        project: 'org.openrecode.pathway',
        exportedAt: new Date().toISOString(),
        ideas: next,
      }),
    );
    setIdeas(next);
  }
  async function exportFile() {
    const content = JSON.stringify(
      {
        schemaVersion: 1,
        project: 'org.openrecode.pathway',
        exportedAt: new Date().toISOString(),
        ideas,
      },
      null,
      2,
    );
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pathway-ideas.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const file = new File(Paths.cache, 'pathway-ideas.json');
      file.write(content);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
    }
  }
  return (
    <View style={{ gap: 20 }}>
      <Heading subtitle="Captured here. Kept on this device until you export.">
        Developer Ideas
      </Heading>
      <Card>
        <Field label="Search ideas" value={search} onChangeText={setSearch} />
        <Row wrap>
          {['all', 'new', 'approved', 'deferred', 'implemented'].map((s) => (
            <Chip key={s} title={s} active={filter === s} onPress={() => setFilter(s)} />
          ))}
        </Row>
        <Row wrap>
          <Button
            title="Export JSON"
            secondary
            disabled={!loaded}
            onPress={() => void act(exportFile)}
          />
          <Button
            title="Import JSON file"
            secondary
            disabled={!loaded}
            onPress={() =>
              void act(async () => {
                const picked = await DocumentPicker.getDocumentAsync({
                  type: 'application/json',
                  copyToCacheDirectory: true,
                });
                if (picked.canceled) return;
                const text =
                  Platform.OS === 'web'
                    ? await picked.assets[0].file!.text()
                    : await new File(picked.assets[0].uri).text();
                setReview(reviewImport(text, ideas));
              })
            }
          />
        </Row>
        <Field label="Or paste exported JSON" value={raw} onChangeText={setRaw} multiline />
        <Button
          title="Review pasted import"
          secondary
          onPress={() => void act(async () => setReview(reviewImport(raw, ideas)))}
        />
        {review && (
          <>
            <Label>
              {review.added.length} new · {review.conflicts.length} conflicts. Existing ideas are
              preserved by default.
            </Label>
            <Row wrap>
              <Button
                title="Import new ideas only"
                onPress={() =>
                  void act(async () => {
                    await save(mergeIdeas(ideas, review.incoming));
                    setReview(null);
                  })
                }
              />
              <Button
                title="Replace conflicting ideas"
                danger
                onPress={() =>
                  void act(async () => {
                    await save(mergeIdeas(ideas, review.incoming, true));
                    setReview(null);
                  })
                }
              />
              <Button title="Cancel import" secondary onPress={() => setReview(null)} />
            </Row>
            {review.conflicts.map((i) => (
              <Label key={i.id} muted>
                Conflict: {i.title}
              </Label>
            ))}
          </>
        )}
      </Card>
      <Card>
        <Label bold size={19}>
          {editing ? 'Edit idea' : 'Capture an idea'}
        </Label>
        <Field label="Idea title" value={title} onChangeText={setTitle} />
        <Field
          label="Description and reproduction steps"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Row wrap>
          {['feature', 'improvement', 'bug', 'ui', 'performance', 'other'].map((c) => (
            <Chip
              key={c}
              title={c}
              active={category === c}
              onPress={() => setCategory(c as Idea['category'])}
            />
          ))}
        </Row>
        <Row wrap>
          {['low', 'medium', 'high'].map((p) => (
            <Chip
              key={p}
              title={p}
              active={priority === p}
              onPress={() => setPriority(p as Idea['priority'])}
            />
          ))}
        </Row>
        <Row wrap>
          {[
            'new',
            'considering',
            'approved',
            'in_progress',
            'implemented',
            'deferred',
            'rejected',
          ].map((s) => (
            <Chip
              key={s}
              title={s.replaceAll('_', ' ')}
              active={status === s}
              onPress={() => setStatus(s as Idea['status'])}
            />
          ))}
        </Row>
        <Button
          title={editing ? 'Save changes' : 'Save idea'}
          disabled={!loaded || !title.trim()}
          onPress={() =>
            void act(async () => {
              const previous = ideas.find((i) => i.id === editing);
              const idea = ideaSchema.parse({
                ...previous,
                id: editing || Crypto.randomUUID(),
                title,
                description,
                category,
                priority,
                status,
                createdAt: previous?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              await save([...ideas.filter((i) => i.id !== idea.id), idea]);
              setTitle('');
              setDescription('');
              setEditing(null);
            })
          }
        />
      </Card>
      {ideas
        .filter(
          (i) =>
            (filter === 'all' || i.status === filter) &&
            (i.title + ' ' + i.description).toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((i) => (
          <Card key={i.id}>
            <Label bold size={19}>
              {i.title}
            </Label>
            <Label muted>
              {i.category} · {i.priority} · {i.status.replaceAll('_', ' ')}
            </Label>
            <Label>{i.description}</Label>
            <Label muted size={12}>
              Updated {new Date(i.updatedAt).toLocaleString()}
            </Label>
            <Row wrap>
              <Button
                title="Edit"
                secondary
                compact
                onPress={() => {
                  setEditing(i.id);
                  setTitle(i.title);
                  setDescription(i.description);
                  setCategory(i.category);
                  setPriority(i.priority);
                  setStatus(i.status);
                }}
              />
              <Button
                title="Duplicate"
                secondary
                compact
                onPress={() =>
                  void act(() =>
                    save([
                      ...ideas,
                      {
                        ...i,
                        id: Crypto.randomUUID(),
                        title: i.title + ' (copy)',
                        status: 'new',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                    ]),
                  )
                }
              />
              <Button title="Delete" danger compact onPress={() => setDeleteId(i.id)} />
            </Row>
            {deleteId === i.id && (
              <>
                <Label>Delete this idea permanently from this device?</Label>
                <Row>
                  <Button
                    title="Confirm delete"
                    danger
                    onPress={() =>
                      void act(async () => {
                        await save(ideas.filter((v) => v.id !== i.id));
                        setDeleteId(null);
                      })
                    }
                  />
                  <Button title="Keep idea" secondary onPress={() => setDeleteId(null)} />
                </Row>
              </>
            )}
          </Card>
        ))}
    </View>
  );
}
