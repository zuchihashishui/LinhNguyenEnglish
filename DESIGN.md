# Thiết kế Hệ thống Điểm danh Học sinh - Linh English

## 1. Mục tiêu

Hệ thống giúp giáo viên tiếng Anh (đặc biệt **tiểu học – cấp 1, lớp 1-5**):

- Chọn lớp học cần điểm danh cho mỗi buổi.
- Điểm danh: **Có mặt / Vắng**.
- Chấm **điểm bài cũ (1-10)** + **điểm bài tập (1-10)** + **xếp loại** (Tốt/Khá/TB/Yếu).
- Ghi **nhận xét** cho từng học sinh trong buổi học.
- Xem lịch sử điểm danh và thống kê theo tháng (cả lớp + từng HS).
- **Tổng hợp nhận xét tháng bằng LLM** thành 1 đoạn nhận xét chung, giọng văn ấm áp phù hợp lứa tuổi tiểu học.
- **Đổi mật khẩu** cá nhân, **reset mk GV khác** (admin).
- Responsive đầy đủ cho **laptop** và **iPhone 17 Pro Max**.

## 2. Công nghệ sử dụng

| Phần | Công nghệ |
|------|-----------|
| Backend | Node.js 18+ + Express 4 (REST API) |
| Database | MySQL 5.7+ / 8.0 (`mysql2/promise` pool) |
| Auth | `crypto.scrypt` hash mật khẩu (lưu `salt:hash`) |
| Frontend | HTML + CSS + JavaScript thuần, SPA dùng hash router |
| UI/UX | CSS variables, dark mode auto, responsive 4 breakpoints (900/700/480/430px) |
| Mock mode | In-memory fallback (không cần DB) để demo |
| LLM | OpenAI-compatible API (OpenAI, OpenRouter, Ollama local, ...) |

## 3. Thiết kế cơ sở dữ liệu (MySQL)

5 bảng chính:

### 3.1 `teachers` — Giáo viên (tài khoản đăng nhập)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INT PK AUTO_INCREMENT | Khóa chính |
| `username` | VARCHAR(50) UNIQUE NOT NULL | Tên đăng nhập (lowercase) |
| `password_hash` | VARCHAR(255) NOT NULL | `salt:hash` từ `crypto.scrypt` |
| `full_name` | VARCHAR(100) NOT NULL | Họ và tên |
| `is_admin` | TINYINT(1) NOT NULL DEFAULT 0 | 1 = admin (thấy tất cả lớp, quản lý GV) |
| `created_at` | TIMESTAMP | Ngày tạo |

### 3.2 `classes` — Lớp học

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INT PK AUTO_INCREMENT | Khóa chính |
| `name` | VARCHAR(100) NOT NULL | Tên lớp (vd: "Lớp 5A", "IELTS Basic") |
| `grade_level` | VARCHAR(50) NULL | Cấp học (vd: "Lớp 3", "Tiểu học", "THCS") — dùng để LLM tạo prompt phù hợp |
| `teacher_id` | INT FK → teachers(id) ON DELETE SET NULL | GV phụ trách |
| `created_at` | TIMESTAMP | Ngày tạo |

**Index**: `idx_classes_teacher_id`.

### 3.3 `students` — Học sinh

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INT PK AUTO_INCREMENT | Khóa chính |
| `class_id` | INT FK → classes(id) ON DELETE CASCADE NOT NULL | Lớp của HS |
| `full_name` | VARCHAR(100) NOT NULL | Họ và tên |
| `student_code` | VARCHAR(20) UNIQUE NOT NULL | Mã HS (vd: "HS001") |
| `gender` | ENUM('M','F','O') NULL | Giới tính |
| `date_of_birth` | DATE NULL | Ngày sinh |
| `created_at` | TIMESTAMP | Ngày tạo |

**Index**: `idx_students_class_id`.

### 3.4 `sessions` — Buổi học

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INT PK AUTO_INCREMENT | Khóa chính |
| `class_id` | INT FK → classes(id) ON DELETE CASCADE NOT NULL | Lớp |
| `session_date` | DATE NOT NULL | Ngày học (vd: 2026-06-13) |
| `title` | VARCHAR(150) NULL | Chủ đề buổi học |
| `note` | TEXT NULL | Ghi chú chung |
| `created_at` | TIMESTAMP | Ngày tạo |

**UNIQUE** (`class_id`, `session_date`): mỗi lớp mỗi ngày chỉ tạo được 1 buổi.
**Index**: `idx_sessions_class_id`, `idx_sessions_date` (cho query thống kê theo tháng).

