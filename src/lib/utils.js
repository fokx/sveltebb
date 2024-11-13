import { generateId } from 'lucia';
import { PUBLIC_DEXIE_ID_LENGTH } from '$env/static/public';

export function gen_todo_id() {
	return generateId(PUBLIC_DEXIE_ID_LENGTH);
}
export function make_enum(arr){
	let obj = Object.create(null);
	for (let val of arr){
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
export const SyncStatus = make_enum(['local', 'divergent', 'syncing', 'synced', 'unknown', 'empty','error', 'just_synced', 'failed']);
export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms ?? 200));
}
