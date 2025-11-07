const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");

// Protect routes middleware
function ensureAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/auth/signin");
}

router.get("/dashboard", ensureAuthenticated, voteController.getDashboard);
router.post("/vote", ensureAuthenticated, voteController.castVote);

module.exports = router;