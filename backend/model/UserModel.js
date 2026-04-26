const mongoose = require("mongoose");
const userSchema = require("../schemas/UserSchema"); 

const UserModel = mongoose.model("User", userSchema);

module.exports = { UserModel };