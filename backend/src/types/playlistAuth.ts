import { Request } from "express";

export interface playlistAuth extends Request {
	user: any
}