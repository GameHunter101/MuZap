import express from "express";
import * as userController from "../controllers/userController";
import protect from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", userController.userRegister);
router.post("/login", userController.userLogin);
router.get("/me", protect.protect, userController.userGet);

module.exports = router;