const express = require("express");
const router = express.Router();
require("dotenv").config();
const authController = require("../controllers/authController");
const twilio = require("twilio");

// Twilio credentials
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SID;

// ========== EXISTING ROUTES ==========
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.get("/signin", authController.getSignin);
router.post("/signin", authController.postSignin);
router.get("/logout", authController.logout);

// ========== NEW Twilio OTP ROUTES ==========

// 1️⃣ Send OTP
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

// 2️⃣ Verify OTP
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

module.exports = router;
