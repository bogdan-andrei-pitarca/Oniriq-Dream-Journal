"use client";
import React, { createContext, useContext, useState } from "react";

type Dream = {
    id: string;
    title: string;
    date: string;
    content: string;
    tags: string[];
    wordCount?: number;
    files?: { filename: string; path: string; type: string }[];
};

type DreamContextType = {
    dreams: Dream[];
    setDreams: React.Dispatch<React.SetStateAction<Dream[]>>;
};

const DreamContext = createContext<DreamContextType | undefined>(undefined);

export const DreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dreams, setDreams] = useState<Dream[]>([
        {
            id: "1",
            title: "ZZZZ",
            date: "01/01/25",
            content: "This is the content of Dream 1. Blablabla, blablabla. Dream.",
            tags: ["Location", "Lucid"],
        },
        {
            id: "2",
            title: "hello",
            date: "15/02/25",
            content: "This is Dream 2.",
            tags: ["People", "Nightmare"],
        },
        {
            id: "3",
            title: "Dream 3",
            date: "10/03/25",
            content: "This is the content of Dream 3. It was very nice, very vivid. I dreamt of unicorns, rainbows and butterflies. It was a very happy dream.",
            tags: ["Activities", "Creatures & Animals"],
        },
    ]);

    return (
        <DreamContext.Provider value={{ dreams, setDreams }}>
            {children}
        </DreamContext.Provider>
    );
};

export const useDreamContext = () => {
    const context = useContext(DreamContext);
    if (context === undefined) {
        throw new Error("useDreamContext must be used within a DreamProvider");
    }
    return context;
};