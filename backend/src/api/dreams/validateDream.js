
// Helper function to validate dream data
export function validateDream(dream) {
    if (!dream.title || typeof dream.title !== 'string' || dream.title.trim().length === 0) {
        return { isValid: false, error: 'Title is required and must be a non-empty string' };
    }
    if (!dream.date || typeof dream.date !== 'string' || dream.date.trim().length === 0) {
        return { isValid: false, error: 'Date is required and must be a non-empty string' };
    }
    if (!dream.content || typeof dream.content !== 'string' || dream.content.trim().length === 0) {
        return { isValid: false, error: 'Content is required and must be a non-empty string' };
    }
    if (!Array.isArray(dream.tags)) {
        return { isValid: false, error: 'Tags must be an array' };
    }
    return { isValid: true };
}