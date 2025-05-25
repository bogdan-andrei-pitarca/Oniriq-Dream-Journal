"use client";
import { useDreamContext } from "../context/DreamContext";
import { Dream } from "../types/dreamType";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import "./journal.css";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useWebSocket } from "../hooks/useWebSocket";
import { getDreamsFromDB, addOperationToDB, addDreamToDB, getOperationsFromDB, clearOperationsFromDB } from "../utils/dreamIDB"; // Import IndexedDB utilities
import { FileUpload } from '../components/FileUpload';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchDreams, deleteDream } from "../utils/dreamAPI";

interface DreamWithWordCount extends Dream {
    wordCount: number;
}

export default function Journal() {
    const { dreams, setDreams } = useDreamContext();
    const router = useRouter();

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filterTag, setFilterTag] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterLucid, setFilterLucid] = useState(false);
    const [filterNightmare, setFilterNightmare] = useState(false);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "dateAsc" | "dateDesc" | "">("");
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);  // New state for tracking fetch status
    const { isOnline, isServerAvailable } = useNetworkStatus();
    const observer = useRef<IntersectionObserver | null>(null);
    const lastDreamElementRef = useCallback((node: HTMLElement | null) => {
        if (isLoading || isFetching) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setCurrentPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, isFetching, hasMore]);

    // WebSocket message handler
    const handleWebSocketMessage = useCallback((message: { type: string; data: any }) => {
        switch (message.type) {
            case 'initial':
                setDreams(message.data);
                break;
            case 'newDream':
                setDreams(prev => [...prev, message.data]);
                break;
            case 'updatedDream':
                setDreams(prev => prev.map(dream => 
                    dream.id === message.data.id ? message.data : dream
                ));
                break;
            case 'deletedDream':
                setDreams(prev => prev.filter(dream => dream.id !== message.data.id));
                break;
        }
    }, [setDreams]);

    // Initialize WebSocket connection
    const { isConnected } = useWebSocket(handleWebSocketMessage);

    // Fetch dreams function
    const fetchDreamsFromAPI = useCallback(async (page: number) => {
        setIsFetching(true);
        try {
            if (!isOnline || !isServerAvailable) {
                // Offline: Load dreams from IndexedDB
                const localDreams = await getDreamsFromDB();
                setDreams(localDreams);
                setHasMore(false);
            } else {
                // Online: Fetch dreams from the backend
                const params: Record<string, string | number> = {
                    page,
                    limit: 10,
                };
                if (filterTag) params.filterByTag = filterTag;
                if (filterDate) params.date = filterDate;
                if (filterLucid) params.lucid = "true";
                if (filterNightmare) params.nightmare = "true";
                if (sortOrder === "asc") params.sortBy = "title,ASC";
                if (sortOrder === "desc") params.sortBy = "title,DESC";
                if (sortOrder === "dateAsc") params.sortBy = "date,ASC";
                if (sortOrder === "dateDesc") params.sortBy = "date,DESC";

                console.log('Fetching with params:', params); // Debug log

                const data = await fetchDreams(params);
                
                // If it's the first page, replace the dreams array
                // If it's a subsequent page, append to the existing array
                setDreams(prevDreams => 
                    page === 1 ? data.dreams : [...prevDreams, ...data.dreams]
                );
                setHasMore(data.pagination.hasMore);

                // Save fetched dreams to IndexedDB for offline use
                if (page === 1) {  // Only update IndexedDB for first page
                    for (const dream of data.dreams) {
                        await addDreamToDB(dream);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching dreams:", error);
        } finally {
            setIsFetching(false);
        }
    }, [filterTag, filterDate, filterLucid, filterNightmare, sortOrder, isOnline, isServerAvailable, setDreams]);

    // Initial fetch and filter/sort changes
    useEffect(() => {
        // Reset pagination when filters change
        setCurrentPage(1);
        setHasMore(true);
        setDreams([]); // Clear existing dreams
        fetchDreamsFromAPI(1);
    }, [filterTag, filterDate, filterLucid, filterNightmare, sortOrder, fetchDreamsFromAPI]);

    // Handle pagination
    useEffect(() => {
        if (currentPage > 1 && !isFetching) {
            fetchDreamsFromAPI(currentPage);
        }
    }, [currentPage, fetchDreamsFromAPI, isFetching]);

    useEffect(() => {
        const syncOperations = async () => {
            if (isOnline && isServerAvailable) {
                try {
                    const operations = await getOperationsFromDB();
                    if (operations.length > 0) {
                        for (const operation of operations) {
                            try {
                                if (operation.type === "delete") {
                                    await fetch(`http://localhost:5000/api/dreams?id=${operation.id}`, {
                                        method: "DELETE",
                                    });
                                }
                            } catch (error) {
                                console.error("Error syncing operation:", error);
                            }
                        }
                        await clearOperationsFromDB();
                        alert("All pending operations have been synced with the server.");
                    }
                    
                    // Always fetch dreams after checking operations
                    setCurrentPage(1);
                    await fetchDreamsFromAPI(1);
                } catch (error) {
                    console.error("Error during sync process:", error);
                    // If sync fails, load from IndexedDB
                    const localDreams = await getDreamsFromDB();
                    setDreams(localDreams);
                }
            } else {
                // Load from IndexedDB when offline
                const localDreams = await getDreamsFromDB();
                setDreams(localDreams);
            }
        };

        syncOperations();
    }, [isOnline, isServerAvailable, fetchDreamsFromAPI, setDreams]);

    // Separate useEffect for handling WebSocket messages to prevent interference
    useEffect(() => {
        if (isConnected && dreams.length === 0) {
            fetchDreamsFromAPI(1);
        }
    }, [isConnected, dreams.length, fetchDreamsFromAPI]);

    const handleDeleteDream = async (id: string) => {
        try {
            if (!isOnline || !isServerAvailable) {
                // Queue the delete operation when offline
                await addOperationToDB({ type: "delete", id });

                // Remove the dream from local storage
                const localDreams = await getDreamsFromDB();
                const updatedDreams = localDreams.filter((dream) => dream.id !== id);
                setDreams(updatedDreams);

                alert("Dream deleted locally. It will sync with the server when back online.");
            } else {
                await deleteDream(id);
                // Refresh the dreams list from the first page
                setCurrentPage(1);
                fetchDreamsFromAPI(1);
            }
        } catch (error) {
            console.error("Error deleting dream:", error);
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

    const calculateWordCount = (content: string) => {
        return content.trim().split(/\s+/).length;
    };

    const dreamsWithWordCount: DreamWithWordCount[] = (dreams || []).map((dream) => ({
        ...dream,
        wordCount: calculateWordCount(dream.content),
    }));

    const sortedDreams = [...dreamsWithWordCount].sort((a, b) => b.wordCount - a.wordCount);

    const top33 = sortedDreams.slice(0, Math.ceil(sortedDreams.length / 3));
    const middle33 = sortedDreams.slice(
        Math.ceil(sortedDreams.length / 3),
        Math.ceil((2 * sortedDreams.length) / 3)
    );
    const bottom33 = sortedDreams.slice(Math.ceil((2 * sortedDreams.length) / 3));

    const getCategory = (dream: { id: string }) => {
        if (top33.some((d) => d.id === dream.id)) return "top";
        if (middle33.some((d) => d.id === dream.id)) return "middle";
        return "bottom";
    };

    // Prepare chart data
    const prepareChartData = useCallback(() => {
        if (!dreams) return {
            wordCountData: [],
            tagData: []
        };

        // Sort dreams by date
        const sortedDreams = [...dreams].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Create data for word count over time
        const wordCountData = sortedDreams.map((dream, index) => ({
            date: dream.date,
            wordCount: calculateWordCount(dream.content),
            index: index + 1 // For x-axis labeling
        }));

        // Create data for tag frequency
        const tagCounts: { [key: string]: number } = {};
        dreams.forEach(dream => {
            dream.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const tagData = Object.entries(tagCounts).map(([tag, count]) => ({
            tag,
            count
        }));

        return {
            wordCountData,
            tagData
        };
    }, [dreams]);

    const chartData = prepareChartData();

    return (
        <div className="journal-container">
            <h1 className="journal-title">Journal</h1>
            <div className="filter-container">
                <Image
                    src="/filterpng.png"
                    alt="Filter"
                    width={24}
                    height={24}
                    className="filter-icon"
                    onClick={() => setIsFilterModalOpen(true)}
                />
                <h2 className="filter-text">Filter by...</h2>
            </div>
            {isFilterModalOpen && (
                <div className="filter-modal">
                    <div className="modal-content">
                        <h2>Filter Dreams</h2>
                        <div className="filter-options">
                            <label>
                                Tag:
                                <select
                                    value={filterTag}
                                    onChange={(e) => {
                                        setFilterTag(e.target.value);
                                        setCurrentPage(1);
                                        setHasMore(true);
                                    }}
                                >
                                    <option value="">All</option>
                                    <option value="Location">Location</option>
                                    <option value="People">People</option>
                                    <option value="Creatures & Animals">
                                        Creatures & Animals
                                    </option>
                                    <option value="Activities">Activities</option>
                                    <option value="Lucid">Lucid</option>
                                    <option value="Nightmare">Nightmare</option>
                                </select>
                            </label>
                            <label>
                                Date:
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => {
                                        setFilterDate(e.target.value);
                                        setCurrentPage(1);
                                        setHasMore(true);
                                    }}
                                />
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={filterLucid}
                                    onChange={(e) => {
                                        setFilterLucid(e.target.checked);
                                        setCurrentPage(1);
                                        setHasMore(true);
                                    }}
                                />
                                Lucid
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={filterNightmare}
                                    onChange={(e) => {
                                        setFilterNightmare(e.target.checked);
                                        setCurrentPage(1);
                                        setHasMore(true);
                                    }}
                                />
                                Nightmare
                            </label>
                            <label>
                                Sort by:
                                <select
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value as any);
                                        setCurrentPage(1);
                                        setHasMore(true);
                                    }}
                                >
                                    <option value="">None</option>
                                    <option value="asc">Title (A-Z)</option>
                                    <option value="desc">Title (Z-A)</option>
                                    <option value="dateAsc">Date (Oldest)</option>
                                    <option value="dateDesc">Date (Newest)</option>
                                </select>
                            </label>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={() => setIsFilterModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="main-content">
            <ul className="dream-list">
                    {(dreams || []).map((dream, index) => {
        const category = getCategory(dream);
                        const isLastDream = index === dreams.length - 1;
        return (
            <li
                                key={`${dream.id}-${index}`}
                                ref={isLastDream ? lastDreamElementRef : null}
                className={`dream-item ${category}`}
                data-testid={`dream-item-${dream.id}`}
            >
                <div className="dream-header">
                    <span className="dream-date" data-testid={`dream-date-${dream.id}`}>
                        {dream.date}
                    </span>
                </div>
                <h2 data-testid={`dream-title-${dream.id}`}>{dream.title}</h2>
                <p data-testid={`dream-content-${dream.id}`}>{dream.content}</p>
                                {dream.files && dream.files.length > 0 && (
                                    <div className="dream-files">
                                        {dream.files.map((file, index) => (
                                            <div key={index} className="dream-file">
                                                <div className="file-name">{file.filename}</div>
                                                {file.type.startsWith("video/") ? (
                                                    <div className="video-container">
                                                        <video
                                                            controls
                                                            playsInline
                                                            preload="metadata"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLVideoElement;
                                                                console.error('Video playback error:', {
                                                                    code: target.error?.code,
                                                                    message: target.error?.message
                                                                });
                                                            }}
                                                        >
                                                            <source 
                                                                src={`http://localhost:5000/api/dreams/download/${encodeURIComponent(file.filename)}`}
                                                                type={file.type}
                                                            />
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    </div>
                                                ) : (
                                                    <div>Unsupported file type: {file.type}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                <p className="word-count" data-testid={`dream-word-count-${dream.id}`}>
                    Word Count: {dream.wordCount}
                </p>
                <div className="dream-tags">
                    {dream.tags.map((tag, tagIndex) => (
                        <div key={tagIndex} className="tag" data-testid={`dream-tag-${dream.id}-${tag}`}>
                            <Image
                                src={getTagIcon(tag)}
                                alt={tag}
                                width={24}
                                height={24}
                                className="tag-icon"
                            />
                            <span>{tag}</span>
                        </div>
                    ))}
                </div>
                <button
                    className="dream-action edit"
                    onClick={() => router.push(`/edit?id=${dream.id}`)}
                    data-testid={`edit-button-${dream.id}`}
                >
                    Edit
                </button>
                <button
                    className="dream-action delete"
                    onClick={() => handleDeleteDream(dream.id)}
                    data-testid={`delete-button-${dream.id}`}
                >
                    Delete
                </button>
            </li>
        );
    })}
</ul>
                <Image
                    src="/semimoon.svg"
                    alt="Moon"
                    width={300}
                    height={500}
                    className="moon-icon"
                />
            </div>
            {isLoading && <div className="loading-indicator">Loading more dreams...</div>}
            <button
                className="add-dream-button"
                onClick={() => router.push("/add")}
                data-testid="add-dream-button"
            >
                Add Dream
            </button>
            <button
                className="generate-dreams-button"
                onClick={async () => {
                    try {
                        const response = await fetch("http://localhost:5000/api/dreams/generate-random-dreams", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ count: 20 }) // Generate 20 random dreams
                        });
                        if (!response.ok) {
                            throw new Error("Failed to generate random dreams");
                        }
                        const data = await response.json();
                        console.log(data.message);
                        setCurrentPage(1); // Reset pagination to fetch the new dreams
                        setHasMore(true);
                    } catch (error) {
                        console.error("Error generating random dreams:", error);
                    }
                }}
                data-testid="generate-dreams-button"
            >
                Generate Random Dreams
            </button>
            <button
                className="toggle-generation-button"
                onClick={async () => {
                    try {
                        const statusResponse = await fetch("http://localhost:5000/api/dreams/generation/status");
                        const { isGenerating } = await statusResponse.json();
                        
                        const endpoint = isGenerating ? 'stop' : 'start';
                        const response = await fetch(`http://localhost:5000/api/dreams/generation/${endpoint}`, {
                            method: "POST",
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Failed to ${endpoint} dream generation`);
                        }
                        
                        const data = await response.json();
                        console.log(data.message);
                    } catch (error) {
                        console.error("Error toggling dream generation:", error);
                    }
                }}
                data-testid="toggle-generation-button"
            >
                Toggle Auto Generation
            </button>
           <div className="status-indicator">
            {!isOnline && <p>⚠️ You are offline.</p>}
            {isOnline && !isServerAvailable && <p>⚠️ Server is unavailable.</p>}
                {isOnline && isServerAvailable && !isConnected && <p>⚠️ WebSocket disconnected. Attempting to reconnect...</p>}
                {isOnline && isServerAvailable && isConnected && <p>✅ You are online and connected to the server.</p>}
            </div>
             {/* Add Analytics Section */}
             <div className="analytics-section">
                <h2>Dream Analytics</h2>
                <div className="chart-container">
                    <h3>Word Count Over Time</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart 
                            data={chartData.wordCountData} 
                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#6a4c93" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fill: '#f5f5f5' }} 
                                stroke="#f5f5f5"
                            />
                            <YAxis 
                                tick={{ fill: '#f5f5f5' }} 
                                stroke="#f5f5f5"
                                label={{ 
                                    value: 'Word Count', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    fill: '#f5f5f5'
                                }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#2a1934',
                                    border: '1px solid #6a4c93',
                                    color: '#f5f5f5'
                                }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="wordCount" 
                                stroke="#ae0bcb" 
                                strokeWidth={2} 
                                dot={{ fill: '#ae0bcb', r: 4 }}
                                activeDot={{ r: 6, fill: '#f5f5f5' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    <h3>Tag Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart 
                            data={chartData.tagData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#6a4c93" />
                            <XAxis 
                                dataKey="tag" 
                                tick={{ fill: '#f5f5f5' }} 
                                stroke="#f5f5f5"
                            />
                            <YAxis 
                                tick={{ fill: '#f5f5f5' }} 
                                stroke="#f5f5f5"
                                label={{ 
                                    value: 'Number of Dreams', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    fill: '#f5f5f5'
                                }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#2a1934',
                                    border: '1px solid #6a4c93',
                                    color: '#f5f5f5'
                                }}
                            />
                            <Bar 
                                dataKey="count" 
                                fill="#ae0bcb"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}