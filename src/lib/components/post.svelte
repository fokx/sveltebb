<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import { GeneratePostId, SyncStatus, USER_ID_NOT_LOGGED_IN } from '$lib/utils.js';
	import { liveQuery } from 'dexie';
	import Self from './post.svelte';
	import { fly, slide } from 'svelte/transition';
	import User from '$lib/components/user.svelte';
	import { enhance } from '$app/forms';

	let {
		post = $bindable(),
		data = $bindable(),
		sync_status = $bindable(),
		indent = $bindable()
	} = $props();
	let user = $derived(data.user);
	let newItem = $state('');
	let new_post_id;
	let postListLocal = liveQuery(() =>
		dbDexie.posts.orderBy('id').desc().toArray()
	);
	let thisPost = $state('');
	let repliesToThisPost = $state('');
	let show_reply_form = $state(false);
	postListLocal.subscribe((posts_local) => {
			thisPost = posts_local.filter(t => t.id === post.id)[0];
			repliesToThisPost = posts_local.filter(t => t.reply_to_post_id === post.id);
		}
	);

</script>

<!--{#if !post}-->
<!--	<p style="color: red">error: post {post} is null</p>-->
<!--{:else}-->
<!--	<div style="display:inline; margin-right: 2px">-->
<!--	</div>-->
{#if indent === 0}
	<div style="display: block; gap: 4em, 4em , 6em">
		<User data={data} user_id={post.user_id} />
	</div>
	<div style="display:inline;">
		<span>{post.text}</span>
		{#if indent !== 0}
			<div class="post-reply">
				{#if !show_reply_form}
					<button aria-label="toggle reply field" style="background: url(/reply.svg) no-repeat 50% 50%;"
									class="filter-svg" onclick={()=>{show_reply_form=!show_reply_form}}></button>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<div in:fly={{ y: 20 }} out:slide class="post" style="margin-left: { indent * 20}px;">
	{#if indent !== 0}
		{#each Array(indent + 1) as _, j}
			<div class="indent-line" style="left: {(j-indent) * 20 - 3}px;"></div>
		{/each}
		<div style="display:inline;">
			<span>{post.text}</span>
			<User data={data} user_id={post.user_id} />
			{#if indent !== 0}
				<div class="post-reply">
					{#if !show_reply_form}
						<button aria-label="toggle reply field" style="background: url(/reply.svg) no-repeat 50% 50%;"
										class="filter-svg" onclick={()=>{show_reply_form=!show_reply_form}}></button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#if indent === 0 || show_reply_form}
		<form class:is_first_post={post.is_main_post} action="?/create_reply" class="input-form" method="post" use:enhance={({
																																																			formElement,
																																																			formData,
																																																			action,
																																																			cancel,
																																																			submitter
																																																		}) => {
			// debounce the form submission
			formElement.addEventListener('submit', (e) => {
				e.preventDefault();
				e.target.reset(); // clear the input after submission
			});
			if (window.preventDuplicateKeyPresses) {
				return;
			}
			window.preventDuplicateKeyPresses = true;
			window.setTimeout(function() {
				window.preventDuplicateKeyPresses = false;
			}, 500);

			new_post_id = GeneratePostId();
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
			show_reply_form = !show_reply_form;
			return async ({ result, update }) => {
				if (result.type === 'success') {
					dbDexie.posts.filter(t => t.id === new_post_id).modify({ synced: true, updated_at: new Date() });
					sync_status = SyncStatus.synced;
					newItem = '';
					await update();
				} else {
					sync_status = SyncStatus.divergent;
				}
			};
		}}>
			<input bind:value={newItem} name="content" placeholder="reply.." required type="text" />
			<button aria-label="Reply" disabled={!newItem} style="background: url(/reply.svg) no-repeat 50% 50%;"
							class="filter-svg"></button>
			{#if indent !== 0}
				<div class="post-reply">
					{#if show_reply_form}
						<button aria-label="toggle reply field" style="background: url(/xmark.svg) no-repeat 50% 50%;"
										class="filter-svg" onclick={()=>{show_reply_form=!show_reply_form}}></button>
					{/if}
				</div>
			{/if}
		</form>

	{/if}

</div>
<!--{/if}-->

{#each repliesToThisPost as post_direct_reply, index (post_direct_reply.id)}
	<Self post={post_direct_reply} data={data} sync_status={sync_status} indent={indent +1} />
{/each}


