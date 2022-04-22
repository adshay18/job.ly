'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Company = require('./company.js');
const Job = require('./job.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/** Create new job */

describe('create job', function() {
	const newJob = {
		title: 'New Assistant',
		salary: 45000,
		equity: 0.01,
		companyHandle: 'c2'
	};

	test('works', async function() {
		let job = await Job.create(newJob);
		expect(job).toEqual({
			title: 'New Assistant',
			salary: 45000,
			equity: '0.01',
			companyHandle: 'c2'
		});

		const res = await db.query(`SELECT title FROM jobs WHERE title = 'New Assistant'`);
		expect(res.rows[0]).toEqual({ title: 'New Assistant' });
	});

	test('bad request', async function() {
		const duplicateJob = {
			title: 'j1',
			salary: 12,
			equity: 0,
			companyHandle: 'c2'
		};
		try {
			await Job.create(duplicateJob);
			await Job.create(duplicateJob);
		} catch (err) {
			expect(err.status).toEqual(400);
			expect(err.message).toEqual('Duplicate job: j1');
		}
	});
});

/** Find all jobs */

describe('findAll', function() {
	test('works: no filter', async function() {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				title: 'j1',
				salary: 35000,
				equity: '0',
				companyHandle: 'c1'
			},
			{
				title: 'j2',
				salary: 95000,
				equity: '0.08',
				companyHandle: 'c2'
			}
		]);
	});

	test('filter works', async function() {
		let jobs = await Job.findAll({ title: 'j', minSalary: 34000, hasEquity: false });
		expect(jobs).toEqual([
			{
				title: 'j1',
				salary: 35000,
				equity: '0',
				companyHandle: 'c1'
			},
			{
				title: 'j2',
				salary: 95000,
				equity: '0.08',
				companyHandle: 'c2'
			}
		]);
	});

	test('filter equity', async function() {
		let jobs = await Job.findAll({ hasEquity: true });
		expect(jobs).toEqual([
			{
				title: 'j2',
				salary: 95000,
				equity: '0.08',
				companyHandle: 'c2'
			}
		]);
	});
});

/** Job.get() */

describe('get', function() {
	test('works', async function() {
		let job = await Job.get('j1');
		expect(job).toEqual({
			title: 'j1',
			salary: 35000,
			equity: '0',
			companyHandle: 'c1'
		});
	});

	test('404 if not found', async function() {
		try {
			await Job.get('halo');
		} catch (err) {
			expect(err.status).toEqual(404);
		}
	});
});

/** Update job */

describe('update', function() {
	const data = {
		title: 'J1',
		salary: 50000
	};

	test('works, even with null fields', async function() {
		let job = await Job.update('j1', data);
		expect(job).toEqual({
			title: 'J1',
			salary: 50000,
			equity: '0',
			companyHandle: 'c1'
		});

		const result = await db.query(`SELECT title FROM jobs WHERE title = 'J1'`);
		expect(result.rows[0]).toEqual({ title: 'J1' });
	});

	test('404 if not found', async function() {
		try {
			let job = await Job.update('j999', data);
		} catch (err) {
			expect(err.status).toEqual(404);
		}
	});

	test('bad request with no data', async function() {
		try {
			let job = await Job.update('j1', {});
		} catch (err) {
			expect(err.status).toEqual(400);
		}
	});
});

/** Remove job */

describe('remove', function() {
	test('works', async function() {
		await Job.remove('j1');
		const res = await db.query("SELECT title FROM jobs WHERE title='j1'");
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such job', async function() {
		try {
			await Job.remove('halo');
		} catch (err) {
			expect(err.status).toEqual(404);
		}
	});
});
