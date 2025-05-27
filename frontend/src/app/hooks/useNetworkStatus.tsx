"use client";
import { useState, useEffect } from "react";

// Keep the fallback for local dev
const API_BASE_URL_DEV = 'http://localhost:5000/api';

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isServerAvailable, setIsServerAvailable] = useState(true);

    // Function to check actual connectivity
    const checkConnectivity = async () => {
        try {
            // Try to fetch from a reliable endpoint (like Google\'s DNS)
            await fetch('https://8.8.8.8', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            setIsOnline(true);
        } catch {
            setIsOnline(false);
        }
    };

    // Function to check server availability - will determine the correct URL at runtime
    const checkServerAvailability = async () => {
        // Use the environment variable directly here at runtime
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ? `https://${process.env.NEXT_PUBLIC_API_URL}/api` : API_BASE_URL_DEV;
        console.log('Checking server availability at:', apiUrl); // Log the URL being used

        try {
            const response = await fetch(`${apiUrl}/health`);
            setIsServerAvailable(response.ok);
        } catch {
            setIsServerAvailable(false);
        }
    };

    useEffect(() => {
        // Initial checks
        checkConnectivity();
        // Only run server availability check client-side
        if (typeof window !== 'undefined') {
             checkServerAvailability();
        }


        // Set up interval for periodic checks
        const connectivityInterval = setInterval(checkConnectivity, 5000); // Check every 5 seconds
        const serverInterval = setInterval(() => {
            if (typeof window !== 'undefined') { // Ensure interval also runs client-side
                 checkServerAvailability();
            }
        }, 5000);

        // Cleanup intervals on unmount
        return () => {
            clearInterval(connectivityInterval);
            clearInterval(serverInterval);
        };
    }, []); // Add checkConnectivity and checkServerAvailability to dependency array? No, they are stable callbacks


    return { isOnline, isServerAvailable };
};