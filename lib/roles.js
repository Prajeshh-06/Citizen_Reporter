


export function requireRole(allowedRoles) {
    return function (request) {
        const user = request.user;
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthenticated' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (!allowedRoles.includes(user.role)) {
            return new Response(
                JSON.stringify({
                    error: 'Forbidden',
                    detail: `Role '${user.role}' is not permitted. Required: ${allowedRoles.join(', ')}`,
                }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return null; 
    };
}


export function requireWardMatch(request, issueWardNumber) {
    const user = request.user;

    if (user.role === 'admin') return null;

    if (user.role === 'municipality') {
        if (user.wardNumber == null || user.wardNumber !== issueWardNumber) {
            return new Response(
                JSON.stringify({
                    error: 'Forbidden',
                    detail: 'Municipality users can only update issues within their assigned ward',
                }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return null;
    }

    return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
    });
}
