export function signToken(payload) {
    return `token_${payload.id}`;
}
export function verify(token) {
    return { id: 1 };
}