### 3.5 `attendances` — Điểm danh từng HS từng buổi

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INT PK AUTO_INCREMENT | Khóa chính |
| `session_id` | INT FK → sessions(id) ON DELETE CASCADE NOT NULL | Buổi học |
| `student_id` | INT FK → students(id) ON DELETE CASCADE NOT NULL | Học sinh |
| `is_present` | TINYINT(1) NOT NULL DEFAULT 0 | 1 = Có mặt, 0 = Vắng |
| `lesson_score` | TINYINT NULL | Điểm bài cũ (1-10), NULL = không chấm |
| `lesson_grade` | VARCHAR(20) NULL | Xếp loại: Tốt/Khá/TB/Yếu |
| `exercise_score` | TINYINT NULL | Điểm bài tập (1-10) — **thêm từ migration 002** |
| `teacher_note` | TEXT NULL | Nhận xét GV cho HS trong buổi này |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Ngày cập nhật |

**UNIQUE** (`session_id`, `student_id`): mỗi HS mỗi buổi chỉ 1 dòng → dùng `INSERT ... ON DUPLICATE KEY UPDATE` để upsert.

**CHECK constraints** (MySQL 8.0.16+):
- `chk_lesson_score`: 1 ≤ lesson_score ≤ 10
- `chk_exercise_score`: 1 ≤ exercise_score ≤ 10
- `chk_lesson_grade`: lesson_grade IN ('Tốt','Khá','Trung bình','Yếu')

**Index**: `idx_attendances_session_id`, `idx_attendances_student_id`.

### 3.6 `migrations` — Lịch sử migration

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | INT PK AUTO_INCREMENT | Khóa chính |
| `name` | VARCHAR(255) UNIQUE NOT NULL | Tên file migration (vd: `002_add_exercise_score.sql`) |
| `applied_at` | TIMESTAMP | Thời điểm áp dụng |

### 3.7 Sơ đồ quan hệ (ERD)

```
teachers (1) ──── (∞) classes (1) ──── (∞) students (1) ──── (∞) attendances
                                                  ↑                    │
                                                  │                    │
                                          sessions (1) ────────────────┘
                                          (1) sessions ── (∞) attendances

classes.teacher_id → teachers.id (FK ON DELETE SET NULL)
students.class_id  → classes.id  (FK ON DELETE CASCADE)
sessions.class_id  → classes.id  (FK ON DELETE CASCADE)
attendances.session_id → sessions.id (FK ON DELETE CASCADE)
attendances.student_id → students.id (FK ON DELETE CASCADE)
```

## 4. Thiết kế API (REST)

Base URL: `http://localhost:3000/api`
Tất cả routes (trừ `/auth/login`, `/auth/register`, `/health`) yêu cầu header `X-Teacher-Id`.

### 4.1 Auth

- `POST /auth/login` — `{username, password}` → `{ok, teacher}`
- `POST /auth/register` — `{username, password, password_confirm?, full_name}` → `{ok, teacher}`
- `POST /auth/change-password` — yêu cầu `X-Teacher-Id`. Body: `{current_password, new_password, new_password_confirm?}` → `{ok, message}`

### 4.2 Teachers (chỉ admin)

- `GET /teachers` — danh sách GV
- `POST /teachers` — `{username, password, full_name, is_admin?}` → tạo
- `PUT /teachers/:id` — `{full_name?, is_admin?}` (không cho tự hạ admin của chính mình)
- `DELETE /teachers/:id` — không cho xoá chính mình
- `PUT /teachers/:id/reset-password` — `{new_password, new_password_confirm?}` (admin reset mk GV khác)

### 4.3 Classes

- `GET /classes` — admin: tất cả, GV: của mình
- `POST /classes` — `{name, grade_level?, teacher_id?}` (admin chỉ định teacher_id)
- `PUT /classes/:id` — `{name?, grade_level?, teacher_id?}` (chỉ admin đổi teacher_id)
- `DELETE /classes/:id` — GV chỉ xoá được lớp mình

### 4.4 Students

- `GET /classes/:id/students` — HS của 1 lớp
- `POST /classes/:id/students` — `{full_name, student_code, gender?, date_of_birth?}`
- `GET /students/:id` — thông tin 1 HS
- `PUT /students/:id` — sửa
- `DELETE /students/:id` — xoá
- `GET /students/:id/notes?year=&month=` — nhận xét trong tháng (cho LLM)
- `GET /students/:id/history?year=&month=` — tổng quan tháng + all-time + lịch sử buổi (1 query)
- `GET /students/:id/stats` — thống kê all-time

### 4.5 Sessions

- `GET /classes/:id/sessions` — buổi học của lớp
- `POST /classes/:id/sessions` — tạo buổi
- `GET /sessions/:id` — chi tiết buổi + danh sách điểm danh
- `PUT /sessions/:id` — sửa
- `DELETE /sessions/:id` — xoá

