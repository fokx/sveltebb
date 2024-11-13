import { read_user } from '$lib/server/read_cookie';

export const handle = async ({ event, resolve }) => {
	if (!event.locals.user) {
		const ext_cookie = event.cookies.get(process.env.COOKIE_NAME);
		if (ext_cookie) {
			let user = read_user(ext_cookie);
			if (user) {
				event.locals.user = user;
				return resolve(event);
			}
		}
	}
	return resolve(event);
};
