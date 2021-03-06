'use strict';

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const { UnauthorizedError } = require('../expressError');

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
	try {
		const authHeader = req.headers && req.headers.authorization;
		if (authHeader) {
			const token = authHeader.replace(/^[Bb]earer /, '').trim();
			res.locals.user = jwt.verify(token, SECRET_KEY);
		}
		return next();
	} catch (err) {
		return next();
	}
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
	try {
		if (!res.locals.user) throw new UnauthorizedError('Unauthorized - Please login');
		return next();
	} catch (err) {
		return next(err);
	}
}

/** Middleware to ensure a user is logged in and an Admin.
 * 
 * If not, raises Unauthorized.
 */

function isLoggedInAdmin(req, res, next) {
	try {
		if (!res.locals.user || !res.locals.user.isAdmin) {
			throw new UnauthorizedError('Unauthorized - Must be logged in to an admin account');
		}
		return next();
	} catch (err) {
		return next(err);
	}
}

/** Middleware to ensure user is editing their own data, or user is an Admin
 * 
 * If not, raises Unauthorized.
 */

function adminOrCorrectUser(req, res, next) {
	try {
		const user = res.locals.user;
		if (!user) {
			throw new UnauthorizedError('Unauthorized - please login');
		}
		if (!(user.isAdmin || user.username === req.params.username)) {
			throw new UnauthorizedError(`Unauthorized - changes can only be made by ${user.username} or an Admin`);
		}
		return next();
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	authenticateJWT,
	ensureLoggedIn,
	isLoggedInAdmin,
	adminOrCorrectUser
};
