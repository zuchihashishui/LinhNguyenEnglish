# Hệ thống điểm danh học sinh - Linh English

Trang web điểm danh học sinh theo từng lớp / từng buổi, có chấm điểm bài cũ + bài tập, nhận xét của giáo viên, **tổng hợp nhận xét tháng bằng AI (LLM)** dành cho học sinh tiểu học (cấp 1, lớp 1–5).

Thiết kế chi tiết xem trong [`DESIGN.md`](./DESIGN.md).

---

## Tính năng

### Cho giáo viên
- Quản lý lớp học (thêm / sửa / xoá / mở lớp).
- Quản lý học sinh trong từng lớp (họ tên, mã HS, giới tính, ngày sinh).
- Tạo buổi học theo ngày + chủ đề + ghi chú.
- Điểm danh từng buổi: **Có mặt / Vắng**.
- Chấm **điểm bài cũ (1-10)**, **điểm bài tập (1-10)**, hoặc xếp loại (Tốt / Khá / Trung bình / Yếu).
- Ghi nhận xét riêng cho từng học sinh trong từng buổi.
- Lưu nhiều lần (đã điểm danh có thể chỉnh sửa sau).
- Điều hướng nhanh giữa các buổi (◀ Trước / Sau ▶ / chọn ngày / Hôm nay).
- Tick nhanh cả lớp: tất cả có mặt / tất cả vắng / đảo ngược.
- Tự động gợi ý xếp loại khi nhập điểm bài cũ.

### Thống kê
- Thống kê điểm danh theo tháng (cả lớp + từng học sinh).
- Tỉ lệ chuyên cần, số buổi có mặt/vắng/chưa tick, ĐTB bài cũ, ĐTB bài tập.
- Lịch sử điểm danh chi tiết từng buổi của mỗi học sinh.

### AI – Tổng hợp nhận xét tháng bằng LLM
- Dựa trên tất cả nhận xét + dữ liệu điểm danh + điểm bài cũ + điểm bài tập của học sinh trong tháng.
- Tự động phát hiện cấp học (cấp 1 / lớp 1-5) để tạo giọng văn phù hợp với học sinh tiểu học.
- Prompt cấu trúc 4 phần: (1) chuyên cần, (2) điểm mạnh, (3) điểm cần cải thiện, (4) gợi ý phụ huynh hỗ trợ ở nhà.
- Hỗ trợ mọi OpenAI-compatible API (OpenAI, OpenRouter, Ollama local, LM Studio, v.v.).
- **API key chỉ lưu trong `localStorage` của trình duyệt**, không gửi lên server.

### Quản lý tài khoản
- **Đổi mật khẩu** cho chính mình (bắt buộc nhập đúng mật khẩu hiện tại).
- **Reset mật khẩu** cho giáo viên khác (chỉ admin).
- Tự đăng xuất khi hết phiên.

### Bản nháp tự động (auto-save draft)
- Khi đang điểm danh, mỗi thay đổi (tick có mặt, nhập điểm, gõ nhận xét) sẽ **tự động lưu tạm vào `localStorage`** của trình duyệt (sau 300ms).
- Nếu lỡ tay **reload trang / mất mạng / trình duyệt crash**, lần mở lại hệ thống sẽ hỏi **"Khôi phục bản nháp?"** → OK để lấy lại dữ liệu, Hủy để bỏ.
- Cảnh báo trước khi rời trang / đóng tab khi có draft chưa lưu.
- Sau khi bấm "💾 Lưu điểm danh" thành công, draft tự động được xóa.
- Nút "🗑 Bỏ nháp" cho phép hủy draft thủ công và tải lại dữ liệu gốc từ server.
- Dữ liệu draft **chỉ lưu trong trình duyệt**, không gửi lên server.

### Cho admin
- Quản lý giáo viên (xem, thêm, sửa, xoá, reset mật khẩu).
- Chỉ định giáo viên phụ trách lớp.
- Phân quyền admin/teacher thường.

### UI/UX
- Responsive đầy đủ cho **laptop** và **iPhone 17 Pro Max** (430×932 viewport).
- Dark mode tự động theo OS.
- Bảng cuộn ngang mượt trên mobile, modal scroll khi dài, sticky date-nav.

---

