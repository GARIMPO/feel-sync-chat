const STORAGE_KEY = "public-rooms";

export interface PublicRoom {
  name: string;
  creator: string;
  createdAt: number;
}

function load(): PublicRoom[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function save(data: PublicRoom[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createPublicRoom(name: string, creator: string): boolean {
  const rooms = load();
  if (rooms.some((r) => r.name.toLowerCase() === name.toLowerCase())) return false;
  rooms.push({ name, creator, createdAt: Date.now() });
  save(rooms);
  return true;
}

export function getPublicRooms(): PublicRoom[] {
  return load();
}

export function getPublicRoom(name: string): PublicRoom | undefined {
  return load().find((r) => r.name.toLowerCase() === name.toLowerCase());
}

export function deletePublicRoom(name: string, requester: string): boolean {
  const rooms = load();
  const room = rooms.find((r) => r.name === name);
  if (!room || room.creator !== requester) return false;
  save(rooms.filter((r) => r.name !== name));
  return true;
}
