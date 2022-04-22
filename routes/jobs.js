'use strict';

/** Routes for jobs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn, isLoggedInAdmin } = require('../middleware/auth');
const Job = require('../models/job');

const newJobSchema = require('../schemas/newJob.json');
const searchJobsSchema = require('../schemas/searchJobs.json');
// const companyUpdateSchema = require('../schemas/companyUpdate.json');

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
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
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
