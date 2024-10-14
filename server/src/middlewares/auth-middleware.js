import dotenv from "dotenv";
import User from "../models/user-model.js";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

const verifyToken = async (req, res, next) => {
  try {
    const token = req?.cookies?.accessToken;
    console.log("jwt token: ", token);

    // req.header("Authorization");
    // ||
    // req.header("Authorization")
    // .replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Invalid jwt token" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("decoded: ", decoded);

    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );
    console.log("user: ", user);

    if (!user) {
      res.status(401).json({ message: "Invalid access token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("JWT MIDDLEWARE ERROR: ", error);
    res.status(401).json({ message: "Invalid access token" });
  }
};

export default verifyToken;
