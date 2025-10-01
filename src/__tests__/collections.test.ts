import { describe, it, expect } from 'vitest';
import { createState, createFolder, addToFolder, tagItem, untagItem, favoriteItem, unfavoriteItem, bulkDelete } from '@/lib/storage/collections';

describe('Collections: folders, tags, favorites, bulk ops', () => {
  it('creates folders and adds items', () => {
    const s = createState();
    createFolder(s, 'f1', 'Beats');
    addToFolder(s, 'f1', 'i1');
    addToFolder(s, 'f1', 'i2');
    expect(s.folders['f1'].itemIds).toEqual(['i1','i2']);
  });

  it('tags and untags items', () => {
    const s = createState();
    tagItem(s, 'i1', 't1');
    tagItem(s, 'i1', 't2');
    untagItem(s, 'i1', 't1');
    expect(s.itemTags['i1']).toEqual(['t2']);
  });

  it('favorites and unfavorites', () => {
    const s = createState();
    favoriteItem(s, 'i1');
    expect(s.favorites.has('i1')).toBe(true);
    unfavoriteItem(s, 'i1');
    expect(s.favorites.has('i1')).toBe(false);
  });

  it('bulkDelete removes from folders/tags/favorites', () => {
    const s = createState();
    createFolder(s, 'f1', 'X');
    addToFolder(s, 'f1', 'i1');
    tagItem(s, 'i1', 't1');
    favoriteItem(s, 'i1');
    bulkDelete(s, ['i1']);
    expect(s.folders['f1'].itemIds).toEqual([]);
    expect(s.itemTags['i1']).toBeUndefined();
    expect(s.favorites.has('i1')).toBe(false);
  });
});
