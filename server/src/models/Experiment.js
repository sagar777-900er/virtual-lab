import mongoose from 'mongoose';

const experimentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  thumbnail: {
    type: String, // base64 or URL
  },
  stateData: {
    type: Object, // The snapshot JSON of bodies/constraints
    required: true,
  },
  author: {
    type: String,
    default: 'Anonymous',
  },
}, {
  timestamps: true,
});

const Experiment = mongoose.model('Experiment', experimentSchema);

export default Experiment;
