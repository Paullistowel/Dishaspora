import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple on-device shopping list for ingredients the user is missing.
const KEY = 'dishaspora.shoppingList';

export interface ShoppingItem {
  name: string;
  note?: string | null;
  checked: boolean;
}

export async function getShoppingList(): Promise<ShoppingItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShoppingItem[]) : [];
  } catch {
    return [];
  }
}

async function save(items: ShoppingItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

/** Adds names that aren't already present (case-insensitive). Returns how many were added. */
export async function addToShoppingList(
  entries: { name: string; note?: string | null }[]
): Promise<number> {
  const items = await getShoppingList();
  const have = new Set(items.map((i) => i.name.toLowerCase()));
  let added = 0;
  for (const e of entries) {
    const name = e.name.trim();
    if (!name || have.has(name.toLowerCase())) continue;
    items.push({ name, note: e.note ?? null, checked: false });
    have.add(name.toLowerCase());
    added++;
  }
  await save(items);
  return added;
}

export async function toggleItem(name: string): Promise<ShoppingItem[]> {
  const items = await getShoppingList();
  const item = items.find((i) => i.name === name);
  if (item) item.checked = !item.checked;
  await save(items);
  return items;
}

export async function removeItem(name: string): Promise<ShoppingItem[]> {
  const items = (await getShoppingList()).filter((i) => i.name !== name);
  await save(items);
  return items;
}

export async function clearChecked(): Promise<ShoppingItem[]> {
  const items = (await getShoppingList()).filter((i) => !i.checked);
  await save(items);
  return items;
}
