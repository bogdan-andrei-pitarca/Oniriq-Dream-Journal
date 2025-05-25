"use client";
import "./home.css";
import { useRouter } from 'next/navigation';
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function Home() {
    const router = useRouter();
    const { isOnline, isServerAvailable } = useNetworkStatus();

    const handleClick = () => {
        // Navigate to another page, e.g., '/journal'
        router.push('/journal');
    };

    return (
        <div className="home-container">
            <h1 className="welcome-text">Welcome!</h1>

            <div className="moon-container">
                <div className="moon">
                    <span className="moon-text">Oniriq</span>
                </div>
            </div>

            <button className="start-button" onClick={handleClick}>Start dreaming...</button>
            <div className="status-indicator">
            {!isOnline && <p>⚠️ You are offline.</p>}
            {isOnline && !isServerAvailable && <p>⚠️ Server is unavailable.</p>}
            {isOnline && isServerAvailable && <p>✅ You are online and connected to the server.</p>}
            </div>
        </div>
    );
}
