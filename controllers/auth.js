const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
require('dotenv').config();

// const transporter = nodemailer.createTransport(sendgridTransport({
//   auth: {
//     api_key: process.env.SENDGRID_API_KEY,
//   },
// }));
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'themarcsimon2004@gmail.com',
    pass: process.env.GMAIL_APP_PASS
  }
});

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { name, cardNumber, year, email, password } = req.body;

  if (year < 1 || year > 5) {
    return res.status(400).json({ message: 'Choose a year between 1 and 5' });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { cardNumber }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or card number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cardNumber,
        year,
        role: 'STUDENT', // 🔑 FIX 1: Set default role for new signups
      },
    });

    try {
      await transporter.sendMail({
        to: email,
        from: process.env.EMAIL_FROM,
        subject: '🎓 Welcome to Aleppo University – Graduation Project Portal',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; color: #333;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <h2 style="color: #003366;">Welcome, ${name}!</h2>
              <p>
                We’re excited to have you on board as you begin your <strong>graduation project journey</strong> at Aleppo University.
              </p>
              <p>
                Please log in to your account and <strong>choose a date</strong> for your project presentation.
              </p>
              <p>
                Once you’ve selected a date, your supervising professor will review and confirm it.
              </p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
              <p style="font-size: 14px; color: #666;">
                Best of luck on your project — we look forward to seeing your great work! 🎉
              </p>
              <p style="font-size: 14px; color: #003366;">
                — Aleppo University Graduation Committee
              </p>
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.warn('Email not sent:', mailError.message);
    }

    return res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const loadedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!loadedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, loadedUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong email or password' });
    }

    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser.id,
        role: loadedUser.role, // 🔑 FIX 2: Add role to the JWT payload
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'User logged in successfully',
      token,
      userId: loadedUser.id,
      name: loadedUser.name,
      email: loadedUser.email,
      role: loadedUser.role, // 🔑 FIX 3: Add role to the response body for the frontend
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.signout = (req, res, next) => {
    return res.status(200).json({
        message: 'User signed out successfully',
        token: null
    });
};