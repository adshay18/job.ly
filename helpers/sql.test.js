const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

describe('Creates columns and values', function() {
	test('Changes camelCase to SQL syntax and sets to variable value', function() {
		const data = { firstName: 'Test', lastName: 'User', age: 1 };
		const jsSql = { firstName: 'first_name', lastName: 'last_name', age: 'age' };
		const updated = sqlForPartialUpdate(data, jsSql);
		expect(updated.setCols).toEqual('"first_name"=$1, "last_name"=$2, "age"=$3');
	});
	test('Creates array of values', function() {
		const data = { firstName: 'Test', lastName: 'User', age: 1 };
		const jsSql = { firstName: 'first_name', lastName: 'last_name', age: 'age' };
		const updated = sqlForPartialUpdate(data, jsSql);
		expect(updated.values).toEqual([ 'Test', 'User', 1 ]);
	});

	test('Handles no data', () => {
		const data = {};
		const jsSql = { firstName: 'first_name', lastName: 'last_name', age: 'age' };
		function noData() {
			sqlForPartialUpdate(data, jsSql);
		}

		// Test that the error message says "No data" somewhere
		expect(noData).toThrowError('No data');

		// Test that we get a BadRequestError
		expect(noData).toThrowError(BadRequestError);
	});
});
