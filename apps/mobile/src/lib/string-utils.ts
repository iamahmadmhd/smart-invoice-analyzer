export function capitalize(str: string | undefined | null): string | undefined {
    if (!str) return undefined;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
