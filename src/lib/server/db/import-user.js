import * as dotenv from 'dotenv';
import { db } from './client.js';
import { users } from './schema.js';
import { promises as fs } from 'node:fs';

dotenv.config();
// console.log(process.env.DB_URL);
const filePath = 'users.json';
// let result = await db.select().from(users);
// console.log(result);
// result = await db.select().from(posts);
// console.log(result);
function convertStringToDate(value) {
	if (value === null) {
		return null;
	}
	const date = new Date(value * 1000);
	if (isNaN(date.getTime())) {
		return null;
	}
	return date;
}

function convertStringToType(value) {
	if (value === 'true') {
		return true;
	} else if (value === 'false') {
		return false;
	} else if (!isNaN(value) && tvalue.trim() !== '') {
		return Number(value);
	} else if (value === 'null') {
		return null;
	} else {
		return value;
	}
}

fs.readFile(filePath, 'utf8').then(async (data) => {
	const users_data_from_json = JSON.parse(data);
	users_data_from_json.forEach((user) => {
		user['created_at'] = convertStringToDate(user['created_at']);
		user['updated_at'] = convertStringToDate(user['updated_at']);
		user['silenced_till'] = convertStringToDate(user['silenced_till']);
		user['groups'] = JSON.stringify(user['groups']);
	});
	// for (const user of users_json) {
	await db.insert(users).values(users_data_from_json); //.onConflictDoUpdate({ target: users.id, set: user });
	// }
});
