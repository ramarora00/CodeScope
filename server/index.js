const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const repoRouter = require('./routes/repo');
const chatRouter = require('./routes/chat');
app.use('/api/repo', repoRouter);
app.use('/api/chat', chatRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running smoothly 🚀' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});