const { BadRequestError } = require('../expressError');

/** Returns object that separates the columns to be updated and their respective values mapped to an array to use for a SQL database update
*This method protects against SQL injection attacks
* dataToUpdate can include the following, but not all are required:
   *   { firstName, lastName, password, email, isAdmin }
* jsToSql should include camelCase names as keys paired with values that correspond to columns in the db we are updating
  * ex:
  * {firstName: first_name}
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError('No data');

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

	return {
		setCols: cols.join(', '),
		values: Object.values(dataToUpdate)
	};
}
/**
 * sqlForPartialUpdate({firstName: 'Aliya', age: 32}, {firstName: 'first_name', age: 'age'})
 * => {setCols: '"first_name"=$1, "age"=$2',
 *      values: ['Aliya', 32]}
 */

// Only function in this file so include as const sqlForPartialUpdate = require('PATH') or {sqlForPartialUpdate} = requrie('PATH')
module.exports = { sqlForPartialUpdate };
