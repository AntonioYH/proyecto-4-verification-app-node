const catchError = require("../utils/catchError");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const EmailCode = require("../models/EmailCode");
const jwt = require("jsonwebtoken");

const getAll = catchError(async (req, res) => {
	const users = await User.findAll();
	return res.json(users);
});

const createUser = catchError(async (req, res) => {
	const {
		email,
		password,
		firstName,
		lastName,
		country,
		image,
		frontBaseUrl,
	} = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);
	const user = await User.create({
		email,
		password: hashedPassword,
		firstName,
		lastName,
		country,
		image,
	});
	const code = require("crypto").randomBytes(32).toString("hex");
	const link = `${frontBaseUrl}/verify_email/${code}`;
	await sendEmail({
		to: email,
		subject: "Verificate email for user app",
		html: `
        <div>
            <h1>Hello ${firstName} ${lastName}</h1>
            <p>Thanks for signing up in user app</p>
            <a href="${link}" target="_BLANK">${link}</a>
            <h3>Thank you</h3>
        </div>
        `,
	});

	EmailCode.create({ code, userId: user.id });

	return res.status(201).json({ user, message: "email sent succesfully" });
});

const getOneUser = catchError(async (req, res) => {
	const { id } = req.params;
	const user = await User.findByPk(id);
	if (!user) return res.sendStatus(404);
	return res.json(user);
});

const removeUser = catchError(async (req, res) => {
	const { id } = req.params;
	await User.destroy({ where: { id } });
	return res.sendStatus(204);
});

const updateUser = catchError(async (req, res) => {
	const { id } = req.params;
	const { firstName, lastName, country, image } = req.body;
	const userUpdated = await User.update(
		{
			firstName,
			lastName,
			country,
			image,
		},
		{ where: { id }, returning: true }
	);
	return res.json(userUpdated);
});

const verifyCode = catchError(async (req, res) => {
	const { code } = req.params;
	const codeFound = await EmailCode.findOne({ where: { code } });
	if (!codeFound) return res.status(404).json({ message: "Invalid Code" });
	const user = await User.update(
		{ isVerified: true },
		{ where: { id: codeFound.userId }, returning: true }
	);

	await codeFound.destroy();
	return res.json(user);
});

const login = catchError(async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ where: { email } });
	if (!user) return res.status(401).json({ message: "Invalid credentials" });
	const isValidPassword = await bcrypt.compare(password, user.password);
	if (!isValidPassword)
		return res.status(401).json({ message: "Invalid credentials" });
	if (!user.isVerified)
		return res.status(401).json({ message: "Invalid credentials" });

	const token = jwt.sign({ user }, process.env.TOKEN_SECRET, {
		expiresIn: "1d",
	});

	return res.json({ user, token });
});

const getLoggedUser = catchError(async (req, res) => {
	const user = req.user;
	return res.json(user);
});

module.exports = {
	getAll,
	createUser,
	getOneUser,
	removeUser,
	updateUser,
	verifyCode,
	login,
	getLoggedUser,
};
