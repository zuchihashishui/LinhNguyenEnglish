# Hệ thống điểm danh học sinh - Linh English

Trang web điểm danh học sinh theo từng lớp / từng buổi, có đánh giá bài cũ và nhận xét của giáo viên.

Xem chi tiết thiết kế trong [`DESIGN.md`](./DESIGN.md).

## Tính năng

- Quản lý lớp học (thêm / xoá / mở lớp).
- Quản lý học sinh trong từng lớp (họ tên, mã HS, giới tính, ngày sinh).
- Tạo buổi học theo ngày + chủ đề.
- Điểm danh từng buổi: Có mặt / Vắng.
- Chấm điểm bài cũ (1-10) hoặc xếp loại (Tốt / Khá / Trung bình / Yếu).
- Ghi nhận xét riêng cho từng học sinh trong từng buổi.
- Lưu lại nhiều lần (đã điểm danh có thể chỉnh sửa sau).
- Thống kê điểm danh theo tháng (cả lớp + từng học sinh).
- **Quản lý giáo viên** (chỉ admin): xem danh sách GV, thêm GV mới, xoá GV.
- Điều hướng nhanh giữa các buổi (Trước / Sau / chọn ngày / Hôm nay).
- Tick nhanh cả lớp: tất cả có mặt / tất cả vắng / đảo ngược.
- Tự động gợi ý xếp loại khi nhập điểm bài cũ.

## Công nghệ

- **Backend**: Node.js (Express) + MySQL (driver `mysql2`).
- **Frontend**: HTML + CSS + JavaScript thuần.
- **Database**: MySQL 5.7+ / 8.0. (Có **chế độ MOCK** chạy không cần MySQL để xem giao diện ngay.)

## Hai chế độ chạy

| Chế độ  | Khi nào dùng                                | Biến `.env`   | Dữ liệu                                  |
|---------|---------------------------------------------|---------------|-------------------------------------------|
| **MOCK**  | Chưa cài MySQL, muốn xem giao diện / thử   | `USE_MOCK=1`  | In-memory, có sẵn 1 lớp 10 học sinh + 1 buổi học |
| **MYSQL** | Dùng thật, lưu dữ liệu lâu dài              | `USE_MOCK=0`  | MySQL theo `database/schema.sql`          |

Trong file `backend/.env` (đã tạo sẵn) đang để `USE_MOCK=1` để bạn chạy thử ngay. Khi muốn chuyển sang MySQL thật, đổi thành `USE_MOCK=0` và cấu hình `DB_USER` / `DB_PASSWORD`.

## Cấu trúc thư mục

