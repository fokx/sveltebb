import { PUBLIC_POST_ID_LENGTH } from '$env/static/public';
import { generateRandomString } from '@oslojs/crypto/random';

const random = {
	read(bytes) {
		crypto.getRandomValues(bytes);
	}
};

export function generateId(length) {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return generateRandomString(random, alphabet, length);
}

export function gen_post_id() {
	return generateId(PUBLIC_POST_ID_LENGTH);
}

export function make_enum(arr) {
	let obj = Object.create(null);
	for (let val of arr) {
		obj[val] = Symbol(val);
	}
	return Object.freeze(obj);
}

export function getEnumName(enumObj, value) {
	for (const key in enumObj) {
		if (enumObj[key] === value) {
			return key;
		}
	}
	throw new Error(`Unknown value ${value}`);
	// return null;
}

export const SyncStatus = make_enum([
	'local',
	'divergent',
	'syncing',
	'synced',
	'unknown',
	'empty',
	'error',
	'just_synced',
	'failed'
]);

export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms ?? 200));
}
