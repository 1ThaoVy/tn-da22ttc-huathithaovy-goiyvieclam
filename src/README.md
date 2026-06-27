# Gợi Ý Việc Làm Thông Minh

Ứng dụng web hỗ trợ tìm kiếm và gợi ý việc làm dựa trên kỹ năng của ứng viên, đồng thời giúp nhà tuyển dụng tìm kiếm ứng viên phù hợp.

---

## Mục tiêu

- Xây dựng hệ thống đăng tuyển và tìm kiếm việc làm trực tuyến.
- Áp dụng thuật toán **Skill Matching** để gợi ý công việc phù hợp với hồ sơ kỹ năng của ứng viên.
- Hỗ trợ nhà tuyển dụng gợi ý danh sách ứng viên tiềm năng cho từng vị trí.
- Phân quyền 3 vai trò: **Ứng viên**, **Nhà tuyển dụng**, **Quản trị viên**.

---

## Kiến trúc hệ thống

```
src/
├── backend/        # Node.js + Express — REST API
│   ├── config/     # Kết nối cơ sở dữ liệu (MySQL)
│   ├── middleware/ # Xác thực JWT
│   ├── routes/     # Các endpoint API
│   └── server.js   # Điểm khởi động server
├── frontend/       # Giao diện HTML/CSS/JS thuần
│   ├── index.html
│   ├── jobs.html
│   ├── recommend.html
│   └── admin/
└── database/
    └── goi_y_viec_lam.sql  # Script khởi tạo CSDL
```

Kiến trúc **Monolithic**: Backend phục vụ luôn các file tĩnh của Frontend thông qua `express.static`.

### Các API chính

| Prefix | Chức năng |
|---|---|
| `/api/auth` | Đăng ký, đăng nhập (JWT) |
| `/api/users` | Quản lý hồ sơ người dùng |
| `/api/jobs` | Đăng tin và tìm kiếm việc làm |
| `/api/apply` | Nộp và quản lý đơn ứng tuyển |
| `/api/recommend` | Gợi ý việc làm / ứng viên theo kỹ năng |
| `/api/admin` | Quản trị hệ thống |
| `/api/notify` | Thông báo |

---

## Phần mềm cần thiết

| Phần mềm | Phiên bản khuyến nghị | Ghi chú |
|---|---|---|
| [Node.js](https://nodejs.org) | >= 18.x | Môi trường chạy backend |
| [MySQL](https://www.mysql.com) | >= 8.0 | Cơ sở dữ liệu |
| npm | >= 9.x | Đi kèm với Node.js |

---

## Cách triển khai

### 1. Khởi tạo cơ sở dữ liệu

Mở MySQL Workbench hoặc công cụ quản lý MySQL, tạo database và import script:

```sql
CREATE DATABASE goi_y_viec_lam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE goi_y_viec_lam;
SOURCE database/goi_y_viec_lam.sql;
```

### 2. Cấu hình môi trường

Tạo file `backend/.env` dựa trên mẫu sau:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=goi_y_viec_lam
JWT_SECRET=your_jwt_secret_key
```

### 3. Cài đặt dependencies

```bash
cd backend
npm install
```

### 4. Chạy ứng dụng

**Cách 1 — Dùng file batch (Windows):**

```bash
start-server.bat
```

**Cách 2 — Chạy trực tiếp:**

```bash
cd backend
node server.js
```

**Cách 3 — Chế độ phát triển (tự reload):**

```bash
cd backend
npm run dev
```

### 5. Truy cập

- Ứng dụng: [http://localhost:3000](http://localhost:3000)
- Kiểm tra server: [http://localhost:3000/api/health](http://localhost:3000/api/health)
