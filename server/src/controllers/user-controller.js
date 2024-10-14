import User from "../models/user-model.js";

const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      !fullName
      // !coverImage ||
      // !avatar
    ) {
      res.status(400).json({ message: "All fields is required" });
    }

    const existUser = await User.findOne({ email: email.toLowerCase });
    // const existUser = await User.findOne({ $or: [{ email }, { username }] });
    // console.log("existUser: ", existUser);

    if (existUser) {
      res
        .status(200)
        .json({ message: "Email already exist please try a another email" });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      // coverImage,
      // avatar,
    });

    const createUser = User.findById(user._id).select(
      "-password -refreshToken"
    );
    // console.log("createUser: ", createUser);

    if (!createUser) {
      res
        .status(401)
        .json({ message: "Some thing went wrong while registering the user" });
    }

    res.status(201).json({ message: "Registration successfully", user });
  } catch (error) {
    console.log("REGISTER ERROR: ", error);
  }
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log("find user: ", user);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // console.log("accessToken: ", accessToken);
    // console.log("refreshToken: ", refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("GENERATE_ACCESS_AND_REFRESH_TOKEN: ", error);
  }
};

const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!(username || email)) {
      res.status(400).json({ message: "All fields is required" });
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    // console.log("user register hain ya nhi: ", user);

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    const checkPassword = await user.isPasswordCorrect(password);
    // console.log("checkPassword: ", checkPassword);

    if (!checkPassword) {
      res.status(401).json({ message: "Invalid passowrd" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // console.log(" accessToken: ", accessToken);
    // console.log(" refreshToken: ", refreshToken);

    const loggedInUser = await User.findOne(user._id).select("-refreshToken");

    const options = {
      httpOnly: true,
      secure: true,
    };

    // console.log("options: ", options);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "Login user succcessfully",
        loggedInUser,
        accessToken,
        refreshToken,
      });
  } catch (error) {
    console.log("LOGIN ERROR: ", error);
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          accessToken: undefined,
        },
      },
      {
        new: true,
      }
    );
    console.log("logout user :", user);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        message: "Logout user succcessfully",
      });
  } catch (error) {
    console.log("LOGOUT ERROR: ", error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const inCommingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;
    console.log("inCommingRefreshToken :", inCommingRefreshToken);

    if (!inCommingRefreshToken) {
      res.status(401).json({ message: "Unauthorized token" });
    }

    const decodedToken = jwt.verify(
      inCommingRefreshToken,
      process.env.REFRESH_TOKEN
    );
    console.log("decodedToken: ", decodedToken);

    const user = await User.findById(decodedToken._id);
    console.log("user: ", user);

    if (!user) {
      res.status(401).json({ message: "Invalid refresh token" });
    }

    if (inCommingRefreshToken !== user.refreshToken) {
      res.status(401).json({ message: "Refresh token is expired and use" });
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({ message: "Access token refresed" });
  } catch (error) {
    console.log("REFRSH TOKEN ERROR: ", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export { register, login, logout, refreshToken };
