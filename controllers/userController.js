import { User } from "../modals/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { fullname, username, password, gender } = req.body;

    if (!fullname || !username || !password || !gender) {
      return res.status(400).json({
        message: "Something is Missing",
        success: false,
      });
    }
    const user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({
        message: "User exists already",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const maleProfile = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const femaleProfile = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    await User.create({
      fullname,
      username,
      password: hashedPassword,
      ProfilePhoto: gender === "male" ? maleProfile : femaleProfile,
      gender,
    });
    return res.status(201).json({
      message: "Account created successfully",
      success: true,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      message: error.message || "Something went wrong",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Something is Missing",
        success: false,
      });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect username or password",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect username or password",
        success: false,
      });
    }

    const tokenData = {
      userId: user._id,
    };

    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "None",
        secure: true,
      })
      .json({
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        ProfilePhoto: user.ProfilePhoto,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const logout = (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "logout Successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
  }
};

export const getOtherUsers = async (req, res) => {
  try {
    const loggedInUserId = req.id;
    const otherUsers = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );
    return res.status(200).json(otherUsers);
  } catch (error) {
    console.error(error);
  }
};
