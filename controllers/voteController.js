const Candidate = require("../models/candidate");
const Vote = require("../models/vote");

// Dashboard: list all candidates
exports.getDashboard = async (req, res) => {
  try {
    const candidates = await Candidate.find();
    const existingVote = await Vote.findOne({ voter: req.session.userId });
    res.render("dashboard", { candidates, voted: !!existingVote,
      userName: req.session.userName || "Voter"
     });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load dashboard");
  }
};

// Cast vote
exports.castVote = async (req, res) => {
  try {
    const voterId = req.session.userId;
    const candidateId = req.body.candidateId;

    // Check if user already voted
    const existingVote = await Vote.findOne({ voter: voterId });
    if (existingVote) {
      return res.send("You have already voted!");
    }

    await Vote.create({ voter: voterId, candidate: candidateId });
    res.render("vote-confirmation");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to cast vote");
  }
};