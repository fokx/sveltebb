<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import { liveQuery } from 'dexie';
	import Post from '$lib/components/post.svelte';

	let { data } = $props();
	console.log(data.slug);
	let postsLocal = liveQuery(() =>
		dbDexie.posts.filter(t => t.main_post_id === data.slug).toArray()
	);

	let post_main = $state();
	let posts_replies = $state();

	postsLocal.subscribe((posts_local) => {
			post_main = posts_local.filter(t => t.is_main_post)[0];
			posts_replies = posts_local.filter(t => !t.is_main_post);
		}
	);
</script>
{#if post_main}
	<Post post={post_main} />
	{#each posts_replies as post, index (post.id)}
		<Post post={post} />
	{/each}
{:else}
	<p>Post not found</p>
{/if}

