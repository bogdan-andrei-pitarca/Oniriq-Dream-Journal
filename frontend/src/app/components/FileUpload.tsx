import { useState, useRef } from 'react';
import './FileUpload.css';

interface FileUploadProps {
    entityId: string; // ID of the entity to associate the file with
    onUploadSuccess: (fileData: { filename: string; path: string }) => void;
    onUploadError: (error: string) => void;
    maxFileSize?: number; // in bytes, default will be 2GB
    acceptedFileTypes?: string; // e.g., "video/*,image/*"
}

export const FileUpload = ({
    entityId,
    onUploadSuccess,
    onUploadError,
    maxFileSize = 20 * 1024 * 1024 * 1024, // 20GB default
    acceptedFileTypes = "video/*,image/*",
}: FileUploadProps) => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const abortController = useRef<AbortController | null>(null);

    const uploadChunk = async (
        chunk: Blob,
        filename: string,
        chunkIndex: number,
        totalChunks: number
    ) => {
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('filename', filename);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());

        const response = await fetch('http://localhost:5000/api/dreams/upload-chunk', {
            method: 'POST',
            body: formData,
            signal: abortController.current?.signal
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file size
        if (file.size > maxFileSize) {
            onUploadError(`File size exceeds maximum limit of ${maxFileSize / (1024 * 1024)}MB`);
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        abortController.current = new AbortController();

        try {
            const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let uploadedChunks = 0;

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                await uploadChunk(chunk, file.name, i, totalChunks);
                uploadedChunks++;
                setUploadProgress((uploadedChunks / totalChunks) * 100);
            }

            // Complete the upload
            const response = await fetch('http://localhost:5000/api/dreams/complete-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename: file.name, entityId }), // Include the entity ID in the request
            });

            if (!response.ok) {
                throw new Error('Failed to complete upload');
            }

            const data = await response.json();
            onUploadSuccess(data);
        } catch (error) {
            if (error instanceof Error) {
                onUploadError(error.message);
            } else {
                onUploadError('An unknown error occurred');
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            abortController.current = null;
        }
    };

    const handleCancel = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    return (
        <div className="file-upload-container">
            <input
                type="file"
                onChange={handleFileUpload}
                accept={acceptedFileTypes}
                disabled={isUploading}
                className="file-input"
            />
            {isUploading && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <div className="progress-text">
                        {uploadProgress.toFixed(1)}%
                    </div>
                    <button 
                        onClick={handleCancel}
                        className="cancel-button"
                    >
                        Cancel Upload
                    </button>
                </div>
            )}
        </div>
    );
};

