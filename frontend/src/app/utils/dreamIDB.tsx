import { openDB } from "idb";
import { Dream } from "../types/dreamType"; // Adjust the path if necessary

const DB_NAME = "DreamJournalDB";
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("dreams")) {
                db.createObjectStore("dreams", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("operations")) {
                db.createObjectStore("operations", { autoIncrement: true });
            }
        },
    });
};

export const addDreamToDB = async (dream: Dream) => {
    const db = await initDB();
    await db.put("dreams", dream);
};

export const getDreamsFromDB = async (): Promise<Dream[]> => {
    const db = await initDB();
    return await db.getAll("dreams");
};

export const addOperationToDB = async (operation: { type: string; dream?: Dream; id?: string }) => {
    const db = await initDB();
    await db.add("operations", operation);
};

export const getOperationsFromDB = async (): Promise<{
    type: string; dream?: Dream; id?: string; updatedFields?: any  // Keeping updatedFields as any for now, but better to define a specific type if possible
}[]> => {
    const db = await initDB();
    return await db.getAll("operations");
};

export const clearOperationsFromDB = async () => {
    const db = await initDB();
    await db.clear("operations");
};