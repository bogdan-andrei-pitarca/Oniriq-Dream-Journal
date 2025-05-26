import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
    type: 'initial' | 'newDream' | 'updatedDream' | 'deletedDream';
    data: unknown;
}

export const useWebSocket = (onMessage: (message: WebSocketMessage) => void) => {
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 1000; // 1 second

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            ws.current = new WebSocket('ws://localhost:5000');

            ws.current.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                reconnectAttempts.current = 0;
            };

            ws.current.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    onMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                
                // Attempt to reconnect with exponential backoff
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
                    reconnectTimeout.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connect();
                    }, delay);
                }
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            setIsConnected(false);
        }
    }, [onMessage]);

    useEffect(() => {
        // Add a small delay before initial connection to ensure server is ready
        const initialTimeout = setTimeout(() => {
            connect();
        }, 1000);

        return () => {
            clearTimeout(initialTimeout);
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [connect]);

    return { isConnected };
}; 