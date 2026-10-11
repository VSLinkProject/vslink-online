// Thuc nghiem nguoi dung ONLINE (PIISE 2026) — phan thuan, dung duoc trong unit test.
// Nguoi tham gia mo trang tu Google Form, web tu sinh ma O-XXXXX -> danh sach buoc co dinh.
// Moi nguoi cung mot bo cau hoi, cung thu tu cau (xao bang hat giong co dinh).
// Dong y tham gia, cau hoi nen, do tu tin va cam nhan nam trong Google Form, khong o tren web.
import { TU_VUNG, type Tu } from '$lib/loi/tu-vung';
import type { MucDo } from '$lib/loi/danh-gia';

export const PHIEN_BAN_THUC_NGHIEM = 'tn-online-2026-10-11';

/**
 * TU TAM CHON — nhom chot lai truoc khi chay that. Chi dung tu da co video mau DA DUYET
 * (static/du-lieu/video-mau.json, trang_thai "tot"), vi bai nhan dien can video that.
 * MẸ va ĐỌC (thiet ke ban dau) chua co video duyet nen tam doi sang BỐ, XEM.
 */
export const CAU_HINH = {
	online: {
		hoc: ['Bố', 'Sách', 'Xem'],
		/** tu gay nhieu cho bai nhan dien 6 ky hieu (khong hoc) */
		nhieu: ['Ông nội', 'Giấy nháp', 'Nói chuyện'],
		/** hoc it nhat giayHocToiThieu roi moi duoc bam sang buoc sau; den giayHocToiDa thi tu dung */
		giayHocToiThieu: 45,
		giayHocToiDa: 90
	},
	soDapAn: 4,
	/** link Google Form: de trong thi chi nhac "quay lai tab Form" */
	linkFormOnline: ''
} as const;

export type Phan = 'online';
export type Bo = 'online';
export type NguoiThamGia = { ma: string; phan: Phan; so: number; nhom: null };

/** Bang chu cho ma tu sinh: bo 0/O, 1/I/L de chep tay khong nham. */
export const CHU_MA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const MA_ONLINE = /^O-?([A-HJKMNP-Z2-9]{5})$/;

/**
 * Ma tu sinh cho moi nguoi tham gia (khong can phat ma): "O-" + 5 ky tu ngau nhien.
 * 31^5 ≈ 28,6 trieu ma: 200 nguoi thi kha nang trung nhau ~0,07%.
 */
export function taoMaOnline(ngauNhien: (n: number) => Uint32Array = (n) => crypto.getRandomValues(new Uint32Array(n))): string {
	return 'O-' + Array.from(ngauNhien(5), (x) => CHU_MA[x % CHU_MA.length]).join('');
}

/** "o-k7p3x" / "OK7P3X" -> O-K7P3X; "o7" / "O007" -> O07 (link co san ma). Sai dang -> null. */
export function docMa(vao: string): NguoiThamGia | null {
	const sach = vao.trim().toUpperCase();
	const t = MA_ONLINE.exec(sach);
	if (t) return { ma: `O-${t[1]}`, phan: 'online', so: 0, nhom: null };
	const m = /^O0*(\d{1,3})$/.exec(sach);
	if (!m) return null;
	const so = Number(m[1]);
	if (so < 1) return null;
	return { ma: `O${String(so).padStart(2, '0')}`, phan: 'online', so, nhom: null };
}

/** Bo sinh so gia ngau nhien co hat giong (mulberry32): cung hat -> cung day so. */
export function hatGiong(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function xao<T>(ds: readonly T[], r: () => number): T[] {
	const a = ds.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/** Ten tu -> muc tu vung. Sai ten la loi cau hinh: bao ngay, khong im lang bo qua. */
export function tuTheoTen(ten: string, tuVung: Tu[] = TU_VUNG.tu): Tu {
	const t = tuVung.find((x) => x.tu === ten);
	if (!t) throw new Error(`[thuc-nghiem] Không có từ “${ten}” trong 400 từ`);
	return t;
}

export type CauNhanDien = { tu: Tu; dapAn: Tu[] };

/**
 * Bai nhan dien: moi tu mot video, chon nghia trong soDapAn dap an. Dap an nhieu lay tu
 * chinh cac tu trong bai (khong phai tu la), nen nguoi hoc phai phan biet cac tu vua hoc.
 * Hat giong co dinh theo ten bai -> moi nguoi cung de, cung thu tu.
 */
export function taoBaiNhanDien(ds: Tu[], seed: number, soDapAn: number = CAU_HINH.soDapAn): CauNhanDien[] {
	const r = hatGiong(seed);
	return xao(ds, r).map((tu) => {
		const khac = xao(
			ds.filter((x) => x.i !== tu.i),
			r
		).slice(0, soDapAn - 1);
		return { tu, dapAn: xao([tu, ...khac], r) };
	});
}

export type Buoc =
	| { loai: 'huong-dan'; ten: 'huong-dan' }
	| { loai: 'nhan-dien'; ten: 'truoc-hoc' | 'sau-hoc'; cau: CauNhanDien[] }
	| { loai: 'hoc'; ten: 'hoc'; bo: Bo; tu: Tu[]; phanHoi: boolean; giayToiThieu: number; giayToiDa: number }
	| { loai: 'ky-lai'; ten: 'ky-lai'; tu: Tu[] }
	| { loai: 'xong'; ten: 'xong' };

const HAT = { truoc: 101, sau: 202, kyLai: 303 };

/** Toan bo buoc cua mot nguoi, theo dung thu tu trong phieu thiet ke. */
export function taoKichBan(_n: NguoiThamGia, tuVung: Tu[] = TU_VUNG.tu): Buoc[] {
	const ten = (ds: readonly string[]) => ds.map((x) => tuTheoTen(x, tuVung));
	const hoc = ten(CAU_HINH.online.hoc);
	const sau = [...hoc, ...ten(CAU_HINH.online.nhieu)];
	return [
		{ loai: 'huong-dan', ten: 'huong-dan' },
		{ loai: 'nhan-dien', ten: 'truoc-hoc', cau: taoBaiNhanDien(sau, HAT.truoc) },
		{ loai: 'hoc', ten: 'hoc', bo: 'online', tu: hoc, phanHoi: true, giayToiThieu: CAU_HINH.online.giayHocToiThieu, giayToiDa: CAU_HINH.online.giayHocToiDa },
		{ loai: 'ky-lai', ten: 'ky-lai', tu: xao(hoc, hatGiong(HAT.kyLai)) },
		{ loai: 'nhan-dien', ten: 'sau-hoc', cau: taoBaiNhanDien(sau, HAT.sau) },
		{ loai: 'xong', ten: 'xong' }
	];
}

/** Su co ky thuat trong luc lam (camera, mo hinh), de tach "lam kem" voi "may chay kem". */
export type SuCo = { suKien: 'loi-camera' | 'loi-mo-hinh' | 'camera-san-sang'; chiTiet: string; ms: number | null };

/** Mot lan ky da cham (trong luc hoc hoac ky lai). */
export type LanKy = { tu: Tu; hang: number; mucDo: MucDo; top5: string[]; lan: number; ms: number };
