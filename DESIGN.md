# Thiết kế Hệ thống Điểm danh Học sinh - Linh English

## 1. Mục tiêu

Trang web giúp cô giáo:
- Chọn lớp học cần điểm danh cho mỗi buổi.
- Điểm danh: Có mặt / Vắng.
- Đánh giá bài cũ: Tốt / Khá / Trung bình / Yếu (hoặc dạng số 1–10 nếu muốn chi tiết).
- Ghi nhận xét cho từng học sinh trong buổi học.
- Xem lịch sử điểm danh và thống kê.

## 2. Công nghệ sử dụng

- **Backend**: Node.js + Express (REST API).
- **Database**: MySQL (do người dùng yêu cầu).
- **Frontend**: HTML + CSS + JavaScript thuần (vanilla JS, fetch API).
- **Không cần build tool** — chạy trực tiếp bằng Node.

## 3. Thiết kế cơ sở dữ liệu (MySQL)

### Bảng `classes` — Danh sách lớp học

| Cột           | Kiểu              | Mô tả                                  |
|---------------|-------------------|----------------------------------------|
| id            | INT PK AUTO_INCREMENT| Khóa chính                            |
| name          | VARCHAR(100)      | Tên lớp (vd: "Lớp 5A", "IELTS Basic")  |
| grade_level   | VARCHAR(50)       | Cấp học (vd: "Lớp 3", "Người lớn")     |
| created_at    | TIMESTAMP         | Ngày tạo                               |

### Bảng `students` — Danh sách học sinh

| Cột         | Kiểu               | Mô tả                                          |
|-------------|--------------------|------------------------------------------------|
| id          | INT PK AUTO_INCREMENT | Khóa chính                                  |
| class_id    | INT FK → classes.id| Lớp của học sinh                               |
| full_name   | VARCHAR(100)       | Họ và tên                                      |
| student_code| VARCHAR(20) UNIQUE | Mã học sinh (vd: "HS001")                      |
| gender      | ENUM('M','F','O')  | Giới tính                                      |
| date_of_birth| DATE              | Ngày sinh (tùy chọn)                           |
| created_at  | TIMESTAMP          | Ngày tạo                                       |

### Bảng `sessions` — Buổi học

| Cột        | Kiểu                | Mô tả                                            |
|------------|---------------------|--------------------------------------------------|
| id         | INT PK AUTO_INCREMENT| Khóa chính                                      |
| class_id   | INT FK → classes.id | Lớp được điểm danh                               |
| session_date| DATE               | Ngày học (vd: 2026-06-13)                        |
| title      | VARCHAR(150)        | Tên/Chủ đề buổi học (vd: "Unit 5: Weather")     |
| note       | TEXT                | Ghi chú chung cho buổi học                       |
| created_at | TIMESTAMP           | Ngày tạo                                         |

**Unique key**: (`class_id`, `session_date`) — mỗi lớp mỗi ngày chỉ có 1 buổi để tránh trùng.

### Bảng `attendances` — Điểm danh từng học sinh trong buổi

| Cột            | Kiểu                  | Mô tả                                                     |
|----------------|-----------------------|-----------------------------------------------------------|
| id             | INT PK AUTO_INCREMENT | Khóa chính                                                |
| session_id     | INT FK → sessions.id  | Buổi học                                                  |
| student_id     | INT FK → students.id  | Học sinh                                                  |
| is_present     | TINYINT(1)            | 1 = Có mặt, 0 = Vắng                                     |
| lesson_score   | TINYINT               | Điểm bài cũ 1–10 (NULL nếu không chấm)                   |
| lesson_grade   | VARCHAR(20)           | Xếp loại: Tốt/Khá/Trung bình/Yếu (NULL nếu không chấm)   |
| teacher_note   | TEXT                  | Nhận xét của giáo viên cho học sinh này trong buổi         |
| created_at     | TIMESTAMP             | Ngày tạo                                                  |
| updated_at     | TIMESTAMP             | Ngày cập nhật                                             |

