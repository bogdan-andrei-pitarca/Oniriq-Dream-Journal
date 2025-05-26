const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/dreams` : "http://localhost:5000/api/dreams";

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : undefined;
};

export const fetchDreams = async (params: Record<string, string | number>) => {
    const query = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
        }, {} as Record<string, string>)
    ).toString();
    const headers = getAuthHeader();
    const response = await fetch(`${API_BASE_URL}?${query}`, {
        headers: headers ? headers : undefined
    });
    if (!response.ok) throw new Error("Failed to fetch dreams");
    return response.json();
};

export const createDream = async (dream: { title: string; content: string; date: string; tags: string[] }) => {
    const headers: HeadersInit = { 
        "Content-Type": "application/json",
        ...getAuthHeader()
    };
    const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(dream),
    });
    if (!response.ok) throw new Error("Failed to create dream");
    return response.json();
};

export const updateDream = async (id: string, dream: { title: string; content: string; date: string; tags: string[] }) => {
    const headers: HeadersInit = { 
        "Content-Type": "application/json",
        ...getAuthHeader()
    };
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify(dream),
    });
    if (!response.ok) throw new Error("Failed to update dream");
    return response.json();
};

export const deleteDream = async (id: string) => {
    const headers = getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/${id}`, { 
        method: "DELETE",
        headers: headers ? headers : undefined
    });
    if (!response.ok) throw new Error("Failed to delete dream");
};