<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import { enhance } from '$app/forms';
	import PostList from '$lib/components/post-list.svelte';
	import { derived } from 'svelte/store';
	import { liveQuery } from 'dexie';
	import { GeneratePostId, SyncStatus, USER_ID_NOT_LOGGED_IN } from '$lib/utils.js';

	// /** @type {{ data: import('./$types').PageData }} */
	let {
		data = $bindable(),
		sync_status = $bindable()
	} = $props();
	let user = $derived(data.user);
	let postListCloud = $derived(data.cloud_posts);
	let newItem = $state('');
	let postListNotDeletedMainLocal = $state();
	let new_post_id;
	let postListLocal = liveQuery(() =>
		dbDexie.posts.orderBy('id').desc().toArray()
	);

	postListLocal.subscribe((posts_local) => {
			postListNotDeletedMainLocal = posts_local.filter(t => t.is_main_post).filter(t => !t.deleted);
		}
	);

</script>

<div class="centered">

	<form action="?/create_post" class="input-form" method="post" use:enhance={({ formElement, formData, action, cancel, submitter }) => {
		// debounce the form submission
		formElement.addEventListener('submit', (e) => {
			e.preventDefault();
			e.target.reset(); // clear the input after submission
		});
		if (window.preventDuplicateKeyPresses) {
			return;
		}
		window.preventDuplicateKeyPresses = true;
		window.setTimeout(function() { window.preventDuplicateKeyPresses = false; }, 500 );

		new_post_id = GeneratePostId();
		sync_status = SyncStatus.syncing;
		dbDexie.posts.add({
			id: new_post_id,
			user_id: user ? user.id : USER_ID_NOT_LOGGED_IN,
			text: newItem,
			deleted: false,
			is_main_post: true,
			main_post_id: new_post_id,
			created_at: new Date(),
			updated_at: new Date()
		});
		formData.append('id', new_post_id);
		return async ({ result, update }) => {
			if (result.type === 'success') {
				dbDexie.posts.filter(t => t.id === new_post_id).modify({ synced: true, updated_at: new Date() });
				sync_status = SyncStatus.synced;
				// await invalidateAll();
				// await sleep(5000);
				newItem='';
				await update();
			} else {
				sync_status = SyncStatus.divergent;
			}
		};
	}}>
		<input bind:value={newItem} name="content" placeholder="new post.." required type="text" />
		<button aria-label="Add" disabled={!newItem}>Add</button>
	</form>

	<br />
	<PostList data={data}  postList={postListNotDeletedMainLocal} user={user} show_author={true} />
	<p>You don't need to click the <kbd>Update</kbd> button frequently. </p>
	<p>Normally, you just have to wait for a few seconds for changes made by others to appear.</p>
</div>


