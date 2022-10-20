import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import User, { userInterface } from "../models/userModel";
import { ObjectId } from "mongoose";

// Generate JWT
function generateToken(id: string) {
	return jwt.sign({ id }, process.env.JWT_SECRET as string, {
		expiresIn: "30d"
	})
}

// @desc	Create new user
// @route	POST /api/user/
// @access	Public
const userRegister = asyncHandler(async (req: Request<{ playlistId: string; }, any, any, qs.ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>) => {

	const { name, email, password } = req.body;

	if (!name || !email || !password) {
		res.status(400);
		throw new Error("Please add all fields");
	}

	// Check if user exists
	const userExists = await User.findOne({ email });

	if (userExists) {
		res.status(400);
		throw new Error("User already exists");
	}

	// Hash password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	// Create user
	const user = await User.create({
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
	} else {
		res.status(400);
		throw new Error("Invalid user data");
	}
})

// @desc	Authenticate a user
// @route	POST /api/user/login
// @access	Public
const userLogin = asyncHandler(async (req: Request<{ playlistId: string; }, any, any, qs.ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>) => {

	const { email, password } = req.body;

	// Check for user email
	const user = await User.findOne({ email });

	if (user && (await bcrypt.compare(password, user.password))) {
		res.status(201).json({
			_id: user.id,
			name: user.name,
			email: user.email,
			token: generateToken(user._id)
		});
	} else {
		res.status(400);
		throw new Error("Invalid credentials");
	}
})

// @desc	Get user data
// @route	GET /api/user/me
// @access	Private
const userGet = asyncHandler(async (req: any, res: Response<any, Record<string, any>>) => {
	const { _id, name, email } = await User.findById(req.user.id) as (userInterface & { _id: ObjectId; })

	res.status(200).json({
		id: _id,
		name,
		email
	})
})



export {
	userRegister,
	userLogin,
	userGet
}