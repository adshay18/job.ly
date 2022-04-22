'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	adminToken
} = require('./_testCommon');
const Job = require('../models/job');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/** POST /jobs */

describe('POST /jobs', function() {
	const newJob = {
		title: 'New Job',
		salary: 55000,
		equity: 0,
		companyHandle: 'c2'
	};

	test('ok for admins', async function() {
		const resp = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: {
				title: 'New Job',
				salary: 55000,
				equity: '0',
				companyHandle: 'c2'
			}
		});
	});

	test('bad request with missing data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'new',
				salary: 5
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request with invalid data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'New Job',
				salary: 55000,
				equity: 'big equity',
				companyHandle: 'c2'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/**** GET /jobs */

describe('GET /jobs', function() {
	test('ok for anon', async function() {
		const resp = await request(app).get('/jobs');
		expect(resp.body).toEqual({
			jobs: [
				{
					title: 'Librarian',
					salary: 10000,
					equity: '0.99',
					companyHandle: 'c3'
				},
				{
					title: 'New Job',
					salary: 50000,
					equity: '0.03',
					companyHandle: 'c1'
				},
				{
					title: 'New Job2',
					salary: 500000,
					equity: '0',
					companyHandle: 'c2'
				}
			]
		});
	});

	test('fails: test next() handler', async function() {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query('DROP TABLE jobs CASCADE');
		const resp = await request(app).get('/jobs').set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

/****** GET /jobs/:title */

describe('GET /jobs/:title', function() {
	test('works for anon', async function() {
		const resp = await request(app).get(`/jobs/Librarian`);
		expect(resp.body).toEqual({
			job: {
				title: 'Librarian',
				salary: 10000,
				equity: '0.99',
				companyHandle: 'c3'
			}
		});
	});

	test('not found for no such job', async function() {
		const resp = await request(app).get(`/jobs/nope`);
		expect(resp.statusCode).toEqual(404);
	});
});

/******* PATCH /jobs/:title */

describe('PATCH /jobs/:title', function() {
	test('works for admins', async function() {
		const resp = await request(app)
			.patch(`/jobs/Librarian`)
			.send({
				title: 'Bookguy'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			job: {
				title: 'Bookguy',
				salary: 10000,
				equity: '0.99',
				companyHandle: 'c3'
			}
		});
	});

	test('unauth for anon', async function() {
		const resp = await request(app).patch(`/jobs/Librarian`).send({
			title: 'Bookguy'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('not found on no such job', async function() {
		const resp = await request(app)
			.patch(`/jobs/nope`)
			.send({
				title: 'yep'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});

	test('bad request on companyHandle change attempt', async function() {
		const resp = await request(app)
			.patch(`/jobs/Librarian`)
			.send({
				companyHandle: 'c3-new'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request on invalid data', async function() {
		const resp = await request(app)
			.patch(`/jobs/Librarian`)
			.send({
				equity: 'so much equity'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/**** DELETE /jobs/:title */

describe('DELETE /jobs/:title', function() {
	test('works for admins', async function() {
		const resp = await request(app).delete(`/jobs/Librarian`).set('authorization', `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: 'Librarian' });
	});

	test('unauth for anon', async function() {
		const resp = await request(app).delete(`/jobs/Librarian`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found for no such job', async function() {
		const resp = await request(app).delete(`/jobs/nope`).set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});
