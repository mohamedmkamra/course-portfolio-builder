import { PortfolioSnapshot, TemplateDefinition, UploadedFileRecord } from "../types";

const DB_NAME = "course-portfolio-builder";
const DB_VERSION = 1;
const SESSION_KEY = "session";
const TEMPLATE_STORE = "templates";
const DEFAULT_TEMPLATE_KEY = "default-template";

const openDb = async () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSION_KEY)) {
        db.createObjectStore(SESSION_KEY);
      }
      if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
        db.createObjectStore(TEMPLATE_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionPromise = <T,>(
  request: IDBRequest<T>,
) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveSnapshot = async (snapshot: PortfolioSnapshot) => {
  const db = await openDb();
  const transaction = db.transaction(SESSION_KEY, "readwrite");
  transaction.objectStore(SESSION_KEY).put(snapshot, "active");
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadSnapshot = async () => {
  const db = await openDb();
  const transaction = db.transaction(SESSION_KEY, "readonly");
  return transactionPromise(transaction.objectStore(SESSION_KEY).get("active")) as Promise<
    PortfolioSnapshot | undefined
  >;
};

export const saveTemplate = async (template: TemplateDefinition) => {
  const db = await openDb();
  const transaction = db.transaction(TEMPLATE_STORE, "readwrite");
  transaction.objectStore(TEMPLATE_STORE).put(template);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadTemplates = async () => {
  const db = await openDb();
  const transaction = db.transaction(TEMPLATE_STORE, "readonly");
  return transactionPromise(transaction.objectStore(TEMPLATE_STORE).getAll()) as Promise<
    TemplateDefinition[]
  >;
};

export const saveDefaultTemplate = async (template: TemplateDefinition) => {
  const db = await openDb();
  const transaction = db.transaction(SESSION_KEY, "readwrite");
  transaction.objectStore(SESSION_KEY).put(template, DEFAULT_TEMPLATE_KEY);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadDefaultTemplate = async () => {
  const db = await openDb();
  const transaction = db.transaction(SESSION_KEY, "readonly");
  return transactionPromise(transaction.objectStore(SESSION_KEY).get(DEFAULT_TEMPLATE_KEY)) as Promise<
    TemplateDefinition | undefined
  >;
};

export const cloneFileRecordForStorage = (record: UploadedFileRecord): UploadedFileRecord => ({
  ...record,
  previewUrl: undefined,
});
