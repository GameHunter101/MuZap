"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const userModel_1 = __importDefault(require("../models/userModel"));
const protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Get user from the token
            req.user = await userModel_1.default.findById(decoded.id).select("-password");
            next();
        }
        catch (error) {
            res.status(401);
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("Not authorized, access token expired!");
            }
            else {
                console.log(error);
                throw new Error("Not authorized!");
            }
        }
    }
    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token.");
    }
});
exports.default = { protect };
