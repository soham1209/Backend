import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
