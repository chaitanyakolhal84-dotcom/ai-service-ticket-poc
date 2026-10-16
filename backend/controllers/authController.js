
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing in .env file");
    }

    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

// REGISTER
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        if (typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Public registration always creates a customer.
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "customer",
        });

        const token = generateToken(user);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};

// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        }).select("+password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};

module.exports = {
    register,
    login,
};
