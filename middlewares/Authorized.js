const jwt = require("jsonwebtoken");
const util = require('util');
const asyncverify = util.promisify(jwt.verify);
const customError = require('../customError'); // تأكد من المسار

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

        // أضفنا التحقق من وجود id في الـ token
        if (!decoded.id) {
            return next(customError({
                statusCode: 401,
                message: "Invalid token payload"
            }));
        }

        // تخزين بيانات المستخدم في الطلب لاستخدامها في الـ Controller
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