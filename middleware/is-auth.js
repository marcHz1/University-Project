const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authorizationHeader = req.header('Authorization');
    if (!authorizationHeader) {
    const error = new Error('Authorization Header is missing');
    error.statusCode = 401;
    throw error;
    }

    const token = authorizationHeader.split(' ')[1];
    let decodedToken;

    try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
    console.log(err);
    const error = new Error('Invalid token');
    error.statusCode = 401;
    throw error;
    }

    if (!decodedToken) {
    const error = new Error('Not Authenticated');
    error.statusCode = 401;
    throw error;
    }

    req.user = {
    id: decodedToken.userId,
    role: decodedToken.role
    };

next();
};