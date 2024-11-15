<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import { enhance } from '$app/forms';
	import { gen_post_id, SyncStatus, USER_ID_NOT_LOGGED_IN } from '$lib/utils.js';

	let {
		post = $bindable(),
		data = $bindable(),
		sync_status = $bindable()
	} = $props();
	let user = $derived(data.user);

	let newItem = $state('');
	let new_post_id;

</script>
<div class="post">
	{#if !post}
		<p style="color: red">error: post {post} is null</p>
	{:else}
		<span>{post.text}</span>
		<span style="font-size: x-small;">({post.user_id})</span>
		<form action="?/create_reply" class="input-form" method="post" use:enhance={({ formElement, formData, action, cancel, submitter }) => {
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

		new_post_id = gen_post_id();
		sync_status = SyncStatus.syncing;
		dbDexie.posts.add({
			id: new_post_id,
			user_id: user ? user.id : USER_ID_NOT_LOGGED_IN,
			text: newItem,
			deleted: false,
			is_main_post: false,
			main_post_id: post.main_post_id,
			created_at: new Date(),
			updated_at: new Date(),
			reply_to_post_id: post.id,
		});
		formData.append('id', new_post_id);
		formData.append('reply_to_post_id', post.id);
		formData.append('main_post_id', post.main_post_id);
		return async ({ result, update }) => {
			if (result.type === 'success') {
				dbDexie.posts.filter(t => t.id === new_post_id).modify({ synced: true, updated_at: new Date() });
				sync_status = SyncStatus.synced;
				newItem='';
				await update();
			} else {
				sync_status = SyncStatus.divergent;
			}
		};
	}}>
			<input bind:value={newItem} name="content" placeholder="reply.." required type="text" />
			<button aria-label="Add" disabled={!newItem}>Add</button>
		</form>
	{/if}
</div>

