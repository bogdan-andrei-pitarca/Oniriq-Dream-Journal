"use client";
import { useState, useEffect } from "react";

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isServerAvailable, setIsServerAvailable] = useState(true);

    useEffect(() => {
        // Function to check actual connectivity
        const checkConnectivity = async () => {
            try {
                // Try to fetch from a reliable endpoint (like Google's DNS)
                const response = await fetch('https://8.8.8.8', { 
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache'
                });
                setIsOnline(true);
            } catch (error) {
                setIsOnline(false);
            }
        };

        // Function to check server availability
        const checkServerAvailability = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/health');
                setIsServerAvailable(response.ok);
            } catch (error) {
                setIsServerAvailable(false);
            }
        };

        // Initial checks
        checkConnectivity();
        checkServerAvailability();

        // Set up interval for periodic checks
        const connectivityInterval = setInterval(checkConnectivity, 5000); // Check every 5 seconds
        const serverInterval = setInterval(checkServerAvailability, 5000);

        // Cleanup intervals on unmount
        return () => {
            clearInterval(connectivityInterval);
            clearInterval(serverInterval);
        };
    }, []);

    return { isOnline, isServerAvailable };
};