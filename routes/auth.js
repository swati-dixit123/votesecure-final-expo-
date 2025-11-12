const express = require("express");
const router = express.Router();
require("dotenv").config();
const authController = require("../controllers/authController");
const twilio = require("twilio");

// Twilio credentials
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SID;

// Destructure controller methods
const {
  getSignup,
  postSignup,
  getSignin,
  postSignin,
  logout,
  profile,
  isLoggedIn
} = authController;

// =========================
// AUTH ROUTES WITH UPLOAD
// =========================
module.exports = (upload) => {

  // Signup page
  router.get("/signup", getSignup);

  // Signup POST with file uploads
 router.post(
  "/signup",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "voterIdImage", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      // Debug: check if files arrived
      console.log("Files received:", req.files);

      // Attach uploaded filenames to req.body for controller
      req.body.photo = req.files?.photo?.[0]?.filename || null;
      req.body.voterIdImage = req.files?.voterIdImage?.[0]?.filename || null;

      // Call signup controller
      await postSignup(req, res);

    } catch (err) {
      console.error("Signup Upload Error:", err);
      res.render("signup", { error: "Signup failed. Please try again." });
    }
  }
);

  // Signin routes
  router.get("/signin", getSignin);
  router.post("/signin", postSignin);
  router.get("/logout", logout);

  // Protected profile
  router.get("/profile", isLoggedIn, profile);

  // =========================
  // TWILIO OTP ROUTES
  // =========================

  // Send OTP
  router.post("/send-otp", async (req, res) => {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: "Mobile number required" });
    }

    try {
      const verification = await client.verify.v2
        .services(verifySid)
        .verifications.create({
          to: `+91${mobileNumber}`,
          channel: "sms"
        });

      console.log("OTP Sent:", verification.sid);
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (err) {
      console.error("Twilio OTP Error:", err);
      res.status(500).json({
        success: false,
        message: "Failed to send OTP. Check Twilio credentials or verified number.",
        error: err.message
      });
    }
  });

  // Verify OTP
  router.post("/verify-otp", async (req, res) => {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.render("signin", { error: "Both mobile number and OTP are required." });
    }

    try {
      const verification_check = await client.verify.v2
        .services(verifySid)
        .verificationChecks.create({
          to: `+91${mobileNumber}`,
          code: otp
        });

      if (verification_check.status === "approved") {
        console.log("✅ OTP Verified Successfully!");
        return res.redirect("/dashboard");
      } else {
        console.log("❌ OTP Invalid or Expired");
        res.render("signin", { error: "Invalid OTP. Please try again." });
      }
    } catch (err) {
      console.error("Verification Error:", err);
      res.render("signin", { error: "OTP verification failed. Try again later." });
    }
  });

  return router;
};
