// Luong thuc nghiem ONLINE tron ven voi "nguoi que" gia lap: trang goc -> /thuc-nghiem/ -> Bat dau
// (web tu sinh ma) -> bai truoc -> hoc 3 tu co phan hoi -> ky lai -> bai sau -> man cuoi hien ma.
// Thoi gian hoc rut con vai giay (&giay=), ket qua kiem trong bo nho may (khong co Worker).
import { expect, test, type Page } from '@playwright/test';
import { chuanBi } from './chung';

async function lamBaiNhanDien(page: Page, soCau: number, tong = soCau) {
	for (let k = 0; k < soCau; k++) {
		await expect(page.getByTestId('bai-nhan-dien')).toContainText(`Câu ${k + 1}/${tong}`);
		await page.getByTestId('dap-an').first().click();
	}
}

test('thuc nghiem online: trang goc chuyen toi thuc nghiem, web tu sinh ma va hien o cuoi', async ({ page }) => {
	test.setTimeout(180_000);
	const loi = await chuanBi(page);
	await page.goto('?gia-lap=1&giay=3&quan-ly=1');
	await expect(page).toHaveURL(/\/thuc-nghiem\/\?gia-lap=1&giay=3&quan-ly=1$/);
	await expect(page.locator('nav.dieu-huong')).toHaveCount(0);
	await expect(page.getByTestId('o-ma')).toHaveCount(0); // khong co o nhap ma
	await page.getByTestId('bat-dau-online').click();
	await page.getByTestId('tiep').click(); // huong dan
	// video QIPEDC in san ten tu o goc tren ben phai: bai nhan dien phai che lai
	await expect(page.getByTestId('bai-nhan-dien').getByTestId('che-nhan')).toBeVisible();
	await lamBaiNhanDien(page, 6);

	await expect(page.getByTestId('hoc-bo')).toHaveAttribute('data-phan-hoi', 'true');
	await page.getByRole('button', { name: 'Bật camera' }).click();
	await expect(page.getByTestId('ket-luan')).toBeVisible({ timeout: 60_000 });
	await expect(page.getByTestId('hoc-xong')).toBeEnabled({ timeout: 30_000 });
	await page.getByTestId('hoc-xong').click();

	await expect(page.getByTestId('ky-lai')).toBeVisible();
	await page.getByRole('button', { name: 'Bật camera' }).click();
	await expect(page.getByTestId('da-ghi-nhan')).toBeVisible({ timeout: 60_000 });
	for (let k = 2; k <= 3; k++) {
		await expect(page.getByTestId('ky-lai')).toContainText(`Từ ${k}/3`);
		await page.getByTestId('khong-nho').click();
	}
	await lamBaiNhanDien(page, 6);

	await expect(page.getByTestId('xong')).toBeVisible();
	const ma = (await page.getByTestId('ma-nguoi').textContent())?.trim() ?? '';
	expect(ma).toMatch(/^O-[A-HJKMNP-Z2-9]{5}$/);

	const dong = await page.evaluate(() => JSON.parse(localStorage.getItem('vslink-tn-tat-ca') ?? '[]'));
	const loai = (buoc: string, suKien: string) => dong.filter((d: { buoc: string; su_kien: string }) => d.buoc === buoc && d.su_kien === suKien);
	expect(dong.every((d: { ma: string; phan: string }) => d.ma === ma && d.phan === 'online')).toBe(true);
	expect(loai('truoc-hoc', 'tra-loi')).toHaveLength(6);
	expect(loai('sau-hoc', 'tra-loi')).toHaveLength(6);
	expect(loai('hoc', 'ky')[0]).toMatchObject({ bo: 'online', phan_hoi: true });
	expect(loai('ky-lai', 'ky')).toHaveLength(1);
	expect(loai('ky-lai', 'bo-qua')).toHaveLength(2);
	expect(loai('huong-dan', 'thiet-bi')).toHaveLength(1);
	expect(dong.some((d: { su_kien: string; ms: number }) => d.su_kien === 'tai-mo-hinh' && d.ms >= 0)).toBe(true);
	// khong co link Worker -> bao ro la chi luu tren may
	await page.locator('details.nhom summary').click();
	await expect(page.getByTestId('trang-thai-gui')).toContainText('chỉ lưu trên máy');
	page.once('dialog', (d) => d.accept());
	await page.getByTestId('xoa-du-lieu').click();
	await expect(page.getByTestId('trang-thai-gui')).toContainText('Đã lưu trên máy: 0 dòng');
	expect(loi).toEqual([]);
});

test('thuc nghiem: nguoi tham gia khong thay muc danh cho nguoi huong dan', async ({ page }) => {
	const loi = await chuanBi(page);
	await page.goto('thuc-nghiem/?gia-lap=1');
	await expect(page.getByTestId('bat-dau-online')).toBeVisible();
	await expect(page.locator('details.nhom')).toHaveCount(0);
	await expect(page.getByText('Worker')).toHaveCount(0);
	expect(loi).toEqual([]);
});

test('thuc nghiem: tai lai giua chung thi lam tiep dung buoc, dung ma cu', async ({ page }) => {
	const loi = await chuanBi(page);
	await page.goto('thuc-nghiem/?gia-lap=1');
	await page.getByTestId('bat-dau-online').click();
	const ma = (await page.locator('.tien-trinh span').textContent())?.match(/O-[A-Z2-9]{5}/)?.[0] ?? '';
	expect(ma).not.toBe('');
	await page.getByTestId('tiep').click();
	await lamBaiNhanDien(page, 2, 6);
	await page.reload();
	await page.getByRole('button', { name: `Làm tiếp ${ma}` }).click();
	await expect(page.getByTestId('bai-nhan-dien')).toContainText('Câu 1/6');
	expect(loi).toEqual([]);
});

test('thuc nghiem: link co san ma ?ma=O07 thi dung ma do', async ({ page }) => {
	const loi = await chuanBi(page);
	await page.goto('thuc-nghiem/?ma=o7&gia-lap=1');
	await page.getByTestId('bat-dau-online').click();
	await expect(page.locator('.tien-trinh')).toContainText('Mã O07');
	expect(loi).toEqual([]);
});