### 4.6 Attendances

- `POST /sessions/:id/attendances` — upsert. Body: `{items: [{student_id, is_present, lesson_score?, exercise_score?, lesson_grade?, teacher_note?}]}`

### 4.7 Stats

- `GET /classes/:id/stats?year=&month=` — thống kê tháng cho 1 lớp

### 4.8 AI

- `POST /ai/summarize-notes` — body: `{api_key, base_url?, model?, student_id?, student_name, year, month, grade_level?, monthly_summary?, notes: [{date, present, lesson_score, exercise_score, grade, note}]}` → gọi OpenAI-compatible API và trả về `{summary, model, usage}`

## 5. Phân quyền

| Hành động | Admin | GV thường |
|-----------|-------|-----------|
| Xem lớp của mình | ✓ | ✓ |
| Xem tất cả lớp | ✓ | ✗ |
| Tạo lớp mới | ✓ (gán GV bất kỳ) | ✓ (tự gán cho mình) |
| Sửa lớp | ✓ (đổi được teacher) | ✓ (chỉ lớp mình, không đổi teacher) |
| Xoá lớp | ✓ | ✓ (chỉ lớp mình) |
| CRUD HS | ✓ | ✓ (chỉ HS lớp mình) |
| CRUD buổi + điểm danh | ✓ | ✓ (chỉ buổi lớp mình) |
| Xem thống kê | ✓ | ✓ (chỉ lớp mình) |
| Quản lý tài khoản GV | ✓ | ✗ |
| Reset mật khẩu GV khác | ✓ | ✗ |
| Đổi mật khẩu của chính mình | ✓ | ✓ |

Phân quyền thực hiện qua middleware `requireTeacher` + `requireAdmin` + helper `canAccessClass(req, classId)`.

## 6. Luồng sử dụng (Frontend)

### 6.1 Đăng nhập

```
Trang login → nhập username/password
  → POST /api/auth/login → lưu {id, username, full_name, is_admin} vào localStorage
  → redirect về # (trang danh sách lớp)
```

### 6.2 Quản lý lớp

```
Trang chủ (route # hoặc #classes)
  → GET /api/classes
  → hiển thị danh sách lớp + form thêm lớp
  → click tên lớp → #class/:id
```

### 6.3 Chi tiết lớp

```
#class/:id
  → GET /api/classes, /api/classes/:id/students, /api/classes/:id/sessions
  → Tabs: 👨‍🎓 Học sinh | 📅 Buổi học
  → Form thêm HS (4 field: Mã, Họ tên, Giới tính, Ngày sinh)
  → Form thêm buổi học (Ngày, Chủ đề, Ghi chú)
  → Mỗi dòng HS: nút Sửa/Xoá
  → Mỗi dòng buổi: nút Điểm danh / Sửa / Xoá
```

### 6.4 Điểm danh 1 buổi

```
#session-edit/:id
  → GET /api/sessions/:id
  → Hiển thị date-nav (◀ Trước | 📅 chọn ngày | 📌 Hôm nay | Sau ▶)
  → Bảng điểm danh: mỗi HS 1 dòng
    - Cột 1: STT
    - Cột 2: Họ tên
    - Cột 3: Checkbox Có mặt
    - Cột 4: Điểm bài cũ (1-10)
    - Cột 5: Điểm bài tập (1-10)
    - Cột 6: Xếp loại (Tốt/Khá/TB/Yếu)
    - Cột 7: Nhận xét (textarea)
  → Toolbar: Tick tất cả có mặt / tất cả vắng / đảo ngược
  → Nút "💾 Lưu điểm danh"
  → POST /api/sessions/:id/attendances (upsert toàn bộ)
```

### 6.5 Thống kê lớp

```
#class-stats/:id/:year/:month
  → GET /api/classes/:id/stats
  → 4 thẻ tổng quan: Tổng buổi học trong tháng, Tổng có mặt, Tổng vắng, Sĩ số
  → Bảng chi tiết từng HS: STT, Họ tên, Có mặt, Vắng, Chưa tick, Tổng buổi,
    Tỉ lệ chuyên cần, ĐTB bài cũ, ĐTB bài tập
  → Click tên HS → #student-stats/:id
```

### 6.6 Thống kê học sinh + LLM

```
#student-stats/:id
  → GET /api/students/:id + /api/students/:id/history?year=&month=
  → 6-7 thẻ tổng quan: Tổng buổi, Có mặt, Vắng, Chưa tick, Tỉ lệ, ĐTB bài cũ, ĐTB bài tập
  → Bảng lịch sử buổi học trong tháng (Ngày, Chủ đề, Trạng thái, điểm, xếp loại, nhận xét, nút Sửa)
  → 🤖 Card tổng hợp LLM:
    - Chọn tháng/năm
    - Nhập API key (lưu localStorage)
    - Base URL, Model
    - Nút "✨ Tổng hợp nhận xét tháng"
    → POST /api/ai/summarize-notes
    → Hiển thị đoạn nhận xét + nút 📋 Copy
```

