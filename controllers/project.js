const { validationResult } = require('express-validator');
// NOTE: Assuming prisma is imported globally or via require('../prisma');

// 🔑 NEW FUNCTION: To fetch all supervisors for the student's dropdown
exports.getSupervisors = async (req, res) => {
    try {
        const supervisors = await prisma.user.findMany({
            where: { role: 'SUPERVISOR' },
            select: { id: true, name: true, email: true }
        });
        return res.status(200).json({ supervisors });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong while fetching supervisors" });
    }
};

exports.createProject = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).json({message: errors.array()[0].msg});
    };
    
    const {title, description, supervisorId} = req.body; 
    // 🔑 FIX: Parse userId to integer
    const userId = parseInt(req.user.id);

    if (!supervisorId) {
        return res.status(400).json({ message: 'Supervisor is required' });
    }
    
    try{
        const parsedSupervisorId = parseInt(supervisorId);

        // Check if supervisor exists and has the correct role
        const supervisor = await prisma.user.findUnique({ where: { id: parsedSupervisorId } });
        if (!supervisor || supervisor.role !== 'SUPERVISOR') {
            return res.status(404).json({ message: 'Invalid or non-supervisor selected' });
        }

        // 🔑 FIX: Use parsed userId
        const existingProject = await prisma.project.findUnique({where: {userId: userId}});
        if(existingProject){
            return res.status(400).json({message: 'You Have already Created a Project'});
        };

        const project = await prisma.project.create({
            data: {
                title,
                description,
                user: {
                    connect: {id: userId}
                },
                supervisor: { 
                    connect: {id: parsedSupervisorId}
                }
            },
            include: {
                 supervisor: {
                    select: { name: true, email: true }
                }
            }
        });
        return res.status(201).json({message: 'Project Created Successfully', project});
    }catch(err){
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

exports.updateProject = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).json({message: errors.array()[0].msg});
    };

    const {title, description} = req.body;
    const userId = parseInt(req.user.id); 

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No data provided for update." });
    }

    try{
        // userId is already parsed here
        const existingProject = await prisma.project.findUnique({where: {userId: userId}});
        
        if(!existingProject){
            return res.status(404).json({message: "Project not found (or you haven't created one)"});
        };

        const updatedProject = await prisma.project.update({
            where: {id: existingProject.id}, 
            data: updateData
        });

        
        return res.status(200).json({message: "Project Updated Successfully", project: updatedProject})
    }catch(err){
        console.log(err);
        return res.status(500).json({ message: "Something went wrong during the project update." });
    }
};

exports.deleteProject = async (req, res) => {
    const userId = parseInt(req.user.id);

    try {
        const project = await prisma.project.findUnique({
            where: { userId }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        await prisma.project.delete({
            where: { id: project.id }
        });

        return res.status(200).json({ message: "Project deleted successfully" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

exports.getMyProject = async (req, res) => {
    const userId = parseInt(req.user.id);

    try {
        const project = await prisma.project.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        year: true
                    }
                },
                supervisor: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ message: "You have not created a project yet" });
        }

        return res.status(200).json({
            message: "Project fetched successfully",
            project
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};