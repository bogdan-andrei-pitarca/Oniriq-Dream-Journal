"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./add.css";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { addDreamToDB, addOperationToDB, getOperationsFromDB, clearOperationsFromDB } from "../utils/dreamIDB";
import { FileUpload } from "../components/FileUpload";
import { createDream } from "../utils/dreamAPI";
import { Dream } from "../types/dreamType";

export default function AddDream() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [lucid, setLucid] = useState(false);
    const [nightmare, setNightmare] = useState(false);
    const { isOnline, isServerAvailable } = useNetworkStatus();
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [files, setFiles] = useState<{ filename: string; path: string; type: string }[]>([]);
    const router = useRouter();

    useEffect(() => {
        const syncOperations = async () => {
            if (isOnline && isServerAvailable) {
                const operations = await getOperationsFromDB();
                for (const operation of operations) {
                    try {
                        if (operation.type === "add" && operation.dream) {
                            const { ...dreamData } = operation.dream;
                            await createDream(dreamData);
                        }
                    } catch (error) {
                        console.error("Error syncing operation:", error);
                    }
                }
                await clearOperationsFromDB();
                // alert("All pending operations have been synced with the server.");
            }
        };

        syncOperations();
    }, [isOnline, isServerAvailable]);

    const handleTagClick = (tag: string) => {
        setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    };

    const handleSave = async () => {
        const updatedTags = [...tags];
        if (lucid && !updatedTags.includes("Lucid")) updatedTags.push("Lucid");
        if (nightmare && !updatedTags.includes("Nightmare")) updatedTags.push("Nightmare");

        const dreamData = {
            title,
            content,
            tags: updatedTags,
            date,
        };

        try {
            if (!isOnline || !isServerAvailable) {
                const localDream: Dream = {
                    ...dreamData,
                    id: Date.now().toString(),
                    files,
                };
                
                await addDreamToDB(localDream);
                await addOperationToDB({ type: "add", dream: localDream });

                alert("Dream saved locally. It will sync with the server when back online.");
            } else {
                await createDream(dreamData);
            }

            router.push("/journal");
        } catch (error) {
            console.error("Error saving dream:", error);
            alert("An unexpected error occurred while saving the dream.");
        }
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="add-dream-container">
                <div className="add-dream-box">
                    <div className="left-section">
                        <h1>Enter your dream!</h1>
                        <input
                            type="text"
                            className="dream-input"
                            placeholder="Add title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            data-testid="add-title-input"
                        />
                        <textarea
                            className="dream-textarea"
                            placeholder="Write dream..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            data-testid="add-content-textarea"
                        />
                        <label htmlFor="date-picker" className="date-label">Select Date:</label>
                        <input
                            type="date"
                            id="date-picker"
                            className="date-picker"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            data-testid="add-date-picker"
                        />
                    </div>
                    <Image src="/separator.svg" alt="Separator" width={10} height={300} className="separator-line" />
                    <div className="right-section">
                        <div className="tags-container">
                            <h2>Add tags:</h2>
                            <div className="tags-list">
                                {[
                                    { label: "Location", icon: "/location.png" },
                                    { label: "People", icon: "/people.png" },
                                    { label: "Activities", icon: "/activities.png" },
                                    { label: "Creatures & Animals", icon: "/creatures-animals.png" },
                                ].map((tag) => (
                                    <div
                                        key={tag.label}
                                        className={`tag ${tags.includes(tag.label) ? "selected" : ""}`}
                                        onClick={() => handleTagClick(tag.label)}
                                        data-testid={`add-tag-${tag.label}`}
                                    >
                                        <Image src={tag.icon} alt={tag.label} width={24} height={24} />
                                        <span>{tag.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="checkboxes">
                                <label>
                                    Lucid <input type="checkbox" checked={lucid} onChange={() => setLucid(!lucid)} data-testid="add-lucid-checkbox" />
                                </label>
                                <label>
                                    Nightmare <input type="checkbox" checked={nightmare} onChange={() => setNightmare(!nightmare)} data-testid="add-nightmare-checkbox" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="file-upload-section">
                    <h2>Upload Files</h2>
                    <FileUpload
                        entityId="temp-dream-id"
                        onUploadSuccess={(fileData) => {
                            setFiles((prevFiles) => [
                                ...prevFiles,
                                {
                                    ...fileData,
                                    type: "video/mp4",
                                },
                            ]);
                        }}
                        onUploadError={(error) => {
                            console.error("Upload error:", error);
                            alert("Failed to upload file: " + error);
                        }}
                        maxFileSize={20 * 1024 * 1024 * 1024}
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
                    <button className="cancel" onClick={() => router.push("/journal")} data-testid="add-cancel-button">
                        Cancel
                    </button>
                    <button className="save" onClick={handleSave} data-testid="add-save-button">
                        Save dream!
                    </button>
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