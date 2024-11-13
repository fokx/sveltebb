<script>
	import Post from '$lib/components/post-list.svelte';
	import { derived } from 'svelte/store';
	import { liveQuery } from 'dexie';
	import { dbDexie } from '$lib/db-dexie.js';
	import { SyncStatus } from '$lib/utils.js';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();
	let user = $derived(data.user);
	let postListLocal = liveQuery(() =>
		dbDexie.posts.orderBy('id').desc().toArray()
	);

	let postListDeletedLocal = $state();
	postListLocal.subscribe((posts) => {
		if (user){
			postListDeletedLocal = posts.filter(t => t.user_id === user.id);
		} else{
			postListDeletedLocal = [];
		}
	});
	let sync_status = $state(SyncStatus.unknown);

</script>


<div class="centered">

	<h2>My Posts</h2>
	{#if user}
	<Post isDeletedListPage={true} postList={postListDeletedLocal} user={user} sync_status={sync_status} show_author={false}/>
		{:else}
		<p><em>not logged in</em></p>
	{/if}


</div>
