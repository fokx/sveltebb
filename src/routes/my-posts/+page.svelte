<script>
	import PostList from '$lib/components/post-list.svelte';
	import { derived } from 'svelte/store';
	import { liveQuery } from 'dexie';
	import { dbDexie } from '$lib/db-dexie.js';

	/** @type {{ data: import('./$types').PageData }} */
	let { data = $bindable() } = $props();
	let user = $derived(data.user);
	let postListLocal = liveQuery(() =>
		dbDexie.posts.orderBy('id').desc().toArray()
	);

	let postListDeletedMainLocal = $state([]);
	let postListDeletedRepliesLocal = $state([]);
	postListLocal.subscribe((posts) => {
		if (user) {
			postListDeletedMainLocal = posts.filter(t => t.is_main_post).filter(t => t.user_id === user.id);
			postListDeletedRepliesLocal = posts.filter(t => !t.is_main_post).filter(t => t.user_id === user.id);
		}
	});

</script>


<div class="centered">

	<h2>My Posts</h2>
	{#if user}
		<h3>My Main Posts</h3>
		<PostList data={data} postList={postListDeletedMainLocal} user={user} show_author={false} />
		<h3>My Replies</h3>
		<PostList data={data}  postList={postListDeletedRepliesLocal} user={user} show_author={false} />
	{:else}
		<p><em>not logged in</em></p>
	{/if}


</div>
