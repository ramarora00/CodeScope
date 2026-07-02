import express from 'express';
import { orderController } from './orderController.js';

const app = express();

app.post('/order', orderController);

app.listen(3001);
