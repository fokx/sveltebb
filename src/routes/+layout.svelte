<script>
	import { GetEnumName, GetUserName, SetOnlineIndicator, SyncStatus, USER_ID_NOT_LOGGED_IN } from '$lib/utils.js';
	import { invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import { dbDexie } from '$lib/db-dexie.js';
	import { liveQuery } from 'dexie';
	import { onMount } from 'svelte';

	let { children, data } = $props();
	let user = $derived(data.user);
	let cloud_users = $derived(data.cloud_users);
	let postListCloud = $derived(data.cloud_posts);
	let userListCloud = $derived(data.cloud_users);
	let sync_status = $state(SyncStatus.unknown);
	let postListLocal = liveQuery(() =>
		dbDexie.posts.orderBy('id').desc().toArray()
	);
	$effect(() => {
		if (userListCloud) {
			dbDexie.users.bulkPut(userListCloud).then(() => {
				console.log(`Successfully synced ${userListCloud.length} users`);
			});
		}
	});
	let just_synced = false;

	$effect(async () => {
		if ($postListLocal) {
			if (just_synced) {
				just_synced = false;
				return;
			}
			if (sync_status !== SyncStatus.syncing) {
				if ($postListLocal.length === 0 && postListCloud.length === 0) {
					sync_status = SyncStatus.empty;
				} else if (postListCloud?.length === undefined || postListCloud === null) {
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

	onMount(async () => {
		window.previously_offline = false;
		if (!window.indexedDB) {
			alert('This post app is not unsupported on this browser. \nReason: Indexed DB is not supported!');
		}
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('message', async event => {
				if (event.data.type === 'ONLINE_STATUS') {
					SetOnlineIndicator(event.data.online);
					if (!event.data.online) {
						window.previously_offline = true;
					} else {
						if (window.previously_offline) {
							window.previously_offline = false;
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
		SetOnlineIndicator(true);
	});

	async function MergeRemoteAndLocal() {
		let update_jobs = [];
		if (!$postListLocal) {
			return;
		}
		// console.log(postListCloud);
		let map_local_ids = new Map($postListLocal.map(i => [i.id, i]));
		let map_cloud_ids = new Map(postListCloud.map(i => [i.id, i]));
		let ids_joint = (new Set(map_local_ids.keys())).intersection((new Set(map_cloud_ids.keys())));
		for (let id of ids_joint) {
			let local = map_local_ids.get(id);
			let cloud = map_cloud_ids.get(id);
			if (!(local.text === cloud.text && local.done === cloud.done && local.deleted === cloud.deleted)) {
				if (local.updated_at < cloud.updated_at) {
					dbDexie.posts.filter(t => t.id === id).modify(cloud);
				} else {
					update_jobs.push(local);
				}
			}
		}
		let ids_only_in_cloud = (new Set(map_cloud_ids.keys())).difference((new Set(map_local_ids.keys())));
		for (let id of ids_only_in_cloud) {
			let cloud = map_cloud_ids.get(id);
			dbDexie.posts.add(cloud);
		}
		let ids_only_in_local = (new Set(map_local_ids.keys())).difference((new Set(map_cloud_ids.keys())));
		for (let id of ids_only_in_local) {
			let local = map_local_ids.get(id);
			local.user_id = (user ? user.id : USER_ID_NOT_LOGGED_IN);
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

	function updateSyncStatus() {
		if (browser) {
			const ele = document.getElementById('sync-status');
			if (ele) {
				ele.classList.remove(...Array.from(ele.classList).slice(1));
				let name = GetEnumName(SyncStatus, sync_status);
				if (name === 'unknown') {
					ele.textContent = 'synced?';
				} else {
					ele.textContent = name.replace('_', ' ');
				}
				ele.classList.add(name);
			}
		}
	}

	MergeRemoteAndLocal();

</script>
<style>
    @import '$lib/styles.css';
</style>
<nav class="title">
	<a href="/" style="display: inline;">SvelteBB</a>
	{#if user}
		<span style="display: inline; ">
			<a href="/my-posts">{GetUserName(cloud_users, user.id)}</a>
		</span>
	{:else}
		<span>You are a guest.</span>
		<!--		<a href="/login" style="display: inline; margin-left: 15px;">login</a>-->
	{/if}

	<div class="header">
		<div class="status" id="sync-status"></div>
		<div class="status" id="online-status">online?</div>
		<button style="opacity: 75%; padding: 0.25rem 0.5rem; font-size: 0.7rem;"
						onclick={() => {sync_status=SyncStatus.syncing; invalidateAll(); MergeRemoteAndLocal();}}>Update
		</button>
	</div>

</nav>
{@render children({ sync_status })}
