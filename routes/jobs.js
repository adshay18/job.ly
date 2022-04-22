'use strict';

/** Routes for jobs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn, isLoggedInAdmin } = require('../middleware/auth');
const Job = require('../models/job');

const newJobSchema = require('../schemas/newJob.json');
const searchJobsSchema = require('../schemas/searchJobs.json');
const updateJobSchema = require('../schemas/updateJob.json');

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */
router.post('/', isLoggedInAdmin, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, newJobSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>
 *   { jobs: [ { title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive partial matches)
 * - minSalary
 * - hasEquity (if true, will only show jobs with equity, otherwise all matching jobs will show)
 *
 * Authorization required: none
 */

router.get('/', async function(req, res, next) {
	try {
		const query = req.query;
		if (query.minSalary) query.minSalary = parseInt(query.minSalary);
		if (query.hasEquity) query.hasEquity = Boolean(query.hasEquity);

		const validator = jsonschema.validate(query, searchJobsSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}
		const jobs = await Job.findAll(query);
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

/** GET /[id]  =>  { job }
 *
 *  Job is {  id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get('/:id', async function(req, res, next) {
	try {
		const job = await Job.get(req.params.id);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[title] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch('/:title', isLoggedInAdmin, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, updateJobSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const job = await Job.update(req.params.title, req.body);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[title]  =>  { deleted: title }
 *
 * Authorization: admin
 */

router.delete('/:title', isLoggedInAdmin, async function(req, res, next) {
	try {
		await Job.remove(req.params.title);
		return res.json({ deleted: req.params.title });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
