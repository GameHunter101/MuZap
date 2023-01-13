"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userGet = exports.userLogin = exports.userRegister = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const userModel_1 = __importDefault(require("../models/userModel"));
// Generate JWT
function generateToken(id) {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d"
    });
}
// @desc	Create new user
// @route	POST /api/user/
// @access	Public
const userRegister = (0, express_async_handler_1.default)(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please add all fields");
    }
    // Check if user exists
    const userExists = await userModel_1.default.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }
    // Hash password
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    // Create user
    const user = await userModel_1.default.create({
        name,
        email,
        password: hashedPassword
    });
    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    }
    else {
        res.status(400);
        throw new Error("Invalid user data");
    }
});
exports.userRegister = userRegister;
// @desc	Authenticate a user
// @route	POST /api/user/login
// @access	Public
const userLogin = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    // Check for user email
    const user = await userModel_1.default.findOne({ email });
    if (user && (await bcryptjs_1.default.compare(password, user.password))) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    }
    else {
        res.status(400);
        throw new Error("Invalid credentials");
    }
});
exports.userLogin = userLogin;
// @desc	Get user data
// @route	GET /api/user/me
// @access	Private
const userGet = (0, express_async_handler_1.default)(async (req, res) => {
    const { _id, name, email } = await userModel_1.default.findById(req.user.id);
    res.status(200).json({
        id: _id,
        name,
        email
    });
});
exports.userGet = userGet;
