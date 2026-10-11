<!--
	Ban online: trang goc chi chuyen thang toi /thuc-nghiem/ (giu ?gia-lap, ?giay, ?ma),
	de link gui cho nguoi tham gia ngan gon va ho khong lac sang trang khac.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	onMount(() => {
		void goto(`${base}/thuc-nghiem/${location.search}`, { replaceState: true });
	});
</script>

<svelte:head>
	<title>Thực nghiệm · VSLink</title>
	<noscript><meta http-equiv="refresh" content="0; url=thuc-nghiem/" /></noscript>
</svelte:head>

<div class="khung-trang">
	<p>Đang mở trang thực nghiệm… Nếu chưa tự chuyển, <a href="{base}/thuc-nghiem/">bấm vào đây</a>.</p>
</div>
