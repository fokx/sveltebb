<script>
	import { onMount } from 'svelte';
	import { dbDexie } from '$lib/db-dexie.js';
	import { enhance } from '$app/forms';
	import PostList from '$lib/components/post-list.svelte';
	import { derived } from 'svelte/store';
	import { liveQuery } from 'dexie';
	import { gen_post_id, getEnumName, SyncStatus } from '$lib/utils.js';
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();
	let user = $derived(data.user);
	let postListCloud = $derived(data.cloud_posts);
	let newItem = $state('');
	let postListNotDeletedLocal = $state();
	let new_post_id;
	let previously_offline = false;
	let just_synced = false;
	let postListLocal = liveQuery(() =>
		dbDexie.posts.orderBy('id').desc().toArray()
	);

	let sync_status = $state(SyncStatus.unknown);
	postListLocal.subscribe((posts_local) => {
			postListNotDeletedLocal = posts_local.filter(t => !t.deleted);
		}
	);

	$effect(async () => {
		if (user && $postListLocal) {
			// console.log('$postListLocal', $postListLocal);
			// console.log('postListCloud', postListCloud);
			// console.log('sync_status old', sync_status);
			if (just_synced) {
				just_synced = false;
				return;
			}
			if (sync_status !== SyncStatus.syncing) {
				if ($postListLocal.length === 0 && postListCloud.length === 0) {
					sync_status = SyncStatus.empty;
				} else if (user && (postListCloud?.length === undefined || postListCloud === null)) {
					// logged in, but no cloud data
					sync_status = SyncStatus.error;
				} else if ($postListLocal.length !== postListCloud.length) {
					// console.log('$postListLocal.length !== postListCloud.length', $postListLocal.length, postListCloud.length);
					sync_status = SyncStatus.divergent;
				} else {
					let all_match = $postListLocal.every((localPost, index) => {
						// in this branch, length is the same, also assert that the order is the same
						const cloudPost = postListCloud[index];
						return (
							localPost.id === cloudPost.id &&
							localPost.text === cloudPost.text &&
							localPost.done === cloudPost.done &&
							localPost.deleted === cloudPost.deleted
						);
					});
					if (all_match) {
						sync_status = SyncStatus.synced;
					} else {
						sync_status = SyncStatus.divergent;
					}
				}
			}
			await MergeRemoteAndLocal();
		}
		updateSyncStatus();
		just_synced = true;
	});

	onMount(() => {
		if (!window.indexedDB) {
			alert('This post app is not unsupported on this browser. \nReason: Indexed DB is not supported!');
		}
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('message', async event => {
				if (event.data.type === 'ONLINE_STATUS') {
					setOnlineIndicator(event.data.online);
					if (!event.data.online) {
						previously_offline = true;
					} else {
						if (previously_offline) {
							previously_offline = false;
							invalidateAll();
							await MergeRemoteAndLocal();
						}
					}
				}
				if (event.data.type === 'SYNC_STATUS') {
					invalidateAll();
					await MergeRemoteAndLocal();
				}
			});
		}
		setOnlineIndicator(true);
	});

	function updateSyncStatus() {
		if (browser) {
			const ele = document.getElementById('sync-status');
			if (ele) {
				ele.classList.remove(...Array.from(ele.classList).slice(1));
				let name = getEnumName(SyncStatus, sync_status);
				if (name === 'unknown') {
					ele.textContent = 'synced?';
				} else {
					ele.textContent = name.replace('_', ' ');
				}
				ele.classList.add(name);
			}
		}
	}

	async function MergeRemoteAndLocal() {
		if (!user) {
			return;
		}
		let update_jobs = [];
		let map_local_ids = new Map($postListLocal.map(i => [i.id, i]));
		let map_cloud_ids = new Map(postListCloud.map(i => [i.id, i]));
		let ids_joint = (new Set(map_local_ids.keys())).intersection((new Set(map_cloud_ids.keys())));
		for (let id of ids_joint) {
			let local = map_local_ids.get(id);
			let cloud = map_cloud_ids.get(id);
			if (!(local.text === cloud.text && local.done === cloud.done && local.deleted === cloud.deleted)) {
				if (local.updated_at < cloud.updated_at) {
					dbDexie.posts.filter(t => t.id === id).modify({
						text: cloud.text,
						done: cloud.done,
						deleted: cloud.deleted,
						// synced: false,
						updated_at: cloud.updated_at
					});
				} else {
					update_jobs.push(local);
				}
			}
		}
		let ids_only_in_cloud = (new Set(map_cloud_ids.keys())).difference((new Set(map_local_ids.keys())));
		for (let id of ids_only_in_cloud) {
			let cloud = map_cloud_ids.get(id);
			// todo: drop unneeded fields instead of enumerate required ones
			dbDexie.posts.add({
				id: id,
				user_id: cloud.user_id,
				user_name: cloud.user_name,
				text: cloud.text,
				deleted: cloud.deleted,
				is_main_post: cloud.is_main_post,
				main_post_id: cloud.main_post_id,
				reply_to_post_id: cloud?.reply_to_post_id,
				updated_at: cloud.updated_at,
				created_at: cloud.created_at
			});
		}
		let ids_only_in_local = (new Set(map_local_ids.keys())).difference((new Set(map_cloud_ids.keys())));
		for (let id of ids_only_in_local) {
			let local = map_local_ids.get(id);
			local.user_id = user.id;
			update_jobs.push(local);
		}
		if (update_jobs.length > 0) {
			const response = await fetch('/api/sync-data', {
				method: 'POST',
				body: JSON.stringify(update_jobs),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			if (response.status === 200) {
				sync_status = SyncStatus.just_synced;
			} else {
				sync_status = SyncStatus.failed;
				const { message } = await response.json();
				// console.log('message', message);
			}
		}
		updateSyncStatus();
	}

	function setOnlineIndicator(isOnline) {
		if (browser) {
			const statusElement = document.getElementById('online-status');
			if (isOnline) {
				// console.log('online');
				if (statusElement) {
					statusElement.textContent = 'online';
					statusElement.classList.add('online');
					statusElement.classList.remove('offline');
				}
			} else {
				// console.log('offline');
				if (statusElement) {
					statusElement.textContent = 'offline';
					statusElement.classList.add('offline');
					statusElement.classList.remove('online');
				}
			}
		}
	}

</script>

<div class="centered">
	<div class="header">
		<div class="status" id="sync-status"></div>
		<div class="status" id="online-status">online?</div>
	</div>

	<form action="?/createpost" class="input-form" method="post" use:enhance={({ formElement, formData, action, cancel, submitter }) => {
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
			user_id: user ? user.id : null,
			user_name: user ? user.username : null,
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
	<PostList postList={postListNotDeletedLocal} user={user} sync_status={sync_status} show_author={true} />

	{#if user}
		<p>to view changes to your todos on <em>another</em> browser/device, you have to wait a few seconds.</p>
	{:else}
		<p>⚠️ Your posts are stored in your
			<a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API">browser</a>
			and will get <strong>lost</strong> when you clear browsing data.</p>
		<p>Sign in to store data in the cloud and get synced between browsers / devices.</p>
	{/if}

</div>


