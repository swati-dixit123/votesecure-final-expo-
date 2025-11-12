const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  aadhar: { type: String, unique: true, required: true },
  mobile: { type: String, required: true },
  voterId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  voterIdImage: { type: String }, // file path for uploaded voter ID
  photo: { type: String }         // file path for user's photo
}, { timestamps: true }); // optional: adds createdAt & updatedAt

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
