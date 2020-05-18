const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
} = require('../controllers/auth');
const users = require('./users');
const router = express.Router();

const { protect } = require('../middleware/auth');

// Re-route to other resource router
router.use('/users', users);

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/getMe').get(protect, getMe);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:resetToken').put(resetPassword);
router.route('/updateDetails').put(protect, updateDetails);
router.route('/updatePassword').put(protect, updatePassword);

module.exports = router;
