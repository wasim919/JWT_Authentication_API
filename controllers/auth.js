const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');
const crypto = require('crypto');

// @desc        Register user
// @route       POST /api/v1/auth
// @access      Public
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    role,
  });
  sendTokenResponse(res, 200, user);
});

// @desc        Login user
// @route       POST /api/v1/auth
// @access      Public
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorResponse(`Please provide an email and password`), 400);
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse(`Invalid Credentials`, 401));
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  sendTokenResponse(res, 200, user);
});

// @desc        Login user
// @route       POST /api/v1/auth
// @access      Public
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc        Forgot password
// @route       POST /api/v1/forgotPassword
// @access      Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorResponse(`There is no user with this email`, 404));
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  console.log('hello');
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetPassword/${resetToken}`;
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
  try {
    await sendMail({
      email: user.email,
      subject: 'Password Reset Token',
      message,
    });
    return res.status(200).json({
      success: true,
      data: 'Email Sent',
    });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: true });
    return next(new ErrorResponse(`Email could not be sent`));
  }
});

// @desc        Reset password
// @route       POST /api/v1/auth/resetPassword/:resetToken
// @access      Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse(`Invalid token`, 400));
  }
  user.password = req.body.password;
  console.log(user.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(res, 200, user);
});

// @desc        Update password
// @route       POST /api/v1/auth/updatePassword
// @access      Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword, user.password))) {
    return next(new ErrorResponse('Invalid user credentials', 401));
  }
  user.password = req.body.newPassword;
  await user.save();
  sendTokenResponse(res, 200, user);
});

// @desc        Update details
// @route       POST /api/v1/auth/updateDetails
// @access      Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  let updateFields = {};
  if (req.body.name) {
    updateFields.name = req.body.name;
  }
  if (req.body.email) {
    updateFields.email = req.body.email;
  }
  const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({
    success: true,
    data: user,
  });
});

const sendTokenResponse = async (res, statusCode, user) => {
  const token = await user.getSignedJwtToken();
  const options = {
    expire: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};
