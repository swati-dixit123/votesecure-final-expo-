const User = require("../models/user");
const twilio = require("twilio");
require("dotenv").config();

// Twilio setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SID;

// ✅ GET SIGNUP
exports.getSignup = (req, res) => {
  res.render("signup", { error: null });
};

// ✅ POST SIGNUP
exports.postSignup = async (req, res) => {
  try {
    const { fullName, email, password, Aadhar, mobile, voterID } = req.body;

    // Check for duplicates
    const existingUser = await User.findOne({
      $or: [{ email }, { aadhar: Aadhar }, { voterId: voterID }]
    });

    if (existingUser) {
      let msg = "User already exists with ";
      if (existingUser.email === email) msg += "this Email.";
      else if (existingUser.aadhar === Aadhar) msg += "this Aadhar Number.";
      else msg += "this Voter ID.";
      return res.render("signup", { error: msg });
    }

    // Create new user
    await User.create({
      name: fullName,
      email,
      password,
      aadhar: Aadhar,
      mobile,
      voterId: voterID
    });

    console.log("✅ New user registered successfully");
    res.redirect("/auth/signin");
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.render("signup", { error: "Signup failed. Please try again." });
  }
};

// ✅ GET SIGNIN
exports.getSignin = (req, res) => {
  res.render("signin", { error: null });
};

// ✅ VERIFY OTP + LOGIN
exports.postSignin = async (req, res) => {
  try {
    const { email, password, ["MOB-NUM"]: phone, OTP } = req.body;

    // 1️⃣ Verify OTP
    const verificationCheck = await client.verify.v2.services(verifySid)
      .verificationChecks.create({ to: `+91${phone}`, code: OTP });

    if (verificationCheck.status !== "approved") {
      return res.render("signin", { error: "Invalid OTP" });
    }

    // 2️⃣ Verify user
    const user = await User.findOne({ email });
    if (!user) return res.render("signin", { error: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.render("signin", { error: "Invalid email or password" });

    // ✅ Login success
    req.session.userId = user._id;
    req.session.userName = user.name;

    console.log(`✅ ${user.name} logged in successfully`);
    res.redirect("/dashboard");
  } catch (err) {
    console.error("❌ Signin error:", err);
    res.render("signin", { error: "Signin failed. Please try again." });
  }
};

// ✅ Middleware: check if user logged in
function isLoggedIn(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/auth/signin");
  }
  next();
}

// ✅ PROFILE PAGE
exports.profile = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/auth/signin");

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect("/auth/signin");
    }

    res.render("profile", {
      user: {
        name: user.name,
        email: user.email,
        aadhar: user.aadhar,
        mobile: user.mobile,
        voterId: user.voterId,
        registeredId: user._id
      }
    });
  } catch (err) {
    console.error("❌ Profile Fetch Error:", err);
    res.status(500).send("Error loading profile page");
  }
};

// ✅ LOGOUT
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/dashboard");
    }
    res.redirect("/auth/signin");
  });
};

// Export isLoggedIn so router can use it
exports.isLoggedIn = isLoggedIn;

// ✅ SEND OTP (for signup/login)
exports.sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: "Phone number required" });

  try {
    const verification = await client.verify.v2.services(verifySid)
      .verifications.create({ to: `+91${phone}`, channel: "sms" });

    console.log("📲 OTP sent:", verification.sid);
    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Twilio error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};
