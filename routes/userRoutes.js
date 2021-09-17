const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const authguard = require('./../middleware/authGurd');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/filteruser', userController.getfilterusers);

router.get('/getUserdetails/:id', authController.getUserdetails);

router.get('/userbyname', userController.getallusernames);

router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post(
  '/forgotPassword',
  authguard.protect,
  authController.forgotPassword
);
router.patch(
  '/resetPassword/:token',
  authguard.protect,
  authController.resetPassword
);

router.patch('/updatelan/:id', authController.updateLanLot);

router.patch('/updateMe', authguard.protect, userController.updateMe);
router.delete('/deleteMe', authguard.protect, userController.deleteMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(
    // authguard.protect,
    // authguard.restrictTo('admin'),
    userController.updateUser
  )
  .delete(
    // authguard.protect,
    // authguard.restrictTo('admin'),
    userController.deleteUser
  );

module.exports = router;
