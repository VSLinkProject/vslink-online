# VSLink Online

Web thực nghiệm **học ký hiệu tiếng Việt qua webcam** của nhóm VSLink (PIISE 2026).

Người tham gia mở Google Form, theo link sang web, làm phần ký hiệu bằng webcam, rồi chép mã ở màn cuối về Form. Mô hình nhận dạng 400 từ chạy **hoàn toàn trên trình duyệt**: hình ảnh không rời khỏi máy người dùng, web chỉ ghi chữ và số.

## Luồng người tham gia

1. Bấm **Bắt đầu**. Web tự sinh mã ngẫu nhiên dạng `O-K7P3X`.
2. Bài nhận diện 6 ký hiệu: xem video, chọn nghĩa.
3. Học 3 từ, có nhận xét Đúng / Gần đúng / Chưa đúng và chỉ ra bộ phận khác mẫu. Học ít nhất 45 giây mới được chuyển phần, tự dừng ở 1:30.
4. Ký lại 3 từ không xem mẫu.
5. Bài nhận diện 6 ký hiệu lần hai.
6. Màn cuối hiện mã và nút **Chép mã** để dán vào Google Form.

Phiếu đồng ý và các câu hỏi khảo sát nằm trong Google Form.

Đổi từ, thời gian học, link Form: `src/lib/thuc-nghiem/kich-ban.ts` (`CAU_HINH`).

## Dữ liệu ghi lại

Mỗi sự kiện là một dòng gắn với mã người tham gia: câu trả lời bài nhận diện, từng lần ký (hạng của từ đúng, top 5, mức đánh giá, độ dài), thời gian từng phần, thiết bị, tốc độ khung hình, lỗi camera / mô hình. **Không** có tên, email, hình ảnh hay toạ độ.

Dữ liệu được lưu tạm trên máy rồi tự gửi qua Cloudflare Worker về Google Sheet (tab **Thực nghiệm**).

## Chạy trên máy

Cần Node ≥ 22.12.

```bash
npm ci
npm run dev
```

Mở `http://localhost:5173/`.

Kiểm thử:

```bash
npm run check
npm test
```

## Đưa lên GitHub Pages

1. Đẩy code lên nhánh `main` của repo.
2. **Settings → Pages → Source: GitHub Actions**.
3. Workflow tự chạy; web có ở `https://<tai-khoan>.github.io/<ten-repo>/`.

## Nhận kết quả về Google Sheet

1. Tạo Google Sheet → **Tiện ích mở rộng → Apps Script** → dán [`worker/gop-y-apps-script.gs`](worker/gop-y-apps-script.gs), đổi `KHOA` thành một chuỗi bí mật → **Triển khai** dạng *Ứng dụng web* (thực thi: Tôi; truy cập: Bất kỳ ai) → copy URL `/exec`.
2. Tạo Cloudflare Worker → dán [`worker/meo-worker.js`](worker/meo-worker.js) → thêm biến:

   | Tên | Loại | Giá trị |
   | --- | --- | --- |
   | `GOP_Y_URL` | Secret | URL Apps Script |
   | `GOP_Y_KHOA` | Secret | chuỗi `KHOA` ở bước 1 |
   | `ALLOWED_ORIGINS` | Text | địa chỉ web, ví dụ `https://<tai-khoan>.github.io` |

3. Ghi địa chỉ Worker vào `static/cau-hinh.json` (`meo_api`), hoặc đặt biến `MEO_API` trong *Settings → Secrets and variables → Actions → Variables* của repo.

Không đưa `KHOA`, URL Apps Script hay bất kỳ khoá nào vào repo.

## Nguồn

Video mẫu: Từ điển Ngôn ngữ ký hiệu, dự án QIPEDC, Bộ GD&ĐT. Bộ dữ liệu: VSL400.

## Giấy phép

GPL-3.0, xem [`LICENSE`](LICENSE).
