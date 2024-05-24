const mongoose = require('mongoose');

const motionEventSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now }
});

const MotionEvent = mongoose.model('timestamp', motionEventSchema);

module.exports = MotionEvent;