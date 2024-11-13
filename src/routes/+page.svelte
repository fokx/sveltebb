<script>
	import { onMount } from 'svelte';
	import { dbDexie } from '$lib/db-dexie.js';
	import { enhance } from '$app/forms';
	import Todo from '$lib/components/todo-list.svelte';
	import { derived } from 'svelte/store';
	import { liveQuery } from 'dexie';
	import { gen_todo_id, getEnumName, SyncStatus } from '$lib/utils.js';
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();
	let user = $derived(data.user);
	let todoListCloud = $derived(data.cloud_posts);
	let newItem = $state('');
	let todoListNotDeletedLocal = $state();
	let todoListNotDeletedUncompletedCountLocal = $state();
	let todoListNotDeletedCountLocal = $state();
	let new_todo_id;
	const CONFIRM_WORD = 'del';
	let previously_offline = false;
	let just_synced = false;
	let todoListLocal = liveQuery(() =>
		dbDexie.todos.orderBy('id').desc().toArray()
	);

	let sync_status = $state(SyncStatus.unknown);
	let count_status_local = $state();
	todoListLocal.subscribe((todos_local) => {
			todoListNotDeletedLocal = todos_local.filter(t => !t.deleted);
			todoListNotDeletedUncompletedCountLocal = todos_local.filter(t => !t.deleted).filter(t => !t.done).length;
			todoListNotDeletedCountLocal = todos_local.filter(t => !t.deleted).length;
			// });
			// let count_status_local = $derived.by(() => {
			let res;
			if (todoListNotDeletedCountLocal > 0) {
				if (todoListNotDeletedUncompletedCountLocal === 0) {
					res = 'All completed';
				} else if (todoListNotDeletedUncompletedCountLocal === todoListNotDeletedCountLocal) {
					res = 'None completed';
				} else {
					res = `${todoListNotDeletedUncompletedCountLocal} / ${todoListNotDeletedCountLocal} uncompleted`;
				}
			} else {
				// <span style="display: block;  text-align: center;"><em>* Nothing yet *</em></span>;
				res = '';
			}
			count_status_local = res;
		}
	);

	$effect(async () => {
		if (user && $todoListLocal) {
			// console.log('$todoListLocal', $todoListLocal);
			// console.log('todoListCloud', todoListCloud);
			// console.log('sync_status old', sync_status);
			if (just_synced) {
				just_synced = false;
				return;
			}
			if (sync_status !== SyncStatus.syncing) {
				if ($todoListLocal.length === 0 && todoListCloud.length === 0) {
					sync_status = SyncStatus.empty;
				} else if (user && (todoListCloud?.length === undefined || todoListCloud === null)) {
					// logged in, but no cloud data
					sync_status = SyncStatus.error;
				} else if ($todoListLocal.length !== todoListCloud.length) {
					// console.log('$todoListLocal.length !== todoListCloud.length', $todoListLocal.length, todoListCloud.length);
					sync_status = SyncStatus.divergent;
				} else {
					let all_match = $todoListLocal.every((localTodo, index) => {
						// in this branch, length is the same, also assert that the order is the same
						const cloudTodo = todoListCloud[index];
						return (
							localTodo.id === cloudTodo.id &&
							localTodo.text === cloudTodo.text &&
							localTodo.done === cloudTodo.done &&
							localTodo.deleted === cloudTodo.deleted
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


	function deleteCompleted(form) {
		if (window.confirm('Do you really want to delete all completed todos?')) {
			sync_status = SyncStatus.syncing;
			todoListNotDeletedLocal.forEach(todo => {
				if (todo.done) {
					dbDexie.todos.filter(t => t.id === todo.id).modify({
						deleted: true,
						synced: false,
						updated_at: new Date()
					});
				}
			});
		}
	}

	function deleteAllLocal() {
		let res = prompt(`Warning: Do you really want to purge ALL todos permanently on this device? This operation is irrevocable. Type "${CONFIRM_WORD}" without the quote to confirm.`);
		if (res !== null && res === CONFIRM_WORD) {
			dbDexie.todos.clear();
		}
	}

	async function deleteAllCloudAndLocal() {
		let res = prompt(`Warning: Do you really want to purge ALL todos permanently both on this device and in the cloud? This operation is irrevocable. Type "${CONFIRM_WORD}" without the quote to confirm.`);
		if (res !== null && res === CONFIRM_WORD) {
			const response = await fetch('/api/purge-all', {
				method: 'POST'
			});
			if (response.status === 200) {
				dbDexie.todos.clear();
				alert('All todos have been successfully purged.');
			} else {
				const { message } = await response.json();
				alert(message);
			}
		}
	}

	onMount(() => {
		if (!window.indexedDB) {
			alert('This todo app is not unsupported on this browser. \nReason: Indexed DB is not supported!');
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
		let map_local_ids = new Map($todoListLocal.map(i => [i.id, i]));
		let map_cloud_ids = new Map(todoListCloud.map(i => [i.id, i]));
		let ids_joint = (new Set(map_local_ids.keys())).intersection((new Set(map_cloud_ids.keys())));
		for (let id of ids_joint) {
			let local = map_local_ids.get(id);
			let cloud = map_cloud_ids.get(id);
			if (!(local.text === cloud.text && local.done === cloud.done && local.deleted === cloud.deleted)) {
				if (local.updated_at < cloud.updated_at) {
					dbDexie.todos.filter(t => t.id === id).modify({
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
			dbDexie.todos.add({
				id: id,
				user_id: cloud.user_id,
				text: cloud.text,
				done: cloud.done,
				deleted: cloud.deleted,
				synced: true,
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

<style>
    @import '$lib/styles.css';
</style>

<div class="centered">
	<div class="title">
		<h2 style="display: inline;">SvelteBB</h2>
		<h4 style="display: inline; margin-left: 15px;">you are: {user ? user.username : "Guest"} </h4>
	</div>

	<div class="header">
		<p>{count_status_local}</p>
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

		new_todo_id = gen_todo_id();
		sync_status = SyncStatus.syncing;
		dbDexie.todos.add({
			id: new_todo_id,
			user_id: user ? user.id : null,
			text: newItem,
			done: false,
			deleted: false,
			synced: false,
			created_at: new Date(),
			updated_at: new Date()
		});
		formData.append('id', new_todo_id);
		return async ({ result, update }) => {
			if (result.type === 'success') {
				dbDexie.todos.filter(t => t.id === new_todo_id).modify({ synced: true, updated_at: new Date() });
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
	<Todo todoList={todoListNotDeletedLocal} user={user} sync_status={sync_status} />

	<div class="footer-buttons">
		<button aria-label="View deleted todos" onclick={() => location.href='/deleted'} type="button">View deleted</button>
		<form action="?/deleteAllCompleted" method="post" use:enhance={({formData, cancel}) => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					todoListNotDeletedLocal.forEach(todo => {
						if (todo.done) {
							dbDexie.todos.filter(t => t.deleted === true).modify({ synced: true , updated_at: new Date()});
						}
					});
					sync_status = SyncStatus.synced;
					await update();
				} else {
					sync_status = SyncStatus.divergent;
				}
			};
		}}>
			<button aria-label="Remove all completed todos"
							disabled={!(todoListNotDeletedCountLocal-todoListNotDeletedUncompletedCountLocal)}
							onclick={(e) => deleteCompleted(e.target.form)}
			>Remove all completed
			</button>
		</form>
	</div>

	{#if user}
		<p>Currently, to view changes to your todos on <b>another</b> browser/device, you have to refresh manually.</p>
	{:else}
		<p>⚠️ Your todos are stored in your
			<a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API">browser</a>
			and will get <strong>lost</strong> when you clear browsing data.</p>
		<p>Sign in to store data in the cloud and get synced between browsers / devices.</p>
	{/if}

	<div class="danger-zone">
		<h3>Danger Zone</h3>
		<button aria-label="Purge ALL todos permanently on this device" onclick={deleteAllLocal}>purge all <em>local</em>
			todos
		</button>
		<button aria-label="Purge ALL todos permanently (including all my cloud data)" onclick={deleteAllCloudAndLocal}>
			purge ALL todos
		</button>
	</div>

</div>


