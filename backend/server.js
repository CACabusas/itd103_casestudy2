const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MotionEvent = require('./motionEvent');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const port = 3001;

app.use(cors());

mongoose.connect('mongodb://127.0.0.1/motion', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(db => console.log('Database connected'))
  .catch(err => console.log(err));

app.use(bodyParser.json());

// WebSocket server
const wss = new WebSocket.Server({ server: app.listen(port, () => console.log(`Server is running on port ${port}`)) });

wss.on('connection', ws => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

const broadcastNewMotionEvent = (motionEvent) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(motionEvent));
    }
  });
};

// Get all timestamps of motion detection
app.get('/motion/', async (req, res) => {
  try {
    const timestamps = await MotionEvent.find();
    res.json(timestamps);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add new timestamp of motion detection
app.post('/motion/newmotion', async (req, res) => {
  try {
    console.log(req.body);
    const newMotionEvent = new MotionEvent({ timestamp: new Date() });
    await newMotionEvent.save();
    res.status(201).json(newMotionEvent);
    broadcastNewMotionEvent(newMotionEvent); // Broadcast new motion event
  } catch (error) {
    console.error('Error saving motion event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get timestamp by ID
app.get('/motion/getmotion/:motionId', async (req, res) => {
  const motionId = req.params.motionId;
  try {
    const post = await MotionEvent.findById(motionId);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete timestamp
app.delete('/motion/deletemotion/:motionId', async (req, res) => {
  try {
    const { motionId } = req.params;
    await MotionEvent.findByIdAndDelete(motionId);
    res.json({ message: 'Timestamp deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});