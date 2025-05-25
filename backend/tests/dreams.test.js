import { createHandlers } from "../src/api/dreams/route"; // Import handler factory
import { Request } from "node-fetch"; // Polyfill Fetch API
import { Dream } from "../src/types/dream";

// Define the Dream type
type Dream = {
    id: string;
    title: string;
    content: string;
    tags: string[];
    date: string;
};

// Mock in-memory storage for dreams
let dreams: Dream[] = [];

// Handlers
let handlers: ReturnType<typeof createHandlers>;

beforeEach(() => {
    // Reset the mocked dreams array before each test
    dreams = [
        { id: "1", title: "Dream 1", content: "Content 1", tags: ["Lucid"], date: "2025-01-01" },
        { id: "2", title: "Dream 2", content: "Content 2", tags: ["Nightmare"], date: "2025-01-02" },
    ];

    // Create handlers with the mocked dreams array
    handlers = createHandlers(dreams);
});

describe("API Route: /api/dreams", () => {
    test("GET: Fetch all dreams", async () => {
        const request = new Request("http://localhost/api/dreams");
        const response = await handlers.GET(request);

        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json).toEqual(dreams);
    });

    test("POST: Add a new dream", async () => {
        const newDream = { title: "Dream 3", content: "Content 3", tags: ["Lucid"], date: "2025-01-03" };
        const request = new Request("http://localhost/api/dreams", {
            method: "POST",
            body: JSON.stringify(newDream),
        });

        const response = await handlers.POST(request);

        expect(response.status).toBe(201);

        const json = await response.json();
        expect(json).toMatchObject(newDream);
        expect(dreams).toHaveLength(3); // Ensure the dream was added to the array
    });

    test("POST: Validation error", async () => {
        const invalidDream = { title: "", content: "", tags: [], date: "" };
        const request = new Request("http://localhost/api/dreams", {
            method: "POST",
            body: JSON.stringify(invalidDream),
        });

        const response = await handlers.POST(request);

        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json).toEqual({ error: "Title is required and must be a non-empty string" });
    });

    test("PATCH: Update an existing dream", async () => {
        const updatedDream = { title: "Updated Dream 1", content: "Updated Content 1", tags: ["Lucid"] };
        const request = new Request("http://localhost/api/dreams?id=1", {
            method: "PATCH",
            body: JSON.stringify(updatedDream),
        });

        const response = await handlers.PATCH(request);

        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json).toMatchObject(updatedDream);
        expect(dreams[0].title).toBe("Updated Dream 1"); // Ensure the dream was updated in the array
    });

    test("PATCH: Return 404 for non-existent dream", async () => {
        const updatedDream = { title: "Non-existent Dream", content: "Content", tags: ["Lucid"] };
        const request = new Request("http://localhost/api/dreams?id=999", {
            method: "PATCH",
            body: JSON.stringify(updatedDream),
        });

        const response = await handlers.PATCH(request);

        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json).toEqual({ error: "Dream not found" });
    });

    test("DELETE: Remove an existing dream", async () => {
        const request = new Request("http://localhost/api/dreams?id=1", {
            method: "DELETE",
        });

        const response = await handlers.DELETE(request);

        expect(response.status).toBe(204);
        expect(dreams).toHaveLength(1); // Ensure the dream was removed from the array
        expect(dreams[0].id).toBe("2");
    });

    test("DELETE: Return 404 for non-existent dream", async () => {
        const request = new Request("http://localhost/api/dreams?id=999", {
            method: "DELETE",
        });

        const response = await handlers.DELETE(request);

        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json).toEqual({ error: "Dream not found" });
    });

    test("OPTIONS: CORS preflight", async () => {
        const response = await handlers.OPTIONS();

        expect(response.status).toBe(204);
        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
        expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PATCH, DELETE, OPTIONS");
        expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    });
});