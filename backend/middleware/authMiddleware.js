
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        // 1. Get the Authorization header
        const authHeader = req.headers.authorization;

        // 2. Check whether the token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized, token missing"
            });
        }

        // 3. Extract the token
        const token = authHeader.split(" ")[1];

        // 4. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Find the user from the token's ID
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists"
            });
        }

        // 6. Attach user to the request
        req.user = user;

        // 7. Allow the request to continue
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id);

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {protect, optionalAuth};
