import { error } from '@sveltejs/kit';

export function load({ params }) {
	const slug = params.slug;

	return {
		slug
	};
}
