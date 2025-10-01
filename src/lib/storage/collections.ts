export type Id = string;

export interface ItemRef { id: Id }

export interface Folder { id: Id; name: string; itemIds: Id[] }
export interface Tag { id: Id; name: string }

export interface CollectionsState {
  folders: Record<Id, Folder>;
  itemTags: Record<Id, Id[]>; // itemId -> tagIds
  favorites: Set<Id>;
}

export function createState(): CollectionsState {
  return { folders: {}, itemTags: {}, favorites: new Set() };
}

export function createFolder(state: CollectionsState, id: Id, name: string) {
  state.folders[id] = { id, name, itemIds: [] };
}

export function addToFolder(state: CollectionsState, folderId: Id, itemId: Id) {
  const f = state.folders[folderId];
  if (!f) throw new Error('folder not found');
  if (!f.itemIds.includes(itemId)) f.itemIds.push(itemId);
}

export function tagItem(state: CollectionsState, itemId: Id, tagId: Id) {
  const arr = state.itemTags[itemId] || (state.itemTags[itemId] = []);
  if (!arr.includes(tagId)) arr.push(tagId);
}

export function untagItem(state: CollectionsState, itemId: Id, tagId: Id) {
  const arr = state.itemTags[itemId];
  if (!arr) return;
  state.itemTags[itemId] = arr.filter(t => t !== tagId);
}

export function favoriteItem(state: CollectionsState, itemId: Id) {
  state.favorites.add(itemId);
}

export function unfavoriteItem(state: CollectionsState, itemId: Id) {
  state.favorites.delete(itemId);
}

export function bulkDelete(state: CollectionsState, ids: Id[]) {
  // remove from folders
  for (const f of Object.values(state.folders)) {
    f.itemIds = f.itemIds.filter(id => !ids.includes(id));
  }
  // remove tags linkage
  for (const id of ids) delete state.itemTags[id];
  // remove favorites
  for (const id of ids) state.favorites.delete(id);
}
