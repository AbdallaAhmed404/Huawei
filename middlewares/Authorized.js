const jwt = require("jsonwebtoken");
const util = require('util');
const asyncverify = util.promisify(jwt.verify);
const customError = require('../customError');

const authorized = async (req, res, next) => {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith("Bearer ")) {
        return next(customError({
            statusCode: 401,
            message: "Authorization token is missing or invalid"
        }));
    }

    const token = bearer.split(" ")[1]; 

    try {
        const decoded = await asyncverify(token, process.env.JWT_SECRET || 'key');

        if (decoded.id !== req.params.id) {
            return next(customError({
                statusCode: 403,
                message: "You are not authorized to access this resource"
            }));
        }

        req.user = decoded; 
        next();
    } catch (error) {
        return next(customError({
            statusCode: 401,
            message: "Invalid or expired token"
        }));
    }
};

module.exports = authorized;
