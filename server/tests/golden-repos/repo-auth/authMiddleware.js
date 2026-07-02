import { verify } from './jwtUtils.js';

export function verifyToken(req, res, next) {
    const token = req.headers.authorization;
    const decoded = verify(token);
    if (decoded) {
        req.user = decoded;
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
}
