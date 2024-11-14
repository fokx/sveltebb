<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import { liveQuery } from 'dexie';
	import Post from '$lib/components/post.svelte';

	let { data } = $props();
	console.log(data.slug);
	let postsLocal = liveQuery(() =>
		dbDexie.posts.filter(t => t.main_post_id === data.slug).toArray()
	);

	let main_post = $state();
	let reply_posts = $state();

	postsLocal.subscribe((posts_local) => {
			main_post = posts_local.filter(t => t.is_main_post)[0];
			reply_posts = posts_local.filter(t => !t.is_main_post);
		}
	);
</script>
{#if main_post}
	<Post post={main_post} />
	{#each reply_posts as post, index (post.id)}
		<Post post={post} />
	{/each}
{:else}
	<p>Post not found</p>
{/if}

