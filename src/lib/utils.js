import { PUBLIC_POST_ID_LENGTH } from '$env/static/public';
import { generateRandomString } from '@oslojs/crypto/random';
import { browser } from '$app/environment';
import { dbDexie } from '$lib/db-dexie.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

const random = {
	read(bytes) {
		crypto.getRandomValues(bytes);
	}
};

export function GenerateId(length) {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return generateRandomString(random, alphabet, length);
}

export function GeneratePostId() {
	return GenerateId(PUBLIC_POST_ID_LENGTH);
}

export function MakeEnum(arr) {
	let obj = Object.create(null);
	for (let val of arr) {
		obj[val] = Symbol(val);
	}
	return Object.freeze(obj);
}

export function GetEnumName(enumObj, value) {
	for (const key in enumObj) {
		if (enumObj[key] === value) {
			return key;
		}
	}
	throw new Error(`Unknown value ${value}`);
	// return null;
}

export const SyncStatus = MakeEnum([
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

export function Sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms ?? 200));
}

export const USER_ID_NOT_LOGGED_IN = -1;

export function SetOnlineIndicator(isOnline) {
	if (browser) {
		const statusElement = document.getElementById('online-status');
		if (isOnline) {
			// console.log('online');
			if (statusElement) {
				statusElement.textContent = 'online';
				statusElement.classList.add('online');
				statusElement.classList.remove('offline');
			}
		} else {
			// console.log('offline');
			if (statusElement) {
				statusElement.textContent = 'offline';
				statusElement.classList.add('offline');
				statusElement.classList.remove('online');
			}
		}
	}
}

export async function getUser(user_id) {
	try {
		return await dbDexie.users.get(parseInt(user_id));
	} catch (e) {
		console.log('getUser error', user_id, e);
	}
}

export function display_time(d) {
	dayjs.extend(relativeTime);
	return dayjs(dayjs(d)).fromNow();
}
