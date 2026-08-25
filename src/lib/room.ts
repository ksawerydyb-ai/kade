const ROOM_PARAM = 'room';

function generateRoomId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function getRoomIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(ROOM_PARAM);
}

export function ensureRoomIdInUrl(roomId: string): string {
  if (typeof window === 'undefined') return roomId;
  const url = new URL(window.location.href);
  url.searchParams.set(ROOM_PARAM, roomId);
  const newPath = `${url.pathname}?${url.searchParams.toString()}`;
  window.history.replaceState({}, '', newPath);
  return newPath;
}

export function createRoomUrl(roomId: string): string {
  if (typeof window === 'undefined') return `?${ROOM_PARAM}=${roomId}`;
  const url = new URL(window.location.href);
  url.searchParams.set(ROOM_PARAM, roomId);
  return url.toString();
}

export function getOrCreateRoomId(): string {
  const existing = getRoomIdFromUrl();
  if (existing) return existing;
  const id = generateRoomId();
  ensureRoomIdInUrl(id);
  return id;
}

export { ROOM_PARAM };
