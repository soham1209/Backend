import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.genrateRefreshToken();
    const accessToken = user.genrateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while genrating refresh and accesse token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user detals from frontend
  //validate not empty
  //check if user is alredy exist, username,email
  //check for image and check for avatar
  //uplode them to cloudinary ,avatar
  //create user object- create entry in db
  //remove password and refersh token field from response
  //check for user cration
  //return res

  // 1 step
  const { userName, email, fullName, password } = req.body;
  // console.log("Registering user:", { userName, email });

  //2 step
  //check for empty fields
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //3 step
  const exitedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (exitedUser) {
    throw new ApiError(
      409,
      "User with same username or userid is alredy existes"
    );
  }

  // 4
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  )
    coverImageLocalPath = req.files.coverImage[0].path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //5
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) throw new ApiError(400, "Avatar file is required");

  // 6
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  //7
  //getting is user creded and if creatd get the user in createdUser
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); //.select by defalt selct all and remvoe those have - sign
  //8
  if (!createdUser)
    throw new ApiError(500, "something went wrong while cretating user");
  //9
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find user
  // check password
  // asses token and refersh token
  // send sequre cookie

  // 1,2
  const { email, userName, password } = req.body;

  if (!email && !userName)
    throw new ApiError(400, "username or email is required");
  //is you want any one of it then (!(email || userName))
  // 3
  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (!user) throw new ApiError(404, "User does not exist");

  // 4
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");
  // 5
  const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
    user._id
  );

  //6
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //this makes cookies unmodifieable for fronte end
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,

    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get the the refersh token
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "unauthorized request");
  try {
    //decode token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    //get user by token
    const user = User.findById(decodedToken._id);
    if (!user) throw new ApiError(401, "Invalid refresh token");
  
    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or used");
  
    //genrate new token for user
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } = await genrateAccessAndRefreshToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        200,
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        "Access token refreshed"
      );
  } catch (error) {
    throw new ApiError(401,error?.message||"Invalid refresh token")
  }
});
export { registerUser, loginUser, logoutUser,refreshAccessToken };
