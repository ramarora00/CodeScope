import { login } from './authService.js';

export function loginController(req, res) {
    const { email, password } = req.body;
    const token = login(email, password);
    if (token) {
        res.json({ token });
    } else {
        res.status(401).send('Failed');
    }
}

export function profileController(req, res) {
    res.json({ user: req.user });
}