### 6.7 Đổi mật khẩu

```
Topbar → click "🔑 Đổi MK"
  → Modal: nhập mk hiện tại + mk mới + nhập lại mk mới
  → POST /api/auth/change-password
  → Server check mk hiện tại đúng → hash mk mới → UPDATE
  → Toast thành công → đóng modal
```

### 6.8 Admin reset mật khẩu

```
#teachers → click "🔑 Reset MK" trên 1 dòng GV
  → Modal: nhập mk mới + nhập lại
  → PUT /api/teachers/:id/reset-password
  → Server hash mk mới → UPDATE
  → Toast thành công
```

## 7. Cấu trúc thư mục dự án

```
Linh_English/
├── README.md                  # Hướng dẫn cài đặt + dùng
├── DESIGN.md                  # File thiết kế này
├── database/
│   ├── schema.sql             # Script tạo schema ban đầu
│   └── migrations/
│       ├── 001_init.sql
│       ├── 002_add_exercise_score.sql
│       └── 003_add_session_date_index.sql
├── backend/
│   ├── package.json
│   ├── server.js              # Mount routes + serve frontend
│   ├── auth.js                # hashPassword, verifyPassword, middleware
│   ├── db.js                  # MySQL pool
│   ├── init-db.js             # Tạo schema + seed data
│   ├── migrate.js             # Chạy migrations
│   ├── dump-utf8.js           # Backup DB
│   ├── .env.example
│   ├── .env                   # USE_MOCK=1
│   └── routes/
│       ├── auth.js            # login, register, change-password
│       ├── teachers.js        # CRUD + reset-password
│       ├── classes.js
│       ├── students.js        # CRUD + notes + history + stats
│       ├── sessions.js
│       ├── attendances.js
│       ├── stats.js
│       ├── ai.js              # LLM summarize-notes
│       └── mock.js            # Mock mode
└── frontend/
    ├── index.html             # SPA shell
    ├── css/style.css          # Toàn bộ CSS (responsive, dark mode)
    └── js/app.js              # Toàn bộ logic frontend (~2300 dòng)
```

## 8. Quyết định thiết kế

- **Một dòng / HS / buổi**: dùng UNIQUE (session_id, student_id) + upsert để API đơn giản, "Lưu lại" nhiều lần tự nhiên.
- **Vừa điểm số vừa xếp loại**: `lesson_score` (1-10) + `lesson_grade` (Tốt/Khá/TB/Yếu) — GV chọn 1 hoặc cả hai tuỳ ngữ cảnh.
- **Vừa điểm bài cũ vừa điểm bài tập**: phân biệt rõ 2 loại điểm để LLM đánh giá chính xác hơn.
- **Tách grade_level**: dùng VARCHAR(50) thay vì INT, linh hoạt cho mọi cấp học + dùng cho LLM prompt.
- **Stats 1 query**: `/students/:id/history` trả về info + month_stats + all_stats + details trong 1 request, tránh N+1.
- **Frontend SPA hash router**: không cần framework, dễ chạy, dễ test.
- **Mock mode**: in-memory fallback để demo giao diện không cần cài MySQL.
- **LLM proxy**: server chỉ forward request tới OpenAI, không lưu API key. API key chỉ ở localStorage frontend.
- **CHECK constraints** (MySQL 8): validate điểm 1-10 và xếp loại ngay ở DB, tránh app gửi data bậy.
- **Tiếng Việt trong UI** vì đối tượng là giáo viên Việt Nam.
- **Responsive 4 breakpoints**: 900px (tablet nhỏ), 700px (mobile lớn), 480px (iPhone thường), 430px (iPhone 17 Pro Max).

## 9. Bảo mật (lưu ý cho production)

Hệ thống dùng cho DEMO/học tập. Khi triển khai thật cần:

- **Thay `X-Teacher-Id` bằng JWT/session token**: dùng `jsonwebtoken` thay vì tin tưởng ID từ client.
- **Thêm CSRF protection** (csrf-csrf hoặc double-submit cookie).
- **Thêm rate limiting** (express-rate-limit).
- **Audit log**: ghi lại ai sửa gì, lúc nào.
- **HTTPS only** + secure cookie.
- **API key LLM**: chuyển sang lưu ở server, mã hoá bằng key từ env, không bao giờ xuất hiện trong response.
- **Validate input chặt hơn**: thêm `joi` hoặc `zod` để validate mọi body.