**Unique key**: (`session_id`, `student_id`) — mỗi học sinh chỉ có 1 dòng điểm danh / buổi.

## 4. Thiết kế API (REST)

Base URL: `http://localhost:3000/api`

### Classes (Lớp)
- `GET /classes` — Danh sách lớp.
- `POST /classes` — Tạo lớp mới. Body: `{ name, grade_level }`
- `DELETE /classes/:id` — Xoá lớp.

### Students (Học sinh)
- `GET /classes/:id/students` — Danh sách học sinh của lớp.
- `POST /classes/:id/students` — Thêm học sinh. Body: `{ full_name, student_code, gender, date_of_birth }`
- `DELETE /students/:id` — Xoá học sinh.

### Sessions (Buổi học)
- `GET /classes/:id/sessions` — Danh sách buổi học của lớp.
- `POST /classes/:id/sessions` — Tạo buổi học. Body: `{ session_date, title, note }`
- `GET /sessions/:id` — Chi tiết 1 buổi + danh sách điểm danh.
- `DELETE /sessions/:id` — Xoá buổi học.

### Attendances (Điểm danh)
- `POST /sessions/:id/attendances` — Lưu toàn bộ điểm danh của buổi.
  - Body: `{ items: [{ student_id, is_present, lesson_score, lesson_grade, teacher_note }] }`
  - Dùng upsert: thêm mới hoặc cập nhật theo (session_id, student_id).

### Stats (Thống kê)
- `GET /students/:id/stats` — Thống kê buổi có mặt/vắng/điểm TB của 1 học sinh.

## 5. Luồng sử dụng (Frontend)

1. Trang chủ hiển thị **danh sách lớp**. Có nút "+ Thêm lớp".
2. Bấm vào 1 lớp → chuyển sang trang chi tiết lớp:
   - Tab **Học sinh**: danh sách + thêm/xoá học sinh.
   - Tab **Buổi học**: danh sách buổi theo ngày, nút "+ Tạo buổi học mới".
3. Bấm "Điểm danh" trên 1 buổi → trang điểm danh:
   - Mỗi học sinh 1 dòng: Checkbox Có mặt/Vắng, ô điểm 1–10, dropdown xếp loại, textarea nhận xét.
   - Nút "Lưu điểm danh" gửi toàn bộ lên server.
4. Bấm "Xem chi tiết" buổi học → hiển thị lại bảng điểm danh dạng chỉ-đọc.

## 6. Cấu trúc thư mục dự án

```
Linh_English/
├── DESIGN.md                 # File thiết kế này
├── README.md                 # Hướng dẫn cài đặt
├── database/
│   └── schema.sql            # Script tạo database + bảng + dữ liệu mẫu
├── backend/
│   ├── package.json
│   ├── server.js             # Khởi tạo Express, mount routes
│   ├── db.js                 # Kết nối MySQL (mysql2/promise)
│   └── routes/
│       ├── classes.js
│       ├── students.js
│       ├── sessions.js
│       └── attendances.js
└── frontend/
    ├── index.html            # Trang chính (SPA đơn giản)
    ├── css/
    │   └── style.css
    └── js/
        └── app.js            # Toàn bộ logic frontend
```

## 7. Quyết định thiết kế

- **Một dòng / học sinh / buổi**: dùng UNIQUE (session_id, student_id) + upsert để giữ API đơn giản, dễ "Lưu lại" nhiều lần.
- **Điểm bài cũ 2 cách**: vừa có `lesson_score` (số 1-10) vừa có `lesson_grade` (xếp loại) — giáo viên chọn 1 trong 2 tuỳ ngữ cảnh.
- **Frontend SPA đơn giản** (hash routing) để không cần framework, dễ chạy.
- **Tiếng Việt trong UI** vì đối tượng là giáo viên Việt Nam.
