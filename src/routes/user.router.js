const {
	getAll,
	createUser,
	getOneUser,
	removeUser,
	updateUser,
	verifyCode,
	login,
	getLoggedUser,
} = require("../controllers/user.controllers");
const express = require("express");
const verifyJWT = require("../utils/verifyJWT");

const userRouter = express.Router();

userRouter.route("/").get(verifyJWT, getAll).post(createUser);

userRouter.route("/login").post(login);

userRouter.route("/me").get(verifyJWT, getLoggedUser);

userRouter.route("/verify/:code").get(verifyCode);

userRouter
	.route("/:id")
	.get(verifyJWT, getOneUser)
	.delete(verifyJWT, removeUser)
	.put(verifyJWT, updateUser);

module.exports = userRouter;
