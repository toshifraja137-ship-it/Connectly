const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const registerUser = async (req, res) => {
    try {
        let { name, username, email, password } = req.body;

        // 1. Check required fields
        if (!name || !username || !email || !password) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // 2. Normalize input
        name = name.trim();
        username = username.trim().toLowerCase();
        email = email.trim().toLowerCase();

        // 3. Validate name
        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({
                message: "Name must be between 2 and 50 characters"
            });
        }

        // 4. Validate username
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            return res.status(400).json({
                message: "Username must be 3-20 characters and contain only letters, numbers, and underscores"
            });
        }

        // 5. Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // 6. Validate password
        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long"
            });
        }

        // 7. Check existing user
        const existingUser = await User.findOne({
            $or: [
                { email },
                { username }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or username already exists"
            });
        }

        // 8. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 9. Create user
        const user = await User.create({
            name,
            username,
            email,
            password: hashedPassword
        });

        // 10. Send response
        return res.status(201).json({
            message: "Account created successfully!",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email or username already exists"
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        // 2. Find user by email
        // Password is excluded by default in our User schema,
        // so we explicitly include it here.
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // 3. Compare entered password with stored hash
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 5. Send response
        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = { 
    registerUser,
    loginUser
 };