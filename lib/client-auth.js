

const TOKEN_KEY = 'scr_token';



export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}


export function setToken(token) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

export function clearToken() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
    }
}



export function decodeToken(token) {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(payload);
        return JSON.parse(json);
    } catch {
        return null;
    }
}


export function isTokenValid(token) {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 > Date.now();
}



export function authHeaders() {
    const token = getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}


export function authFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {}),
    };
    return fetch(url, { ...options, headers });
}
