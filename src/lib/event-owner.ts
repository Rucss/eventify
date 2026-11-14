const EVENT_OWNER_KEY = "eventify.event-owner-key";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateEventOwnerKey(): string {
  const existingKey = window.localStorage.getItem(EVENT_OWNER_KEY);
  if (existingKey && UUID_PATTERN.test(existingKey)) return existingKey;

  const ownerKey = window.crypto.randomUUID();
  window.localStorage.setItem(EVENT_OWNER_KEY, ownerKey);
  return ownerKey;
}