## Công nghệ

| Phần | Công nghệ |
|------|-----------|
| Backend | Node.js (Express) + MySQL (`mysql2`) |
| Frontend | HTML + CSS + JavaScript thuần (SPA dùng hash router) |
| Database | MySQL 5.7+ / 8.0 |
| Mock mode | In-memory, không cần DB |
| LLM | OpenAI-compatible API |

---

## Hai chế độ chạy

| Chế độ  | Khi nào dùng | Biến `.env` | Dữ liệu |
|---------|--------------|-------------|---------|
| **MOCK**  | Chưa cài MySQL, muốn xem giao diện / thử | `USE_MOCK=1` | In-memory, có sẵn 1 lớp 10 HS + 1 buổi |
| **MYSQL** | Dùng thật, lưu dữ liệu lâu dài | `USE_MOCK=0` | MySQL theo `database/schema.sql` |

File `backend/.env` mặc định `USE_MOCK=1`. Khi muốn chuyển sang MySQL, đổi thành `USE_MOCK=0` và cấu hình `DB_USER` / `DB_PASSWORD`.

---

## Cấu trúc thư mục

```
Linh_English/
├── README.md
├── DESIGN.md
├── database/
│   ├── schema.sql
│   └── migrations/
│       ├── 001_init.sql
│       ├── 002_add_exercise_score.sql
│       └── 003_add_session_date_index.sql
├── backend/
│   ├── package.json
│   ├── server.js               # Mount routes
│   ├── auth.js                 # hashPassword / verifyPassword / middleware
│   ├── db.js                   # MySQL pool
│   ├── init-db.js              # Tạo schema + seed
│   ├── migrate.js              # Chạy migrations
│   ├── dump-utf8.js            # Backup DB
│   ├── .env.example
│   ├── .env                    # USE_MOCK=1
│   └── routes/
│       ├── auth.js             # login / register / change-password
│       ├── teachers.js         # CRUD + reset-password
│       ├── classes.js          # CRUD lớp
│       ├── students.js         # CRUD HS + notes + history + stats
│       ├── sessions.js         # CRUD buổi học
│       ├── attendances.js      # Lưu điểm danh (upsert)
│       ├── stats.js            # Thống kê theo lớp
│       ├── ai.js               # Tổng hợp LLM
│       └── mock.js             # Routes cho chế độ MOCK
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

---

## Cài đặt

### Cách nhanh – Chạy MOCK (không cần MySQL)

Yêu cầu: **Node.js 18+**.

```bash
cd backend
npm install
npm start
```

Mở **http://localhost:3000**. Có sẵn 1 lớp mẫu: **"Lớp 10A1 - Tiếng Anh"** với 10 HS + 1 buổi học hôm nay.

### Cài đặt đầy đủ – Dùng MySQL thật

**1. Tạo database:**

```bash
mysql -u root -p < database/schema.sql
```

(hoặc mở file `database/schema.sql` trong phpMyAdmin / Workbench / Navicat rồi chạy)

Script tạo database `linh_english_attendance` với 5 bảng (`teachers`, `classes`, `students`, `sessions`, `attendances`, `migrations`) và một số index / constraint cần thiết.

**2. Chạy migrations (nếu DB cũ):**

```bash
cd backend
node migrate.js
```

**3. Khởi tạo dữ liệu mẫu:**

```bash
node init-db.js
```

Seed sẵn: 4 giáo viên (`admin/linh/mai/tuan` – mật khẩu `123456`), 3 lớp, 15 học sinh, ~29 buổi học + 150 attendances mẫu.

**4. Cấu hình `.env`:**

```
USE_MOCK=0
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=linh_english_attendance
PORT=3000
```

**5. Chạy:**

```bash
cd backend
npm install
npm start
```

Mở **http://localhost:3000**.

---

## Tài khoản mẫu

Mật khẩu chung: `123456`

| Username | Họ tên | Vai trò |
|----------|--------|---------|
| `admin` | Nguyễn Văn An | Quản trị viên (admin) |
| `linh` | Trần Thị Linh | Giáo viên (lớp 3A) |
| `mai` | Nguyễn Thị Mai | Giáo viên (lớp 4B) |
| `tuan` | Lê Minh Tuấn | Giáo viên (lớp 5C) |

---

## API Endpoints

Tất cả API (trừ `/api/auth/*` và `/api/health`) yêu cầu header `X-Teacher-Id`.

### Auth

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `POST` | `/api/auth/login` | Đăng nhập. Body: `{username, password}` |
| `POST` | `/api/auth/register` | Đăng ký GV mới (không cần token) |
| `POST` | `/api/auth/change-password` | Đổi mật khẩu (cần mk hiện tại đúng). Body: `{current_password, new_password, new_password_confirm}` |

### Teachers (chỉ admin)

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `GET`  | `/api/teachers` | Danh sách GV |
| `POST` | `/api/teachers` | Tạo GV mới |
| `PUT`  | `/api/teachers/:id` | Sửa họ tên / quyền admin |
| `DELETE` | `/api/teachers/:id` | Xoá GV (không xoá chính mình) |
| `PUT`  | `/api/teachers/:id/reset-password` | Reset mk cho GV khác. Body: `{new_password, new_password_confirm}` |

### Classes

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `GET`  | `/api/classes` | Danh sách lớp (admin: tất cả, GV: của mình) |
| `POST` | `/api/classes` | Tạo lớp mới |
| `PUT`  | `/api/classes/:id` | Sửa lớp |
| `DELETE` | `/api/classes/:id` | Xoá lớp |

### Students

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `GET`  | `/api/classes/:id/students` | HS của 1 lớp |
| `POST` | `/api/classes/:id/students` | Thêm HS |
| `GET`  | `/api/students/:id` | Thông tin 1 HS |
| `PUT`  | `/api/students/:id` | Sửa HS |
| `DELETE` | `/api/students/:id` | Xoá HS |
| `GET`  | `/api/students/:id/notes?year=&month=` | Nhận xét trong tháng của HS (cho LLM) |
| `GET`  | `/api/students/:id/history?year=&month=` | Tổng quan tháng + lịch sử buổi học |
| `GET`  | `/api/students/:id/stats` | Thống kê all-time |

### Sessions

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `GET`  | `/api/classes/:id/sessions` | Buổi học của lớp |
| `POST` | `/api/classes/:id/sessions` | Tạo buổi học |
| `GET`  | `/api/sessions/:id` | Chi tiết buổi + danh sách điểm danh |
| `PUT`  | `/api/sessions/:id` | Sửa buổi |
| `DELETE` | `/api/sessions/:id` | Xoá buổi |

### Attendances

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `POST` | `/api/sessions/:id/attendances` | Lưu điểm danh (upsert). Body: `{items: [{student_id, is_present, lesson_score, exercise_score, lesson_grade, teacher_note}]}` |

### Stats

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `GET`  | `/api/classes/:id/stats?year=&month=` | Thống kê tháng cho 1 lớp |

### AI

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `POST` | `/api/ai/summarize-notes` | Tổng hợp nhận xét tháng bằng LLM. Body: `{api_key, base_url, model, student_id, student_name, year, month, grade_level, monthly_summary, notes}` |

### Misc

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `GET`  | `/api/health` | Health check (`{ok, mode, time}`) |

---

## Tổng hợp nhận xét bằng AI

Hệ thống cho phép giáo viên bấm 1 nút để gọi LLM tổng hợp tất cả nhận xét trong tháng của học sinh thành **1 đoạn nhận xét chung (4-7 câu, 120-200 từ)**.

### Cấu trúc prompt LLM

**System prompt:**

> Bạn là giáo viên tiếng Anh tại Việt Nam, viết nhận xét tổng kết hàng tháng cho học sinh **tiểu học (cấp 1, lớp 1-5)**. Giọng văn ấm áp, khích lệ, phù hợp lứa tuổi. Đề cập: (1) sự chuyên cần/thái độ học tập, (2) điểm mạnh nổi bật, (3) điểm cần cải thiện, (4) gợi ý phụ huynh hỗ trợ ở nhà. Trả về **đúng 1 đoạn văn tiếng Việt**, không bullet point, không JSON.

**User prompt gồm:**

- Tên học sinh, tháng/năm
- **Thống kê điểm danh tháng:** tổng buổi, có mặt, vắng, chưa tick, tỉ lệ chuyên cần
- **Điểm trung bình** bài cũ + bài tập
- **Nhật ký từng buổi:** ngày, có/vắng, điểm bài cũ, điểm bài tập, xếp loại, nhận xét GV

### Cấu hình

Trong trang thống kê học sinh, có form nhập:

- **API key** – bắt buộc (lưu localStorage)
- **Base URL** – mặc định `https://api.openai.com`, có thể dùng OpenRouter, Ollama local, v.v.
- **Model** – mặc định `gpt-4o-mini`, có thể đổi thành `gpt-4o`, `claude-3-5-sonnet` (qua OpenRouter), v.v.

**Lưu ý bảo mật:** API key chỉ lưu trong `localStorage` của trình duyệt người dùng, **không bao giờ gửi lên server**. Server chỉ làm proxy chuyển tiếp request tới OpenAI.

### Prompt mẫu cho cấp 1

Nếu `grade_level` (cấp học của lớp) nằm trong 1-5, hệ thống coi như cấp 1 và tạo prompt phù hợp với học sinh tiểu học. Ngược lại (THCS/THPT) sẽ dùng prompt trung học.

---

## Ghi chú quan trọng

- Mỗi lớp mỗi ngày chỉ tạo được 1 buổi học (UNIQUE constraint).
- Mỗi HS mỗi buổi chỉ có 1 dòng điểm danh (lưu lại sẽ UPSERT).
- Có thể dùng **điểm số** (1-10) hoặc **xếp loại** (Tốt/Khá/TB/Yếu) hoặc cả hai.
- Khi nhập điểm bài cũ, hệ thống tự gợi ý xếp loại tương ứng (≥9: Tốt, ≥7: Khá, ≥5: TB, còn lại: Yếu).
- Khi bấm "Điểm danh" mà chưa có buổi hôm nay, hệ thống sẽ hỏi xác nhận trước khi tạo.
- Thống kê phân biệt rõ **"Chưa tick"** (HS chưa được điểm danh) và **"Vắng"** (đã tick vắng).
- Click tên HS trong bảng thống kê → mở trang chi tiết lịch sử điểm danh.
- **Auto-save draft**: khi đang điểm danh, mỗi thay đổi đều tự lưu vào `localStorage` để tránh mất dữ liệu khi reload / mất điện / trình duyệt crash. Mở lại trang sẽ có hộp thoại hỏi khôi phục.

### Responsive

UI đã test kỹ cho:
- **Laptop/desktop** (≥ 1100px)
- **Tablet** (768px)
- **iPhone 17 Pro Max** (430×932 portrait) và ngang (932×430)
- **iPhone nhỏ** (≤ 380px)

Các bảng có 5-9 cột sẽ tự động ẩn 1 số cột phụ trên mobile (Ngày sinh, Ghi chú, Chưa tick, v.v.) để hiển thị gọn. Modal chuyển sang 2 nút xếp dọc full-width trên mobile.

---

## ⚠️ Cảnh báo bảo mật

**Hệ thống này dùng cho DEMO / học tập, KHÔNG dùng cho production thật.**

- **Xác thực chỉ dựa vào header `X-Teacher-Id`**. Bất kỳ ai biết ID giáo viên đều có thể truy cập dữ liệu của người đó. Production cần thay bằng JWT/session token thật.
- **Mật khẩu hash bằng `crypto.scrypt`**, lưu dạng `salt:hash` — phần này an toàn.
- **Không có CSRF protection, rate limiting, audit log**.
- **API key LLM chỉ lưu localStorage** (frontend) → nếu máy bị compromise, key có thể bị lộ.

---

## Reset dữ liệu mẫu

```bash
cd backend
node init-db.js
```

Script sẽ:
1. Tạo lại database `linh_english_attendance` (xoá sạch các bảng cũ).
2. Seed lại 4 GV (admin/linh/mai/tuan — pass `123456`).
3. Seed lại 3 lớp, 15 HS, ~29 buổi học + 150 attendances mẫu.

## Backup database

```bash
cd backend
node dump-utf8.js
```

File backup sẽ được lưu dạng `backup_linh_english_attendance_utf8_YYYYMMDD_HHMMSS.sql` trong cùng thư mục `backend/`, encoding UTF-8 không BOM.
