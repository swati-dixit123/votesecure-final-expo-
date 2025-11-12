require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const multer = require("multer"); // added multer

const User = require("./models/user"); // make sure your User model has voterIdImage & photo
const authRoutes = require("./routes/auth");

const app = express();
const port = 8000;

// ---------------------
// MongoDB Connection
// ---------------------
mongoose.connect("mongodb://localhost:27017/voting", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ---------------------
// Multer File Upload Setup
// ---------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// ---------------------
// Middleware
// ---------------------
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.resolve("./public")));
app.use(express.static(path.join(__dirname, "public")));


app.use(session({
  secret: 'yoursecretkey',
  resave: false,
  saveUninitialized: false
}));

// Pass user info to all views
app.use((req, res, next) => {
  res.locals.userName = req.session.userName || null;
  next();
});

// ---------------------
// Candidates
// ---------------------
const candidates = [
  { name: "Bhartiya Janta Party", image: "/images/BJP.png" },
  { name: "Indian National Congress", image: "/images/INC.png" },
  { name: "Samajvadi Party", image: "/images/SP.png" },
  { name: "Aam Aadmi Party", image: "/images/AAP.png" },
  { name: "Bahujan Samaj Party", image: "/images/BSP.png" },
  { name: "Shivsena", image: "/images/SHIVSENA.png" },
];

// ---------------------
// Routes
// ---------------------
app.use("/auth", authRoutes(upload)); // pass upload to auth routes for image handling

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ---------------------
// Voting System
// ---------------------
const voteSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // one vote per user
  party: { type: String, required: true },
  votedAt: { type: Date, default: Date.now }
});
const Vote = mongoose.model("Vote", voteSchema);

app.get("/dashboard", async (req, res) => {
  const userId = req.session.userId || req.sessionID;
  const voted = await Vote.exists({ userId });
  res.render("dashboard", { voted, candidates });
});

app.post("/vote/vote", async (req, res) => {
  const userId = req.session.userId || req.sessionID;
  const { party } = req.body;

  try {
    const existingVote = await Vote.findOne({ userId });
    if (existingVote) return res.json({ success: false, message: "You have already voted!" });

    await new Vote({ userId, party }).save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error saving vote" });
  }
});

// ---------------------
// Profile
// ---------------------
app.get("/profile", async (req, res) => {
  try {
    if (!req.session.userId) return res.render("profile", { user: null });

    const user = await User.findById(req.session.userId);
    res.render("profile", { user });
  } catch (err) {
    console.error(err);
    res.render("profile", { user: null });
  }
});

// ---------------------
// Start Server
// ---------------------
app.listen(port, () => console.log(`Server running on port http://localhost:${port}`));