```
Linh_English/
├── DESIGN.md
├── README.md
├── database/
│   └── schema.sql
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   ├── mockData.js          # Dữ liệu giả lập (1 lớp, 10 học sinh, 1 buổi)
│   ├── .env.example
│   ├── .env                 # Mặc định USE_MOCK=1
│   └── routes/
│       ├── classes.js
│       ├── students.js
│       ├── sessions.js
│       ├── attendances.js
│       └── mock.js          # Routes cho chế độ MOCK
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Hướng dẫn cài đặt

### Cách nhanh nhất - Chạy chế độ MOCK (không cần MySQL)

Yêu cầu: **Node.js 18+**.

```bash
cd backend
npm install
npm start
```

Mở trình duyệt: **http://localhost:3000**

Bạn sẽ thấy ngay:
- 1 lớp mẫu: **"Lớp 10A1 - Tiếng Anh"** với 10 học sinh.
- 1 buổi học hôm nay: **"Unit 3: Teen Life - Speaking"** sẵn sàng để điểm danh.

Bấm vào lớp → bấm **✏️ Điểm danh** trên buổi học để thử:
- Tick **Có mặt** / bỏ tick (Vắng)
- Nhập **điểm bài cũ** (1–10) hoặc chọn **xếp loại** (Tốt/Khá/TB/Yếu)
- Gõ **nhận xét** cho từng em
- Bấm **💾 Lưu điểm danh** → bấm **👁️ Xem** để xem lại.

### Cài đặt đầy đủ - Dùng MySQL thật

#### 1. Chuẩn bị MySQL

Đảm bảo MySQL đã chạy trên máy (XAMPP, Laragon, MySQL Workbench, Docker, ...). Tạo database bằng cách chạy file `database/schema.sql`:

**Cách 1 - Dùng MySQL CLI:**

```bash
mysql -u root -p < database/schema.sql
```

**Cách 2 - Dùng phpMyAdmin / Workbench / Navicat:** mở file `database/schema.sql` rồi chạy toàn bộ.

Script sẽ tạo database `linh_english_attendance` với 4 bảng (`classes`, `students`, `sessions`, `attendances`) và thêm sẵn 2 lớp + 5 học sinh mẫu.

### 2. Cài đặt backend

Yêu cầu: **Node.js 18+**.

Sửa file `backend/.env` cho đúng thông tin MySQL của bạn, ví dụ:

```
USE_MOCK=0
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=linh_english_attendance
PORT=3000
```

Cài đặt thư viện và chạy:

```bash
cd backend
npm install
npm start
```

Nếu thành công sẽ thấy:

```
✅ Đã kết nối MySQL
🚀 Server đang chạy tại http://localhost:3000
```

### 3. Mở trang web

Truy cập: **http://localhost:3000**

Trang chủ hiện ra danh sách lớp. Bấm vào một lớp để:
- Thêm / xoá học sinh.
- Tạo buổi học mới.
- Bấm **"Điểm danh"** trên một buổi → đánh dấu Có mặt / Vắng, nhập điểm bài cũ, xếp loại, nhận xét → bấm **"Lưu điểm danh"**.

## API Endpoints (rút gọn)

| Method | Đường dẫn                                  | Mô tả                                   |
|--------|--------------------------------------------|-----------------------------------------|
| GET    | `/api/classes`                             | Danh sách lớp                           |
| POST   | `/api/classes`                             | Tạo lớp                                 |
| DELETE | `/api/classes/:id`                         | Xoá lớp                                 |
| GET    | `/api/classes/:id/students`                | Học sinh của lớp                        |
| POST   | `/api/classes/:id/students`                | Thêm học sinh                           |
| DELETE | `/api/students/:id`                        | Xoá học sinh                            |
| GET    | `/api/classes/:id/sessions`                | Buổi học của lớp                        |
| POST   | `/api/classes/:id/sessions`                | Tạo buổi học                            |
| GET    | `/api/sessions/:id`                        | Chi tiết buổi + danh sách điểm danh     |
| DELETE | `/api/sessions/:id`                        | Xoá buổi học                            |
| POST   | `/api/sessions/:id/attendances`            | Lưu điểm danh (upsert)                  |
| GET    | `/api/students/:id/stats`                  | Thống kê 1 học sinh                     |

## Ghi chú

- Mỗi lớp mỗi ngày chỉ tạo được 1 buổi học (đã có UNIQUE constraint).
- Mỗi học sinh mỗi buổi chỉ có 1 dòng điểm danh (lưu lại sẽ cập nhật dòng cũ).
- Có thể dùng **điểm số** (1-10) hoặc **xếp loại** (Tốt/Khá/TB/Yếu) hoặc cả hai.
- Khi nhập điểm bài cũ, hệ thống sẽ tự gợi ý xếp loại tương ứng (≥9: Tốt, ≥7: Khá, ≥5: TB, còn lại: Yếu).
- Khi bấm "📋 Điểm danh" mà chưa có buổi hôm nay, hệ thống sẽ hỏi xác nhận trước khi tạo.
- Trang thống kê phân biệt cột "Chưa tick" (HS chưa được điểm danh) và "Vắng" (đã tick vắng).
- Click tên học sinh trong bảng thống kê → mở trang chi tiết lịch sử điểm danh của HS đó.
- File `DESIGN.md` chứa toàn bộ sơ đồ database và luồng nghiệp vụ.

## ⚠️ Cảnh báo bảo mật (QUAN TRỌNG)

**Hệ thống này dùng cho mục đích DEMO / học tập, KHÔNG dùng cho production thật.**

- **Xác thực chỉ dựa vào header `X-Teacher-Id`** (gửi kèm mỗi request). Bất kỳ ai biết ID giáo viên đều có thể truy cập dữ liệu của người đó. Trong môi trường production cần thay bằng JWT/session token thật.
- **Mật khẩu hash bằng `crypto.scrypt`**, lưu dạng `salt:hash` — phần này an toàn.
- **Không có CSRF protection**, **không có rate limiting**, **không có audit log**.

## Reset dữ liệu mẫu

Sau nhiều lần thao tác thử, dữ liệu trong database có thể lệch so với mẫu ban đầu. Để reset về đúng dữ liệu seed từ `init-db.js`:

```bash
cd backend
node init-db.js
```

Script sẽ:
1. Tạo lại database `linh_english_attendance` (xoá sạch các bảng cũ).
2. Seed lại 4 giáo viên (admin/linh/mai/tuan — pass 123456).
3. Seed lại 3 lớp, 15 học sinh, 7 buổi học + attendances mẫu.
