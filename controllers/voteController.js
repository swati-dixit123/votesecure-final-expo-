const Candidate = require("../models/candidate");
const Vote = require("../models/vote");
const User = require("../models/user");

// ✅ Dashboard: Show candidates + voting status
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/auth/signin");

    const candidates = await Candidate.find();
    const existingVote = await Vote.findOne({ voter: userId });

    // Pass vote info to frontend
    res.render("dashboard", {
      candidates,
      voted: !!existingVote, // true if already voted
      userName: req.session.userName || "Voter"
    });
  } catch (err) {
    console.error("Dashboard load error:", err);
    res.status(500).send("Failed to load dashboard");
  }
};

// ✅ Cast a Vote (One-time only)
exports.castVote = async (req, res) => {
  try {
    const voterId = req.session.userId;
    const candidateId = req.body.candidateId;

    if (!voterId) {
      return res.redirect("/auth/signin");
    }

    // 1️⃣ Check if already voted
    const existingVote = await Vote.findOne({ voter: voterId });
    if (existingVote) {
      return res.render("vote-confirmation", {
        message: "❌ You have already voted!"
      });
    }

    // 2️⃣ Record vote
    await Vote.create({ voter: voterId, candidate: candidateId });

    // 3️⃣ (Optional) Update user.hasVoted flag
    const user = await User.findById(voterId);
    user.hasVoted = true;
    await user.save();

    // 4️⃣ Render success page
    res.render("vote-confirmation", {
      message: "✅ Your vote has been successfully recorded!"
    });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).send("Failed to cast vote");
  }
};
