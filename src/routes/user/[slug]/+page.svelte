<script>
	import PostList from '$lib/components/post-list.svelte';
	import { dbDexie } from '$lib/db-dexie.js';
	import User from '$lib/components/user.svelte';

	let { data } = $props();

	async function get_post_list() {
		if (Number.isInteger(Number(data.slug))) {
			let user = await dbDexie.users.get(Number(data.slug));
			if (user) {
				let posts = await dbDexie.posts.filter(t => t.user_id === user.id).toArray();
				let posts_original = posts.filter(t => t.is_main_post);
				let posts_replies = posts.filter(t => !t.is_main_post);
				return { posts_original, posts_replies };
			}
		}
	}

</script>
{#await get_post_list()}
	<p></p>
{:then { posts_original, posts_replies }}
	<h2>Posts by user
		<User data={data} user_id={data.slug} />
	</h2>
	<h3>Original Posts</h3>
	<PostList data={data} postList={posts_original} show_author={false} />
	<h3>Replies</h3>
	<PostList data={data} postList={posts_replies} show_author={false} />
{:catch error}
	<p style="color: red">User <code>{data.slug}</code> not found with {error.message}</p>
{/await}



