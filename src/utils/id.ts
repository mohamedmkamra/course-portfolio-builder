const fallbackId = () =>
  `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export const createId = () => {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return fallbackId();
};
