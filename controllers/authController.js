/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};

//check user exit or not with email
const validateEmail = async email => {
  const user = await User.findOne({ email });
  return !user;
};

exports.signup = async (req, res, next) => {
  try {
    // const employeeId = await validateUsername(req.employeeId);
    // if (!employeeId) {
    //   return res.status(400).json({
    //     message: `EmployeId is already taken.`,
    //     success: false
    //   });
    // }
    // validate the email
    const emailNotRegistered = await validateEmail(req.email);
    if (!emailNotRegistered) {
      return res.status(400).json({
        message: `Email is already registered.`,
        success: false
      });
    }
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
    });
    createSendToken(newUser, 201, req, res);
  } catch (err) {
    console.log(err);
    return res.status(404).json({
      success: false,
      message: 'user not create.'
    });
  }

  // console.log(url);
};

//insertline manager in user

//Top manager in user

//Super manager in user

exports.checkUserSalesTargetAchive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'user not found.'
      });
    }

    const usersales = await User.findById(id).select('sales');
    const userTarget = await User.findById(id).select('target');

    const calculation = userTarget.target - usersales.sales;

    if (
      userTarget.target === usersales.sales ||
      userTarget.target < usersales.sales
    ) {
      const userx = await User.findOneAndUpdate(
        { _id: id },
        {
          targetAchive: user.targetAchive + 1
        },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        massgae: 'you achive target'
      });
    }

    return res.status(200).json({
      success: true,
      youShouldSales: calculation,
      currentSales: usersales.sales,
      target: userTarget.target
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: 'Unable to see the result , Please try again later.'
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //check this employe id exixt or not
    const userx = await User.findOne({ email });
    if (userx == null) {
      return res.status(400).json({
        success: false,
        message: 'this user not exist'
      });
    }
    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect password', 401));
    }

    const result = await User.findOne({ email });

    // 3) If everything ok, send token to clientxxxx
    createSendToken(result, 200, req, res);
  } catch (err) {
    console.log(err);
  }
};

exports.getUserdetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id }).populate('stores.store');
    return res.status(200).json({
      success: 'success',
      user
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'this user not exist'
    });
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.updateLanLot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id },
      {
        lat: req.body.lat,
        lon: req.body.lon
      },
      { new: true }
    );
    return res.status(200).json({
      success: 'success',
      user
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'this user not exist'
    });
  }
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});