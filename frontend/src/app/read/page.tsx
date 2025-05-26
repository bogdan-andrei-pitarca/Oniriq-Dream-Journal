"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "./read.css";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

type Dream = {
    id: string;
    title: string;
    date: string;
    content: string;
    tags: string[];
};

const mockDreams: Dream[] = [
    {
        id: '1',
        title: 'Dream 1',
        date: '10/03/24',
        content: 'This is the full content of Dream 1. It was a very vivid and strange experience...',
        tags: ['Location', 'Lucid'],
    },
    {
        id: '2',
        title: 'Dream 2',
        date: '10/02/24',
        content: 'This is the full content of Dream 2. It felt very real and almost terrifying...',
        tags: ['People', 'Nightmare'],
    },
    {
        id: '3',
        title: 'Dream 3',
        date: '10/01/24',
        content: 'This is the full content of Dream 3. It was an exciting and adventurous dream...',
        tags: ['Activities', 'Creatures & Animals'],
    },
];

// Separate component that uses useSearchParams
function ReadDreamContent() {
    const searchParams = useSearchParams();
    const dreamId = searchParams.get("id");
    const router = useRouter();

    const [dream, setDream] = useState<Dream | null>(null);
    const { isOnline, isServerAvailable } = useNetworkStatus();

    useEffect(() => {
        if (dreamId) {
            const foundDream = mockDreams.find(d => d.id === dreamId);
            if (foundDream) setDream(foundDream);
        }
    }, [dreamId]);

    if (!dream) return <p className="loading-message" data-testid="loading-message">Loading dream details...</p>;

    return (
        <div className="read-dream-container">
            <button
                className="back-button"
                onClick={() => router.push("/journal")}
                data-testid="back-button"
            >
                ← Back to Journal
            </button>

            <h1 className="dream-title" data-testid="dream-title">{dream.title}</h1>
            <p className="dream-date" data-testid="dream-date">{dream.date}</p>
            <p className="dream-content" data-testid="dream-content">{dream.content}</p>

            <div className="dream-tags">
                {dream.tags.map(tag => (
                    <span key={tag} className="tag" data-testid={`dream-tag-${tag}`}>
                        <Image
                            src={`/${tag.toLowerCase().replace(/ [&]+/g, "").replace(/ /g, "-")}.png`}
                            alt={tag}
                            width={24}
                            height={24}
                        />
                        {tag}
                    </span>
                ))}
            </div>
            <div className="status-indicator">
            {!isOnline && <p>⚠️ You are offline.</p>}
            {isOnline && !isServerAvailable && <p>⚠️ Server is unavailable.</p>}
            {isOnline && isServerAvailable && <p>✅ You are online and connected to the server.</p>}
            </div>
        </div>
    );
}

// Main component that wraps the content in Suspense
export default function ReadDream() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReadDreamContent />
        </Suspense>
    );
}
