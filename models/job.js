'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for jobs. */

class Job {
	/** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */
	static async create({ title, salary, equity, company_handle }) {
		const duplicateCheck = await db.query(
			`SELECT title, company_handle
       FROM jobs
       WHERE title = $1 AND company_handle = $2`,
			[ title, company_handle ]
		);

		if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate job: ${title}`);

		const result = await db.query(
			`INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING title, salary, equity, company_handle AS "companyHandle"
            `,
			[ title, salary, equity, company_handle ]
		);
		const job = result.rows[0];
		return job;
	}

	/** Find all jobs.
     * 
     * Can pass in a filter object that follows the schema for searchJobs { title, minSalary, hasEquity }
        *  Returns all jobs if filter is left blank
     * 
     * Returns [{ title, salary, equity, companyHandle}, ...]
     */

	static async findAll(filters = {}) {
		let query = `SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
                    FROM jobs`;

		/** values array will be used as parameters in final query
         * extenders array will be used as WHERE expressions
        */

		let values = [];
		let extenders = [];

		const { title, minSalary, hasEquity } = filters;

		// Minimum salary must be greater than 0
		if (minSalary < 0) {
			throw new BadRequestError('Minimum salary must be greater than 0');
		}

		// Set minimum salary
		if (minSalary) {
			values.push(minSalary);
			extenders.push(`salary >= $${values.length}`);
		}

		// Only include jobs with equity, otherwise include all
		if (hasEquity) {
			values.push(0);
			extenders.push(`equity > $${values.length}`);
		}

		// Search titles, case insensitive
		if (title) {
			values.push(`%${title}%`);
			extenders.push(`title ILIKE $${values.length}`);
		}

		// Build query string
		if (extenders.length > 0) {
			query += ' WHERE ' + extenders.join(' AND ');
		}

		// Order data
		query += ' ORDER BY title';
		const jobs = await db.query(query, values);

		return jobs.rows;
	}

	/** Given a job title, return info about the job.
     * 
     * Returns { title, salary, equity, companyHandle}
     * 
     * Throws NotFoundError if not found
     */

	static async get(title) {
		const jobRes = await db.query(
			`SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
                    FROM jobs
                    WHERE title = $1`,
			[ title ]
		);
		const job = jobRes.rows[0];
		if (!job) throw new NotFoundError(`No job title: ${title}`);

		return job;
	}

	/** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */
	static async update(title, data) {
		const { setCols, values } = sqlForPartialUpdate(data, { companyHandle: 'company_handle' });
		const titleVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE title = ${titleVarIdx} 
                      RETURNING title, 
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
		const result = await db.query(querySql, [ ...values, title ]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${title}`);

		return job;
	}

	/** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

	static async remove(title) {
		const result = await db.query(
			`DELETE
           FROM jobs
           WHERE title = $1
           RETURNING title`,
			[ title ]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${title}`);
	}
}

module.exports = Job;
