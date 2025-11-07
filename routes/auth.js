const express = require("express");
const router = express.Router();
require("dotenv").config();
const authController = require("../controllers/authController");

const twilio = require("twilio");
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Twilio Verify Service ID
const verifySid = process.env.TWILIO_VERIFY_SID;

// ========= Existing Routes =========
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.get("/signin", authController.getSignin);
router.post("/signin", authController.postSignin);
router.get("/logout", authController.logout);

// ========= NEW Twilio OTP Routes =========

// 1️⃣ Send OTP
router.post("/send-otp", async (req, res) => {
  const { mobileNumber } = req.body;
  try {
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: `+91${mobileNumber}`, channel: "sms" });

    console.log("OTP Sent:", verification.sid);
    res.json({ success: true });
  } catch (err) {
    console.error("Twilio OTP Error:", err);
    res.json({ success: false });
  }
});

// 2️⃣ Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { mobileNumber, otp } = req.body;
  try {
    const verification_check = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: `+91${mobileNumber}`, code: otp });

    if (verification_check.status === "approved") {
      console.log("OTP Verified Successfully!");
      return res.redirect("/dashboard");
    } else {
      res.render("signin", { error: "Invalid OTP. Please try again." });
    }
  } catch (err) {
    console.error("Verification Error:", err);
    res.render("signin", { error: "OTP verification failed." });
  }
});

module.exports = router;














