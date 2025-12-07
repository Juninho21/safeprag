export const TIMEZONE = 'America/Sao_Paulo';

export function getBrasiliaDate(): Date {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    return tzDate;
}

export function formatBrasiliaDate(date: Date | string | number): string {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function isExpiredBrasilia(endDate: Date): boolean {
    const now = getBrasiliaDate();
    // Ensure endDate is compared in the same context if possible, 
    // but usually Date objects are timestamps. 
    // If endDate comes from Firestore, it's a timestamp.
    // We just need to make sure 'now' is correct relative to the check we want.
    // Actually, new Date() returns the current timestamp which is timezone agnostic.
    // The issue is usually displaying or calculating "end of day" logic.
    // If we just compare timestamps:
    return endDate < new Date();
}

// Helper to get current time in Brasilia as a Date object (preserving the instant)
// Note: new Date() gives the current instant. 
// If the requirement is "system time" for display or logic that depends on "what day is it in Brasilia",
// we might need to be careful.
// For expiration checks (timestamp vs timestamp), standard new Date() is usually fine 
// UNLESS the expiration date was set as "midnight Brasilia time" and we are comparing against it.

export function toBrasiliaDate(date: Date): Date {
    return new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
}
