require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./user");
const fakeUsers = require("./fake");

const MONGO_URI = "mongodb://localhost:27017/voting";

async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB");

    // Delete existing users
    await User.deleteMany({});
    console.log("🧹 Existing users removed");

    // Hash passwords & insert
    for (let user of fakeUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
      await User.create(user);
      console.log(`✅ Added: ${user.name}`);
    }

    console.log("\n🎉 Fake users seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  }
}

seedUsers();
