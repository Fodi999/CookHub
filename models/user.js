const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    uniqueKey: String,
    role: { type: String, default: "user" }  // Роль пользователя (admin/user)
});

const User = mongoose.model("User", userSchema);

module.exports = User;

