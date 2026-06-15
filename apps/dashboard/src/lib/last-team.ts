const KEY = 'vault-team';
export const lastTeam = {
    get: () => localStorage.getItem(KEY),
    set: (id: string) => localStorage.setItem(KEY, id),
};
