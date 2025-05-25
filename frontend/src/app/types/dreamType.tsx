export interface Dream {
    id: string; // Unique identifier for the dream
    title: string; // Title of the dream
    content: string; // Content or description of the dream
    tags: string[]; // Tags associated with the dream
    date: string; // Date of the dream in YYYY-MM-DD format
    files?: { filename: string; path: string; type: string }[]; // Associated files
    wordCount?: number;
}
// Represents the fields that can be updated in a dream
export type UpdatedFields = Partial<Pick<Dream, "title" | "content" | "tags" | "files">>;

// Represents a queued operation for offline persistence
export interface Operation {
    type: "add" | "edit" | "delete"; // Type of operation
    id?: string; // ID of the dream (required for "edit" and "delete")
    dream?: Dream; // Full dream object (required for "add")
    updatedFields?: UpdatedFields; // Updated fields (required for "edit")
}