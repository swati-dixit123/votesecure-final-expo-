const User = require("../models/user");
const twilio = require("twilio");
require("dotenv").config(); // load .env

// Twilio setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ✅ GET SIGNUP
exports.getSignup = (req, res) => {
  res.render("signup", { error: null });
};

// ✅ POST SIGNUP
exports.postSignup = async (req, res) => {
  try {
    const { fullName, email, password ,aadhar,mobile} = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.render("signup", { error: "Email already exists" });

    await User.create({ fullName, email, password });
    res.redirect("/auth/signin");
  } catch (err) {
    console.error(err);
    res.render("signup", { error: "Signup failed" });
  }
};

// ✅ GET SIGNIN
exports.getSignin = (req, res) => {
  res.render("signin", { error: null });
};

// ✅ SEND OTP
exports.sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: "Phone number required" });

  try {
    const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
      .verifications
      .create({ to: `+91${phone}`, channel: "sms" });

    console.log("OTP sent:", verification.sid);
    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Twilio error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// ✅ VERIFY OTP + LOGIN
exports.postSignin = async (req, res) => {
  try {
    const { email, password, ["MOB-NUM"]: phone, OTP } = req.body;

    // 1️⃣ Verify OTP
    const verificationCheck = await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks
      .create({ to: `+91${phone}`, code: OTP });

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
    req.session.userName = user.fullName;

    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("signin", { error: "Signin failed" });
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























// const User = require("../models/user");

// // Render signup page
// exports.getSignup = (req, res) => {
//   res.render("signup", { error: null });
// };

// // Handle signup POST
// exports.postSignup = async (req, res) => {
//   try {
//     const { fullName, email, password } = req.body;
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.render("signup", { error: "Email already exists" });
//     }
//     await User.create({ fullName, email, password });
//     res.redirect("/auth/signin");
//   } catch (err) {
//     console.error(err);
//     res.render("signup", { error: "Signup failed" });
//   }
// };

// // Render signin page
// exports.getSignin = (req, res) => {
//   res.render("signin", { error: null });
// };

// // Handle signin POST
// exports.postSignin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.render("signin", { error: "Invalid email or password" });

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) return res.render("signin", { error: "Invalid email or password" });

//     // Save user session
//     req.session.userId = user._id;
//     req.session.userName = user.fullName;

//     res.redirect("/dashboard");
//   } catch (err) {
//     console.error(err);
//     res.render("signin", { error: "Signin failed" });
//   }
// };

// // Handle logout
// exports.logout = (req, res) => {
//   req.session.destroy();
//   res.redirect("/auth/signin");
// };