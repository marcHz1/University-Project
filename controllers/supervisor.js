const { validationResult } = require('express-validator');
const prisma = require('../prisma'); 
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'themarcsimon2004@gmail.com',
    pass: process.env.GMAIL_APP_PASS
  }
});

// 🔑 NEW: Email Helper Function
const sendEmailNotification = async (to, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            to: to,
            from: 'themarcsimon2004@gmail.com',
            subject: subject,
            html: htmlContent
        });
        console.log(`Review email sent successfully to ${to}.`);
    } catch (error) {
        console.error('Error sending review email:', error);
        // Log the error but do NOT throw it, so the database update still succeeds.
    }
};


// Controller to get all projects with PENDING status FOR THE LOGGED-IN SUPERVISOR
exports.getPendingProjects = async (req, res, next) => {
    const supervisorId = parseInt(req.user.id); 

    try {
        const projects = await prisma.project.findMany({
            where: { 
                status: 'pending', 
                supervisorId: supervisorId
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, year: true }
                },
                supervisor: { 
                    select: { id: true, name: true, email: true } 
                }
            },
            orderBy: { id: 'asc' }
        });

        return res.status(200).json({
            message: 'Pending projects fetched successfully',
            projects
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

// Controller to accept or decline a project (UPDATED)
// Controller to accept or decline a project (UPDATED)
exports.reviewProject = async (req, res, next) => {
    const projectId = parseInt(req.params.projectId); 
    console.log(req.params.projectId);
    const { action, comment } = req.body; 
    const supervisorId = parseInt(req.user.id); // Logged-in supervisor's ID

    if (action !== 'ACCEPT' && action !== 'DECLINE') {
        return res.status(400).json({ message: 'Invalid action. Must be ACCEPT or DECLINE.' });
    }
    
    const newStatus = action === 'ACCEPT' ? 'accepted' : 'rejected'; 

    try {
        // 1. Fetch project with student and supervisor details
        // We include 'supervisorId' here for the security check below
        const projectToReview = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                supervisor: { select: { name: true } }
            }
        });

        if (!projectToReview) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        
        // 🔑 IMPROVEMENT 1: Authorization Check
        // Ensure the logged-in supervisor is the assigned supervisor for this project
        // Note: Project model must have a supervisorId field for this to work.
        if (projectToReview.supervisorId !== supervisorId) {
             // 403 Forbidden is the correct status code for an authorization failure
            return res.status(403).json({ message: 'Forbidden. You are not authorized to review this project.' });
        }

        if (projectToReview.status !== 'pending') {
            return res.status(400).json({ message: `Project is already ${projectToReview.status}` });
        }

        // 2. Update the project status AND save the comment
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                status: newStatus,
                // 🔑 IMPROVEMENT 2: Save the comment to the database.
                // Assuming your Project model has a field named 'reviewComment' (type String)
                reviewComment: comment || null, 
            },
            include: { user: true, supervisor: true }
        });

        // 3. Send email notification (rest of the logic is correct)
        const student = updatedProject.user;
        const supervisorName = updatedProject.supervisor.name || 'Your Supervisor';
        // ... (email logic remains the same)
        
        const emailSubject = `Project Review Update: ${newStatus.toUpperCase()}`;
        
        let emailHtml = `
            <p>Dear ${student.name},</p>
            <p>Your project titled <strong>"${updatedProject.title}"</strong> has been reviewed by ${supervisorName}.</p>
            <h3 style="color: ${newStatus === 'accepted' ? 'green' : 'red'};">Status: ${newStatus.toUpperCase()}</h3>
        `;
        
        if (comment) {
            emailHtml += `<p><strong>Supervisor's Comments:</strong></p><blockquote style="border-left: 4px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">${comment}</blockquote>`;
        }
        
        emailHtml += `<p>Thank you.</p>`;

        await sendEmailNotification(student.email, emailSubject, emailHtml);


        return res.status(200).json({
            message: `Project ${updatedProject.status} successfully. Student notified.`,
            project: updatedProject
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};