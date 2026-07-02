import express from 'express';
import { loginController, profileController } from './loginController.js';
import { verifyToken } from './authMiddleware.js';

const app = express();
app.use(express.json());

// Routes
app.post('/login', loginController);
app.get('/profile', verifyToken, profileController);
app.post('/register', verifyToken, (req, res) => res.send('ok'));

app.listen(3000);
