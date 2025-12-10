// routes/supervisor.js (Your file)

const express = require('express');
const supervisorController = require('../controllers/supervisor');
const isAuth = require('../middleware/is-auth'); 

const router = express.Router();

// GET /supervisor/projects/pending (CORRECT for fetching the list)
router.get('/projects/pending', isAuth, supervisorController.getPendingProjects);

// 🔑 FIX: Update POST route to match front-end URL structure
// POST /supervisor/projects/:projectId/review
router.post('/projects/:projectId/review', isAuth, supervisorController.reviewProject);

module.exports = router;