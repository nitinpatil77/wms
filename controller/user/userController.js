import mongoose from "mongoose";
import userModel from "../../models/userModel/userModel.js";
import loginHistoryModel from "../../models/userModel/loginHistoryModel.js"; 
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Create token function
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// User login route 
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await userModel.findOne({ username });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Generate Token
    const token = createToken(user._id);

    // Store login history
    await loginHistoryModel.create({
      userId: user._id,
      employeeName: user.employeeName, 
      role: user.role, 
      // ipAddress: req.ip || req.connection.remoteAddress,
      // userAgent: req.headers["user-agent"],
    });

    return res.json({ success: true, token, message: "User logged in" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// User register route 
export const registerUser = async (req, res) => {
  try {
    const ALL_PERMISSIONS = [
      "MASTER",
      "AGV_OPERATIONS",
      "STOCK_REPORT",
      "MANUAL_RETRIEVAL",
      "AGV_REPORT",
      "ACCESS_CONTROL",
      "TASK_REPORT"
    ];

    const { employeeName, mobileNumber, email, role, username, password, permissions = [] } = req.body;

    // Check if user already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Validate email and password strength
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Assign full permissions if the user is an admin
    const assignedPermissions = role === "admin" ? ALL_PERMISSIONS : permissions;

    // Save new user
    const newUser = new userModel({
      employeeName,
      mobileNumber,
      email,
      role,
      username,
      password: hashedPassword,
      permissions: assignedPermissions
    });

    const user = await newUser.save();
    
    // Generate JWT Token
    const token = createToken(user._id);

    res.status(201).json({ success: true, token, message: "Account created successfully", user });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// forget password
export const passwordReset = async (req, res) => {
  try {
    const { username, token, newPassword } = req.body;

    // Step 1: Generate Reset Token (If only username is provided)
    if (username && !token && !newPassword) {
      const user = await userModel.findOne({ username });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

      return res.json({
        success: true,
        token: resetToken, // Fixed key name to match frontend
        message: "Password reset token generated. Use this to reset your password.",
      });
    }

    
    if (token && newPassword) {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
      }

      const user = await userModel.findById(decoded.id);

      if (!user) {
        return res.status(404).json({ success: false, message: "Invalid token or user not found" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return res.json({ success: true, message: "Password reset successfully" });
    }

    return res.status(400).json({ success: false, message: "Invalid request. Provide either username OR token & newPassword." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User Details
export const getLoggedUserDetails = async (req, res) => {
  try {
    // Get the token from request headers
    const token = req.headers.authorization?.split(" ")[1]; 

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    // Fetch user details from database
    const user = await userModel.findById(decoded.id).select("-password"); // Excluding password

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}).select("-password"); // Excluding password
    return res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// update user by id
export const updateUserById = async (req, res) => {
  try {
    const { userId } = req.query;
    const { permissions, role, username } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Optional fields to update
    if (permissions !== undefined) user.permissions = permissions;
    if (role !== undefined) user.role = role;
    if (username !== undefined) user.username = username;

    await user.save();

    res.json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// delete user by id
export const deleteUserById = async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await userModel.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
