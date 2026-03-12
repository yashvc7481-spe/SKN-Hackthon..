const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIO = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ambulance_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB Connected');
}).catch((err) => {
  console.error('❌ MongoDB Error:', err);
});

app.use('/api/ambulance', require('./routes/ambulance'));
app.use('/api/hospital', require('./routes/hospital'));
app.use('/api/traffic', require('./routes/traffic'));
app.use('/api/admin', require('./routes/admin'));

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { app, io };