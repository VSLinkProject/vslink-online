<!--
	Ban ONLINE: nguoi tham gia mo trang nay tu Google Form (trang goc / cung chuyen ve day).
	Bam "Bắt đầu" -> web tu sinh ma O-XXXXX -> lam bai -> man cuoi hien ma de chep vao o "Mã của bạn" trong Form.
	/thuc-nghiem/?ma=O07 -> link co san ma (khong bat buoc).
	?quan-ly=1 -> hien muc "Dành cho người hướng dẫn" (trang thai gui, tai CSV, xoa du lieu thu); nguoi tham gia khong thay muc nay.
	Them &gia-lap=1 de thu luong khong can camera; khi gia lap, &giay=10 rut thoi gian hoc toi thieu con 10 giay (toi da gap doi).
	Thu tu buoc, tu: $lib/thuc-nghiem/kich-ban.ts. Ghi ket qua: $lib/thuc-nghiem/ghi.ts.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { napVideoMau, type TepVideoMau } from '$lib/loi/video-mau';
	import { napCauHinh } from '$lib/meo/hoi-meo';
	import { CAU_HINH, docMa, taoKichBan, taoMaOnline, type Buoc, type LanKy, type NguoiThamGia, type SuCo } from '$lib/thuc-nghiem/kich-ban';
	import { napMoHinh } from '$lib/loi/mo-hinh';
	import { HangDoi, moTaThietBi, sangCsv, taoDong, type DongGhi, type SuKien, type TrangThaiGui } from '$lib/thuc-nghiem/ghi';
	import BaiNhanDien from '$lib/thuc-nghiem/BaiNhanDien.svelte';
	import HocBo from '$lib/thuc-nghiem/HocBo.svelte';
	import KyLai from '$lib/thuc-nghiem/KyLai.svelte';

	const KHOA_PHIEN = 'vslink-tn-phien';

	let tepVideo = $state<TepVideoMau>({ phien_ban: 0, tu: {} });
	let giaLap = $state(false);
	/** muc "Dành cho người hướng dẫn" chi hien cho nhom (?quan-ly=1), nguoi tham gia khong thay */
	let quanLy = $state(false);
	/** chi de chay thu (kem gia-lap): ghi de thoi gian hoc moi bo */
	let giayThu = $state<number | null>(null);
	/** ma co san tu link ?ma=… (khong bat buoc) */
	let maLink = $state<string | null>(null);
	let nguoi = $state<NguoiThamGia | null>(null);
	let kichBan = $state<Buoc[]>([]);
	let idx = $state(0);
	let rutLui = $state(false);
	let dangDo = $state<{ ma: string; idx: number } | null>(null);
	let gui = $state<TrangThaiGui>({ choGui: 0, daLuu: 0, loi: null });
	let hangDoi: HangDoi | null = null;
	let tBuoc = 0;
	/** moi lan tai trang chi do thoi gian nap mo hinh mot lan (lan dau tren may / trinh duyet nay) */
	let daDoMoHinh = false;
	let daChep = $state(false);

	const buoc = $derived(kichBan[idx] as Buoc | undefined);
	const soBuocLam = $derived(kichBan.filter((b) => b.loai !== 'xong').length);

	function ghi(suKien: SuKien, them: Partial<DongGhi> = {}) {
		if (!nguoi || !buoc) return;
		hangDoi?.ghi(taoDong(nguoi, buoc.ten, suKien, them));
	}

	function luuPhien() {
		try {
			if (nguoi && buoc?.loai !== 'xong') localStorage.setItem(KHOA_PHIEN, JSON.stringify({ ma: nguoi.ma, idx }));
			else localStorage.removeItem(KHOA_PHIEN);
		} catch {
			/* bo qua */
		}
	}

	function vaoBuoc(i: number) {
		idx = i;
		tBuoc = performance.now();
		luuPhien();
		const b = kichBan[i];
		ghi('bat-dau', 'bo' in b ? { bo: b.bo, phan_hoi: b.phanHoi } : {});
		window.scrollTo({ top: 0 });
	}

	function hetBuoc(them: Partial<DongGhi> = {}) {
		const b = buoc;
		if (!b) return;
		ghi('het-buoc', { ms: Math.round(performance.now() - tBuoc), ...('bo' in b ? { bo: b.bo, phan_hoi: b.phanHoi } : {}), ...them });
		vaoBuoc(idx + 1);
	}

	function batDau(ma: string, tuBuoc = 0) {
		const n = docMa(ma);
		if (!n) return;
		nguoi = n;
		kichBan = taoKichBan(n);
		rutLui = false;
		daChep = false;
		dangDo = null;
		idx = tuBuoc;
		if (tuBuoc === 0) {
			ghi('thiet-bi', { thiet_bi: moTaThietBi(navigator as Navigator & { deviceMemory?: number }, screen) });
		}
		vaoBuoc(tuBuoc);
		doMoHinh();
	}

	/** Nap san mo hinh ngay khi bat dau va ghi thoi gian nap (hoac loi) — so lieu hieu nang cho tung may. */
	function doMoHinh() {
		if (daDoMoHinh) return;
		daDoMoHinh = true;
		const t = performance.now();
		napMoHinh()
			.then(() => ghi('tai-mo-hinh', { ms: Math.round(performance.now() - t) }))
			.catch((e) => {
				daDoMoHinh = false;
				ghi('loi-mo-hinh', { chi_tiet: `nap: ${e instanceof Error ? e.message : String(e)}` });
			});
	}

	function ghiSuCo(s: SuCo) {
		ghi(s.suKien, { chi_tiet: s.chiTiet, ms: s.ms });
	}

	async function chepMa() {
		if (!nguoi) return;
		try {
			await navigator.clipboard.writeText(nguoi.ma);
			daChep = true;
		} catch {
			daChep = false;
		}
	}

	function nguoiTiepTheo() {
		nguoi = null;
		kichBan = [];
		idx = 0;
		rutLui = false;
		try {
			localStorage.removeItem(KHOA_PHIEN);
		} catch {
			/* bo qua */
		}
	}

	function xoaDuLieuThu() {
		if (!confirm('Xoá toàn bộ dữ liệu thử trên máy này (kể cả dòng chưa gửi)? Không khôi phục được.')) return;
		hangDoi?.xoaHet();
		dangDo = null;
		try {
			localStorage.removeItem(KHOA_PHIEN);
		} catch {
			/* bo qua */
		}
	}

	function dungThamGia() {
		if (!confirm('Bạn muốn dừng tham gia? Dữ liệu của bạn sẽ không được dùng.')) return;
		ghi('rut-lui');
		rutLui = true;
		vaoBuoc(kichBan.length - 1);
	}

	function ghiKy(k: LanKy, b: Buoc) {
		ghi('ky', {
			bo: 'bo' in b ? b.bo : '',
			phan_hoi: 'phanHoi' in b ? b.phanHoi : null,
			tu: k.tu.tu,
			tra_loi: k.top5[0] ?? '',
			dung: k.hang === 1,
			hang: k.hang,
			muc_do: k.mucDo,
			top5: k.top5.join(', '),
			lan: k.lan,
			ms: k.ms
		});
	}

	function taiVe() {
		if (!hangDoi) return;
		const blob = new Blob([sangCsv(hangDoi.tatCa())], { type: 'text/csv;charset=utf-8' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `thuc-nghiem-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	onMount(() => {
		hangDoi = new HangDoi(async () => (await napCauHinh()).meo_api, localStorage, (t) => (gui = t));
		void hangDoi.gui(); // gui not dong con ton tu buoi truoc
		napVideoMau().then((t) => (tepVideo = t));
		giaLap = page.url.searchParams.has('gia-lap');
		quanLy = page.url.searchParams.has('quan-ly');
		const g = Number(page.url.searchParams.get('giay'));
		if (giaLap && Number.isInteger(g) && g > 0) giayThu = g;
		maLink = docMa(page.url.searchParams.get('ma') ?? '')?.ma ?? null;
		try {
			const d = JSON.parse(localStorage.getItem(KHOA_PHIEN) ?? 'null');
			if (d && typeof d.ma === 'string' && Number.isInteger(d.idx)) dangDo = d;
		} catch {
			/* bo qua */
		}
	});
</script>

<svelte:head><title>Thực nghiệm · VSLink</title></svelte:head>

<div class="khung-trang trang-tn" data-testid="thuc-nghiem">
	{#if !nguoi}
		<section class="the vao">
			<p class="nhan-nho">Thực nghiệm VSLink</p>
			<h1>Học ký hiệu tiếng Việt qua webcam</h1>
			<p>Bạn sẽ xem 6 video và chọn nghĩa, học 3 ký hiệu với nhận xét của Mèo, tự ký lại, rồi xem lại 6 video. Khoảng 5 phút.</p>
			<p class="phu">Cần máy có webcam, dùng Chrome hoặc Edge. Camera chỉ chạy trên máy bạn: web không quay, không lưu, không gửi hình đi đâu.</p>
			<button class="nut" onclick={() => batDau(maLink ?? taoMaOnline())} data-testid="bat-dau-online">Bắt đầu</button>
			<p class="phu">Không cần nhập mã: web sẽ cho bạn một mã ở cuối để chép vào Google Form.</p>
			{#if dangDo}
				<p class="dang-do">
					Máy này còn một lượt đang dở của mã <b>{dangDo.ma}</b>.
					<button class="nut vien nho" onclick={() => dangDo && batDau(dangDo.ma, dangDo.idx)}>Làm tiếp {dangDo.ma}</button>
				</p>
			{/if}
		</section>
	{:else if buoc}
		{#if buoc.loai !== 'xong'}
			<div class="tien-trinh" aria-label="Tiến trình">
				<span>Mã {nguoi.ma} · Phần {idx + 1}/{soBuocLam}</span>
				<button class="nut-chu" onclick={dungThamGia}>Dừng tham gia</button>
			</div>
		{/if}

		{#if buoc.loai === 'huong-dan'}
			<section class="the" data-testid="huong-dan">
				<h1>Cách ký trước camera</h1>
				<ol>
					<li>Ngồi sao cho camera thấy bạn từ đầu tới bụng, cả hai khuỷu tay.</li>
					<li>Mỗi lần ký: <b>giơ tay lên, ký một từ, rồi hạ tay xuống hẳn</b>. Web tự biết lúc bắt đầu và kết thúc.</li>
					<li>Khi trình duyệt hỏi, hãy cho phép dùng camera.</li>
				</ol>
				<p>Bạn sẽ: xem 6 video và chọn nghĩa, học 3 từ (ít nhất 45 giây), tự ký lại 3 từ, rồi xem lại 6 video.</p>
				<button class="nut" onclick={() => hetBuoc()} data-testid="tiep">Mình sẵn sàng</button>
			</section>
		{:else if buoc.loai === 'nhan-dien'}
			{@const b = buoc}
			{#key b.ten}
				<BaiNhanDien
					cau={b.cau}
					{tepVideo}
					tieuDe={b.ten === 'truoc-hoc' ? 'Trước khi học' : 'Sau khi học'}
					onTraLoi={(c, chon, ms) =>
						ghi('tra-loi', { tu: c.tu.tu, tra_loi: chon.tu, dung: chon.i === c.tu.i, ms })}
					onXong={() => hetBuoc()}
				/>
			{/key}
		{:else if buoc.loai === 'hoc'}
			{@const b = buoc}
			{#key b.ten}
				<HocBo
					tu={b.tu}
					phanHoi={b.phanHoi}
					giayToiThieu={giayThu ?? b.giayToiThieu}
					giayToiDa={giayThu ? giayThu * 2 : b.giayToiDa}
					{tepVideo}
					{giaLap}
					onKy={(k) => ghiKy(k, b)}
					onSuCo={ghiSuCo}
					onXong={(fps) => hetBuoc({ fps })}
				/>
			{/key}
		{:else if buoc.loai === 'ky-lai'}
			{@const b = buoc}
			<KyLai
				tu={b.tu}
				{giaLap}
				onKy={(k) => ghiKy(k, b)}
				onBoQua={(t) => ghi('bo-qua', { tu: t.tu })}
				onSuCo={ghiSuCo}
				onXong={(fps) => hetBuoc({ fps })}
			/>
		{:else}
			<section class="the xong" data-testid="xong">
				{#if rutLui}
					<h1>Cảm ơn bạn</h1>
					<p>Bạn đã dừng tham gia. Dữ liệu của mã {nguoi.ma} sẽ không được dùng.</p>
				{:else}
					<h1>Xong rồi, cảm ơn bạn!</h1>
					<div class="o-ma" data-testid="ma-cuoi">
						<p class="nhan-nho">Mã của bạn</p>
						<p class="ma-to" data-testid="ma-nguoi">{nguoi.ma}</p>
						<button class="nut vien nho" onclick={chepMa} data-testid="chep-ma">{daChep ? 'Đã chép ✓' : 'Chép mã'}</button>
					</div>
					<p><b>Chép mã này vào ô “Mã của bạn” trong Google Form</b>, rồi trả lời các câu cuối nhé. Không có mã thì nhóm không ghép được kết quả của bạn.</p>
					{#if CAU_HINH.linkFormOnline}
						<a class="nut" href={CAU_HINH.linkFormOnline}>Mở lại Google Form</a>
					{:else}
						<p class="phu">Google Form vẫn đang mở ở tab trước của trình duyệt.</p>
					{/if}
					<p class="phu">Nhờ bạn chưa kể các từ vừa học cho bạn bè sắp làm khảo sát, để kết quả công bằng.</p>
				{/if}
			</section>
		{/if}
	{/if}

	{#if quanLy}
	<details class="nhom">
		<summary>Dành cho người hướng dẫn</summary>
		<p data-testid="trang-thai-gui">
			Đã lưu trên máy: {gui.daLuu} dòng · Chờ gửi: {gui.choGui} dòng
			{#if gui.loi}<br /><span class="loi">{gui.loi}</span>{/if}
		</p>
		<div class="nut-ds">
			<button class="nut vien nho" onclick={() => hangDoi?.gui()}>Gửi lại ngay</button>
			<button class="nut vien nho" onclick={taiVe}>Tải toàn bộ kết quả trên máy (CSV)</button>
			{#if nguoi}<button class="nut vien nho" onclick={nguoiTiepTheo}>Về màn hình bắt đầu</button>{/if}
				<button class="nut vien nho" onclick={xoaDuLieuThu} data-testid="xoa-du-lieu">Xoá dữ liệu thử trên máy này</button>
		</div>
	</details>
	{/if}
</div>

<style>
	.trang-tn {
		display: grid;
		gap: 16px;
		padding-top: 16px;
		padding-bottom: 32px;
	}
	.vao {
		max-width: 600px;
		display: grid;
		gap: 10px;
		justify-items: start;
	}
	.vao p,
	.vao h1 {
		margin: 0;
	}
	.o-ma {
		display: grid;
		justify-items: center;
		gap: 6px;
		padding: 16px;
		margin: 8px 0 12px;
		border: 2px solid var(--xanh);
		border-radius: var(--bo-vua);
	}
	.o-ma p {
		margin: 0;
	}
	.ma-to {
		font-size: 2.4rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		font-variant-numeric: tabular-nums;
		user-select: all;
	}
	.phu {
		color: var(--chu-phu);
	}
	.loi {
		color: var(--do-chu);
		font-weight: 700;
	}
	.dang-do {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.tien-trinh {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--chu-phu);
		font-weight: 750;
	}
	.nut-chu {
		font: inherit;
		background: none;
		border: none;
		color: var(--chu-phu);
		text-decoration: underline;
		cursor: pointer;
	}
	.nut-ds {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.xong {
		display: grid;
		gap: 10px;
		justify-items: start;
	}
	.nhom {
		color: var(--chu-phu);
		font-size: 0.9rem;
	}
	.nhom summary {
		cursor: pointer;
		font-weight: 750;
	}
</style>
