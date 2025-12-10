const express = require('express');
const { body } = require('express-validator');
const isAuth = require('../middleware/is-auth');

const projectControllers = require('../controllers/project');

const router = express.Router();

router.post('/', isAuth,[
    body('title')
    .isLength({min: 5})
    .withMessage("Title should be at least 5 characters")
    .notEmpty()
    ,
    body('description')
    .isLength({min: 50})
    .withMessage("Description should be at least 50 characters")
    .notEmpty()
] ,projectControllers.createProject);

router.put('/', isAuth,[
    body('title')
    .optional() // 🔑 FIX: Only validate if title is present
    .isLength({min: 5})
    .withMessage("Title should be at least 5 characters")
    .notEmpty()
    ,
    body('description')
    .optional() // 🔑 FIX: Only validate if description is present
    .isLength({min: 50})
    .withMessage("Description should be at least 50 characters")
    .notEmpty()
] ,projectControllers.updateProject);

router.delete('/', isAuth, projectControllers.deleteProject);

router.get('/', isAuth, projectControllers.getMyProject);

router.get('/supervisors', isAuth, projectControllers.getSupervisors);

module.exports = router;