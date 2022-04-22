'use strict';

const db = require('../db.js');
const User = require('../models/user');
const Company = require('../models/company');
const { createToken } = require('../helpers/tokens');
const Job = require('../models/job.js');

let idArr = [];

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM users');
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM companies');

	await Company.create({
		handle: 'c1',
		name: 'C1',
		numEmployees: 1,
		description: 'Desc1',
		logoUrl: 'http://c1.img'
	});
	await Company.create({
		handle: 'c2',
		name: 'C2',
		numEmployees: 2,
		description: 'Desc2',
		logoUrl: 'http://c2.img'
	});
	await Company.create({
		handle: 'c3',
		name: 'C3',
		numEmployees: 3,
		description: 'Desc3',
		logoUrl: 'http://c3.img'
	});

	await User.register({
		username: 'u1',
		firstName: 'U1F',
		lastName: 'U1L',
		email: 'user1@user.com',
		password: 'password1',
		isAdmin: false
	});
	await User.register({
		username: 'u2',
		firstName: 'U2F',
		lastName: 'U2L',
		email: 'user2@user.com',
		password: 'password2',
		isAdmin: false
	});
	await User.register({
		username: 'u3',
		firstName: 'U3F',
		lastName: 'U3L',
		email: 'user3@user.com',
		password: 'password3',
		isAdmin: false
	});
	await Job.create({
		title: 'New Job',
		salary: 50000,
		equity: 0.03,
		companyHandle: 'c1'
	});
	await Job.create({
		title: 'New Job2',
		salary: 500000,
		equity: 0,
		companyHandle: 'c3'
	});
	await Job.create({
		title: 'Librarian',
		salary: 10000,
		equity: 0.99,
		companyHandle: 'c3'
	});

	let result = await db.query(`SELECT id FROM jobs WHERE title = 'Librarian'`);
	let id = result.rows[0].id;
	idArr.push(id);

	await db.query(
		`
		INSERT INTO applications (username, job_id)
		VALUES ('u1', ${idArr[0]}),
				('u2', ${idArr[0]})`
	);
}

async function commonBeforeEach() {
	await db.query('BEGIN');
}

async function commonAfterEach() {
	await db.query('ROLLBACK');
}

async function commonAfterAll() {
	await db.end();
}

const u1Token = createToken({ username: 'u1', isAdmin: false });
const adminToken = createToken({ username: 'Admin', isAdmin: true });

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	adminToken,
	idArr
};
