const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  photoURL: { type: String, default: "/public/images/default_candidate.jpg" }
}, { timestamps: true });

module.exports = mongoose.model("Candidate", candidateSchema);