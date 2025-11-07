const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put('/', [
    body('email')
    .isEmail()
    .withMessage('Please Enter a Valid Email')
    .normalizeEmail(),
    body('password')
    .trim()
    .isLength({min: 6})
    .withMessage('Password should be at least 6 characters')
    .isStrongPassword()
    .withMessage('Password should have: a capital letter, numbers, special character'),
    body('name')
    .not()
    .isEmpty(),
    body('cardNumber')
    .not()
    .isEmpty(),
    body('year')
    .not()
    .isEmpty()
],authController.signup);


router.post('/',[
    body('email')
    .isEmail()
    .withMessage('Enter a Valid Email')
    ,body('password')
    .isLength({min: 6})
], authController.login);

router.post('/signout', isAuth, authController.signout);




module.exports = router;