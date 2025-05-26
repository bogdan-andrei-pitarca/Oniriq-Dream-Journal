"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "./edit.css";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { getDreamsFromDB, addDreamToDB, addOperationToDB, getOperationsFromDB, clearOperationsFromDB } from "../utils/dreamIDB"; // Import IndexedDB utilities
import { Dream, UpdatedFields, Operation } from "../types/dreamType"; // Import types
import { FileUpload } from "../components/FileUpload";
import { fetchDreams, updateDream } from "../utils/dreamAPI"; // Add dreamAPI import

export default function EditDream() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dreamId = searchParams?.get("id");

    const [isClient, setIsClient] = useState(false); // Track if the component is running on the client
    const [loading, setLoading] = useState(true); // Track loading state
    const [title, setTitle] = useState(""); // Default to an empty string
    const [content, setContent] = useState(""); // Default to an empty string
    const [tags, setTags] = useState<string[]>([]); // Default to an empty array
    const [availableTags] = useState<string[]>([
        "Location",
        "People",
        "Creatures & Animals",
        "Activities",
        "Lucid",
        "Nightmare",
    ]);
    const [isLucid, setIsLucid] = useState(false);
    const [isNightmare, setIsNightmare] = useState(false);
    const { isOnline, isServerAvailable } = useNetworkStatus();
    const [files, setFiles] = useState<{ filename: string; path: string; type: string }[]>([]);

    // Ensure the component only renders on the client
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const fetchDream = async () => {
            try {
                if (!dreamId) {
                    throw new Error("Dream ID is required");
                }

                if (!isOnline || !isServerAvailable) {
                    // Load the dream from local storage when offline
                    const localDreams = await getDreamsFromDB();
                    let dream = localDreams.find((d) => d.id === dreamId);

                    if (!dream) {
                        // If the dream is not found in IndexedDB, initialize it with default values
                        dream = {
                            id: dreamId,
                            title: "",
                            content: "",
                            tags: [],
                            date: new Date().toISOString().split("T")[0],
                        };

                        // Save the initialized dream to IndexedDB
                        await addDreamToDB(dream);
                        console.log("Initialized and saved new dream to IndexedDB:", dream);
                    }

                    // Set the state with the loaded or initialized dream
                    setTitle(dream.title || "");
                    setContent(dream.content || "");
                    setTags(dream.tags || []);
                    setIsLucid(dream.tags?.includes("Lucid") || false);
                    setIsNightmare(dream.tags?.includes("Nightmare") || false);
                    setFiles(dream.files || []);
                } else {
                    // Use dreamAPI to fetch the dream
                    const data = await fetchDreams({ id: dreamId as string });
                    const dreams = data.dreams;
                    if (!Array.isArray(dreams)) {
                        throw new Error("Invalid response format: dreams is not an array.");
                    }

                    const dream = dreams.find((d) => d.id === dreamId);
                    if (!dream) {
                        throw new Error("Dream not found on the server.");
                    }

                    // Set the state with the fetched dream
                    setTitle(dream.title || "");
                    setContent(dream.content || "");
                    setTags(dream.tags || []);
                    setIsLucid(dream.tags?.includes("Lucid") || false);
                    setIsNightmare(dream.tags?.includes("Nightmare") || false);
                    setFiles(dream.files || []);
                }
            } catch (error) {
                console.error("Error fetching dream:", error);
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };

        if (dreamId) {
            fetchDream();
        }
    }, [dreamId, isOnline, isServerAvailable]);

    useEffect(() => {
        const syncOperations = async () => {
            if (isOnline && isServerAvailable) {
                const operations = await getOperationsFromDB();
                for (const operation of operations) {
                    try {
                        if (operation.type === "edit" && operation.id && operation.updatedFields) {
                            await updateDream(operation.id, {
                                title: operation.updatedFields.title ?? "",
                                content: operation.updatedFields.content ?? "",
                                date: new Date().toISOString(),
                                tags: operation.updatedFields.tags ?? [],
                            });
                        }
                    } catch (error) {
                        console.error("Error syncing operation:", error);
                    }
                }
                await clearOperationsFromDB();
                alert("All pending operations have been synced with the server.");
            }
        };

        syncOperations();
    }, [isOnline, isServerAvailable]);

    const handleSave = async () => {
        if (!dreamId) {
            alert("Invalid dream ID.");
            return;
        }

        // Ensure the tags array reflects the current state
        const updatedTags = [...tags];
        if (isLucid && !updatedTags.includes("Lucid")) updatedTags.push("Lucid");
        if (!isLucid && updatedTags.includes("Lucid")) {
            const index = updatedTags.indexOf("Lucid");
            updatedTags.splice(index, 1);
        }
        if (isNightmare && !updatedTags.includes("Nightmare")) updatedTags.push("Nightmare");
        if (!isNightmare && updatedTags.includes("Nightmare")) {
            const index = updatedTags.indexOf("Nightmare");
            updatedTags.splice(index, 1);
        }

        const updatedFields: UpdatedFields = {
            ...(title && { title }),
            ...(content && { content }),
            tags: updatedTags, // Always include the updated tags array
            files, // Include the files array in the update
        };

        const updatedDream: Dream = {
            id: dreamId, // Ensure dreamId is a valid string
            title: updatedFields.title || title,
            content: updatedFields.content || content,
            tags: updatedFields.tags || tags,
            date: new Date().toISOString(), // Use the current date
            files, // Include updated files
        };

        try {
            if (!isOnline || !isServerAvailable) {
                // Save the updated dream to local storage
                await addDreamToDB(updatedDream);

                // Queue the "edit" operation for syncing later
                const operation: Operation = {
                    type: "edit",
                    id: dreamId,
                    updatedFields, // Explicitly include updatedFields
                };
                await addOperationToDB(operation);

                alert("Changes saved locally. They will sync with the server when back online.");
            } else {
                // Use dreamAPI to update the dream
                await updateDream(dreamId, {
                    title: updatedFields.title || title,
                    content: updatedFields.content || content,
                    date: new Date().toISOString(),
                    tags: updatedFields.tags || tags,
                });
            }

            // Redirect to the journal page after saving
            router.push("/journal");
        } catch (error) {
            console.error("Error updating dream:", error);
            alert("An unexpected error occurred while saving the dream.");
        }
    };

    const handleCancel = () => {
        router.push("/journal");
    };

    const handleAddTag = (tag: string) => {
        if (!tags.includes(tag)) {
            setTags((prevTags) => [...prevTags, tag]);
        }
    };

    const getTagIcon = (tag: string) => {
        switch (tag) {
            case "Location":
                return "/location.png";
            case "People":
                return "/people.png";
            case "Creatures & Animals":
                return "/creatures-animals.png";
            case "Activities":
                return "/activities.png";
            case "Lucid":
                return "/lucid.png";
            case "Nightmare":
                return "/nightmare.png";
            default:
                return "/default-tag.png";
        }
    };

    if (!isClient || loading) {
        return <div>Loading...</div>; // Show a loading indicator
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="edit-dream-container">
                <div className="edit-dream-box">
                    <div className="left-side">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Edit title..."
                            className="dream-input"
                            data-testid="edit-title-input"
                        />
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Edit content..."
                            className="dream-textarea"
                            data-testid="edit-content-textarea"
                        />
                        <div className="checkbox-section">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isLucid}
                                    onChange={(e) => setIsLucid(e.target.checked)}
                                    data-testid="lucid-checkbox"
                                />
                                Lucid Dream
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isNightmare}
                                    onChange={(e) => setIsNightmare(e.target.checked)}
                                    data-testid="nightmare-checkbox"
                                />
                                Nightmare
                            </label>
                        </div>
                    </div>
                    <div className="right-side">
                        <div className="tag-section">
                            <h3>Tags</h3>
                            <div className="tags-list">
                                {tags.map((tag, index) => (
                                    <div key={index} className="tag" data-testid={`tag-${tag}`}>
                                        <Image
                                            src={getTagIcon(tag)}
                                            alt={tag}
                                            width={24}
                                            height={24}
                                            className="tag-icon"
                                        />
                                        <span>{tag}</span>
                                        <button
                                            className="tag-button"
                                            onClick={() =>
                                                setTags((prevTags) =>
                                                    prevTags.filter((_, i) => i !== index)
                                                )
                                            }
                                            data-testid={`remove-tag-button-${tag}`}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <h4>Add Tags</h4>
                            <div className="tags-list">
                                {availableTags
                                    .filter((tag) => !tags.includes(tag))
                                    .map((tag, index) => (
                                        <div key={index} className="add-tag" data-testid={`available-tag-${tag}`}>
                                            <span>{tag}</span>
                                            <button
                                                className="add-tag-button"
                                                onClick={() => handleAddTag(tag)}
                                                data-testid={`add-tag-button-${tag}`}
                                            >
                                                <Image
                                                    src="/pluscircle.svg"
                                                    alt="Add"
                                                    width={16}
                                                    height={16}
                                                    className="plus-icon"
                                                />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="file-upload-section">
                    <h2>Upload Files</h2>
                    <FileUpload
                        entityId={dreamId || ""} // Provide a fallback value if dreamId is null
                        onUploadSuccess={(fileData) => {
                            setFiles((prevFiles) => [
                                ...prevFiles,
                                {
                                    ...fileData,
                                    type: "video/mp4", // Add the correct MIME type here
                                },
                            ]);
                        }}
                        onUploadError={(error) => {
                            console.error("Upload error:", error);
                            alert("Failed to upload file: " + error);
                        }}
                        maxFileSize={20 * 1024 * 1024 * 1024} // 20GB
                        acceptedFileTypes="video/*"
                    />
                    {files.map((file, index) => (
                        <div key={index}>
                            <p>{file.filename}</p>
                            {file.type.startsWith("video/") && (
                                <video controls width="300">
                                    <source src={file.path} type={file.type} />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </div>
                    ))}
                </div>
                <div className="buttons">
                    <div className="buttons-row">
                        <button className="cancel" onClick={handleCancel} data-testid="cancel-button">
                            Cancel
                        </button>
                        <button className="save" onClick={handleSave} data-testid="save-button">
                            Save
                        </button>
                    </div>
                </div>
                <div className="status-indicator">
                {!isOnline && <p>⚠️ You are offline.</p>}
                {isOnline && !isServerAvailable && <p>⚠️ Server is unavailable.</p>}
                {isOnline && isServerAvailable && <p>✅ You are online and connected to the server.</p>}
                </div>
            </div>
        </Suspense>
    );
}