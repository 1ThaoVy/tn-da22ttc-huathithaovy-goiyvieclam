-- ================================================================
-- DATABASE: goi_y_viec_lam
-- Website Gợi Ý Việc Làm Thông Minh
-- Mật khẩu demo tất cả tài khoản: 123456
-- ================================================================

DROP DATABASE IF EXISTS goi_y_viec_lam;
CREATE DATABASE goi_y_viec_lam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE goi_y_viec_lam;

-- ========================
-- 1. NGƯỜI DÙNG
-- ========================
CREATE TABLE nguoi_dung (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    vai_tro ENUM('ung_vien', 'nha_tuyen_dung', 'admin') DEFAULT 'ung_vien',
    avatar VARCHAR(255) DEFAULT NULL,
    so_dien_thoai VARCHAR(20) DEFAULT NULL,
    dia_chi VARCHAR(255) DEFAULT NULL,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cong_ty_id INT DEFAULT NULL
);

-- ========================
-- 2. HỒ SƠ
-- ========================
CREATE TABLE ho_so (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nguoi_dung_id INT UNIQUE,
    kinh_nghiem TEXT,
    hoc_van TEXT,
    mo_ta_ban_than TEXT,
    linkedin VARCHAR(255) DEFAULT NULL,
    github VARCHAR(255) DEFAULT NULL,
    loai_hinh_mong_muon ENUM('toan_thoi_gian','ban_thoi_gian','tu_do','thuc_tap') DEFAULT NULL,
    dia_chi_mong_muon VARCHAR(100) DEFAULT NULL,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
);

-- ========================
-- 3. KỸ NĂNG
-- ========================
CREATE TABLE ky_nang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_ky_nang VARCHAR(100) UNIQUE NOT NULL,
    danh_muc VARCHAR(100) DEFAULT 'Khác'
);

-- ========================
-- 4. USER - SKILL
-- ========================
CREATE TABLE ky_nang_nguoi_dung (
    nguoi_dung_id INT,
    ky_nang_id INT,
    muc_do INT DEFAULT 1 CHECK (muc_do BETWEEN 1 AND 5),
    PRIMARY KEY (nguoi_dung_id, ky_nang_id),
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (ky_nang_id) REFERENCES ky_nang(id) ON DELETE CASCADE
);

-- ========================
-- 5. CÔNG TY
-- ========================
CREATE TABLE cong_ty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_cong_ty VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    website VARCHAR(255) DEFAULT NULL,
    dia_chi VARCHAR(255) DEFAULT NULL,
    logo VARCHAR(255) DEFAULT NULL,
    quy_mo VARCHAR(100) DEFAULT NULL,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE nguoi_dung ADD CONSTRAINT fk_nguoi_dung_cong_ty FOREIGN KEY (cong_ty_id) REFERENCES cong_ty(id) ON DELETE SET NULL;

-- ========================
-- 6. CÔNG VIỆC
-- ========================
CREATE TABLE cong_viec (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    yeu_cau TEXT,
    quyen_loi TEXT,
    cong_ty_id INT,
    nha_tuyen_dung_id INT,
    muc_luong_min DECIMAL(15,0) DEFAULT 0,
    muc_luong_max DECIMAL(15,0) DEFAULT 0,
    dia_chi VARCHAR(255) DEFAULT NULL,
    loai_hinh ENUM('toan_thoi_gian', 'ban_thoi_gian', 'tu_do', 'thuc_tap') DEFAULT 'toan_thoi_gian',
    trang_thai ENUM('dang_tuyen', 'da_dong') DEFAULT 'dang_tuyen',
    han_nop DATE DEFAULT NULL,
    luot_xem INT DEFAULT 0,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cong_ty_id) REFERENCES cong_ty(id),
    FOREIGN KEY (nha_tuyen_dung_id) REFERENCES nguoi_dung(id)
);

-- ========================
-- 7. JOB - SKILL
-- ========================
CREATE TABLE ky_nang_cong_viec (
    cong_viec_id INT,
    ky_nang_id INT,
    muc_do_yeu_cau INT DEFAULT 1 CHECK (muc_do_yeu_cau BETWEEN 1 AND 5),
    PRIMARY KEY (cong_viec_id, ky_nang_id),
    FOREIGN KEY (cong_viec_id) REFERENCES cong_viec(id) ON DELETE CASCADE,
    FOREIGN KEY (ky_nang_id) REFERENCES ky_nang(id) ON DELETE CASCADE
);

-- ========================
-- 8. ỨNG TUYỂN
-- ========================
CREATE TABLE ung_tuyen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nguoi_dung_id INT,
    cong_viec_id INT,
    thu_gioi_thieu TEXT DEFAULT NULL,
    trang_thai ENUM('cho_duyet', 'chap_nhan', 'tu_choi') DEFAULT 'cho_duyet',
    ngay_ung_tuyen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    han_xac_nhan DATETIME DEFAULT NULL,
    da_chon TINYINT(1) DEFAULT 0,
    cv_file_name VARCHAR(255) DEFAULT NULL,
    cv_file_data LONGBLOB DEFAULT NULL,
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id),
    FOREIGN KEY (cong_viec_id) REFERENCES cong_viec(id)
);

-- ========================
-- 9. THÔNG BÁO
-- ========================
CREATE TABLE thong_bao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nguoi_nhan_id INT NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    noi_dung TEXT,
    loai ENUM('chap_nhan','tu_choi','ung_vien_chon','info') DEFAULT 'info',
    lien_ket VARCHAR(255) DEFAULT NULL,
    da_doc TINYINT(1) DEFAULT 0,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nguoi_nhan_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
);

-- ========================
-- 10. LƯU CÔNG VIỆC
-- ========================
CREATE TABLE luu_cong_viec (
    nguoi_dung_id INT,
    cong_viec_id INT,
    ngay_luu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (nguoi_dung_id, cong_viec_id),
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id),
    FOREIGN KEY (cong_viec_id) REFERENCES cong_viec(id)
);

-- ================================================================
-- INSERT DỮ LIỆU MẪU
-- ================================================================

-- NGƯỜI DÙNG (mật khẩu: 123456 — đã hash bằng bcrypt)
-- Mật khẩu: 123456 (bcrypt hash hợp lệ)
INSERT INTO nguoi_dung (ten, email, mat_khau, vai_tro, so_dien_thoai, dia_chi) VALUES
('Nguyễn Văn An', 'an@gmail.com', '$2a$10$IWMymJ0wSQMSvaims8N5PuzpqU4Scv2x6NHxFqC1bXIj1UqAzGsPa', 'ung_vien', '0901234567', 'Hà Nội'),
('Trần Thị Bình', 'binh@gmail.com', '$2a$10$IWMymJ0wSQMSvaims8N5PuzpqU4Scv2x6NHxFqC1bXIj1UqAzGsPa', 'ung_vien', '0912345678', 'TP.HCM'),
('Lê Minh Cường', 'cuong@gmail.com', '$2a$10$IWMymJ0wSQMSvaims8N5PuzpqU4Scv2x6NHxFqC1bXIj1UqAzGsPa', 'ung_vien', '0923456789', 'Đà Nẵng'),
('HR Manager - TechCorp', 'hr@techcorp.com', '$2a$10$IWMymJ0wSQMSvaims8N5PuzpqU4Scv2x6NHxFqC1bXIj1UqAzGsPa', 'nha_tuyen_dung', '0934567890', 'Hà Nội'),
('Admin System', 'admin@system.com', '$2a$10$IWMymJ0wSQMSvaims8N5PuzpqU4Scv2x6NHxFqC1bXIj1UqAzGsPa', 'admin', '0945678901', 'TP.HCM');

-- HỒ SƠ
INSERT INTO ho_so (nguoi_dung_id, kinh_nghiem, hoc_van, mo_ta_ban_than, github) VALUES
(1, '2 năm kinh nghiệm Java Backend tại FPT Software. Làm việc với Spring Boot, REST API, MySQL.', 'Cử nhân CNTT - Đại học Bách Khoa Hà Nội (2018-2022)', 'Lập trình viên Backend đam mê xây dựng hệ thống hiệu suất cao.', 'github.com/nguyenvanan'),
(2, '1.5 năm Frontend Developer tại Viettel. Chuyên ReactJS và UI/UX.', 'Cử nhân Kỹ thuật phần mềm - ĐH Công nghệ TP.HCM (2019-2023)', 'Frontend developer yêu thích thiết kế giao diện đẹp và trải nghiệm người dùng tốt.', 'github.com/tranthibinh'),
(3, '6 tháng thực tập Data Analyst. Kỹ năng Python, SQL, phân tích dữ liệu.', 'Cử nhân Khoa học dữ liệu - ĐH Đà Nẵng (2020-2024)', 'Sinh viên mới tốt nghiệp hứng thú với Data Science và Machine Learning.', NULL);

-- KỸ NĂNG
INSERT INTO ky_nang (ten_ky_nang, danh_muc) VALUES
('Java', 'Backend'),
('Spring Boot', 'Backend'),
('Node.js', 'Backend'),
('Express.js', 'Backend'),
('Python', 'Backend'),
('PHP', 'Backend'),
('ReactJS', 'Frontend'),
('Vue.js', 'Frontend'),
('Angular', 'Frontend'),
('HTML', 'Frontend'),
('CSS', 'Frontend'),
('JavaScript', 'Frontend'),
('TypeScript', 'Frontend'),
('MySQL', 'Database'),
('PostgreSQL', 'Database'),
('MongoDB', 'Database'),
('Redis', 'Database'),
('Docker', 'DevOps'),
('Kubernetes', 'DevOps'),
('Git', 'DevOps'),
('Linux', 'DevOps'),
('AWS', 'Cloud'),
('REST API', 'Backend'),
('GraphQL', 'Backend'),
('Machine Learning', 'AI/ML'),
('Deep Learning', 'AI/ML'),
('Data Analysis', 'Data'),
('Pandas', 'Data'),
('TensorFlow', 'AI/ML');

-- USER - SKILL
INSERT INTO ky_nang_nguoi_dung VALUES
-- Nguyễn Văn An (Backend dev)
(1, 1, 4),  -- Java level 4
(1, 2, 3),  -- Spring Boot level 3
(1, 3, 2),  -- Node.js level 2
(1, 14, 3), -- MySQL level 3
(1, 20, 3), -- Git level 3
(1, 23, 3), -- REST API level 3
(1, 21, 2), -- Linux level 2
-- Trần Thị Bình (Frontend dev)
(2, 7, 4),  -- ReactJS level 4
(2, 10, 5), -- HTML level 5
(2, 11, 4), -- CSS level 4
(2, 12, 4), -- JavaScript level 4
(2, 13, 3), -- TypeScript level 3
(2, 20, 3), -- Git level 3
-- Lê Minh Cường (Data)
(3, 5, 3),  -- Python level 3
(3, 14, 3), -- MySQL level 3
(3, 27, 3), -- Data Analysis level 3
(3, 28, 2), -- Pandas level 2
(3, 25, 1); -- Machine Learning level 1

-- CÔNG TY
INSERT INTO cong_ty (ten_cong_ty, mo_ta, website, dia_chi, quy_mo) VALUES
('TechCorp Vietnam', 'Công ty công nghệ hàng đầu Việt Nam chuyên phát triển phần mềm doanh nghiệp.', 'techcorp.vn', 'Hà Nội', '500-1000 nhân viên'),
('StartupHub', 'Startup công nghệ tập trung vào AI và FinTech.', 'startuphub.io', 'TP.HCM', '50-100 nhân viên'),
('DataViet Solutions', 'Công ty chuyên về phân tích dữ liệu và Machine Learning.', 'dataviet.vn', 'Đà Nẵng', '100-200 nhân viên'),
('FrontierWeb', 'Agency thiết kế web và phát triển giao diện người dùng.', 'frontierweb.vn', 'TP.HCM', '20-50 nhân viên'),
('CloudSystems JSC', 'Cung cấp giải pháp điện toán đám mây và DevOps.', 'cloudsystems.vn', 'Hà Nội', '200-500 nhân viên');

-- Cập nhật liên kết công ty cho nhà tuyển dụng mặc định
UPDATE nguoi_dung SET cong_ty_id = 1 WHERE email = 'hr@techcorp.com';

-- CÔNG VIỆC
INSERT INTO cong_viec (tieu_de, mo_ta, yeu_cau, quyen_loi, cong_ty_id, nha_tuyen_dung_id, muc_luong_min, muc_luong_max, dia_chi, loai_hinh, han_nop) VALUES
('Java Backend Developer',
 'Phát triển và bảo trì các API RESTful cho hệ thống doanh nghiệp. Làm việc với kiến trúc microservices, tối ưu hiệu suất database.',
 'Tốt nghiệp CNTT hoặc liên quan. Thành thạo Java, Spring Boot. Có kinh nghiệm với MySQL, REST API. Ưu tiên có kiến thức về Docker.',
 'Lương cạnh tranh, thưởng hiệu quả. Bảo hiểm sức khỏe. Làm việc môi trường quốc tế. Cơ hội đào tạo và phát triển.',
 1, 4, 15000000, 25000000, 'Hà Nội', 'toan_thoi_gian', '2025-06-30'),

('Senior ReactJS Developer',
 'Xây dựng giao diện người dùng hiện đại, tối ưu trải nghiệm UX. Làm việc trong team Agile, deploy CI/CD.',
 'Tối thiểu 2 năm kinh nghiệm ReactJS. Thành thạo JavaScript, TypeScript, HTML/CSS. Biết dùng Git, REST API.',
 'Lương thưởng hấp dẫn. Flexible working. MacBook Pro. Team building hàng quý.',
 4, 4, 18000000, 30000000, 'TP.HCM', 'toan_thoi_gian', '2025-06-15'),

('Data Analyst Intern',
 'Phân tích dữ liệu kinh doanh, tạo báo cáo và dashboard. Hỗ trợ nhóm Data Science trong các dự án ML.',
 'Sinh viên năm cuối hoặc mới tốt nghiệp. Biết Python, Pandas, SQL. Có khả năng phân tích và trực quan hóa dữ liệu.',
 'Lương thực tập hỗ trợ. Được mentor bởi senior. Cơ hội convert full-time. Môi trường học hỏi.',
 3, 4, 3000000, 6000000, 'Đà Nẵng', 'thuc_tap', '2025-05-31'),

('Full Stack Node.js Developer',
 'Phát triển cả frontend lẫn backend cho sản phẩm FinTech. Xây dựng API, tích hợp payment gateway.',
 'Thành thạo Node.js, Express.js. Biết ReactJS hoặc Vue.js. Có kinh nghiệm làm việc với cơ sở dữ liệu MySQL/MongoDB. Ưu tiên có kinh nghiệm FinTech.',
 'Cổ phần công ty. Lương thưởng cạnh tranh. Remote 2 ngày/tuần. Môi trường startup năng động.',
 2, 4, 20000000, 35000000, 'TP.HCM', 'toan_thoi_gian', '2025-07-01'),

('DevOps Engineer',
 'Quản lý và tối ưu hạ tầng cloud, xây dựng pipeline CI/CD. Đảm bảo uptime và bảo mật hệ thống.',
 'Kinh nghiệm Docker, Kubernetes, CI/CD. Thành thạo Linux, Bash scripting. Biết AWS hoặc GCP. Ưu tiên có chứng chỉ AWS.',
 'Lương cao nhất ngành. Đào tạo chứng chỉ quốc tế được tài trợ. Thiết bị làm việc hiện đại.',
 5, 4, 25000000, 40000000, 'Hà Nội', 'toan_thoi_gian', '2025-06-30'),

('Machine Learning Engineer',
 'Nghiên cứu và triển khai mô hình ML/DL vào sản phẩm. Tối ưu mô hình cho production.',
 'Thành thạo Python, TensorFlow hoặc PyTorch. Kiến thức vững về Machine Learning, Deep Learning. Biết xử lý dữ liệu lớn.',
 'Lương rất cạnh tranh. Budget nghiên cứu riêng. Tham gia hội nghị quốc tế. Publish paper được khuyến khích.',
 3, 4, 20000000, 40000000, 'TP.HCM', 'toan_thoi_gian', '2025-07-15'),

('Frontend Intern (ReactJS)',
 'Hỗ trợ team frontend xây dựng giao diện. Học hỏi quy trình phát triển phần mềm thực tế.',
 'Sinh viên CNTT đang học hoặc mới ra trường. Biết HTML, CSS, JavaScript. Đang học ReactJS là lợi thế.',
 'Phụ cấp thực tập. Mentor 1-1. Chứng chỉ thực tập uy tín. Cơ hội việc làm sau thực tập.',
 4, 4, 2000000, 4000000, 'TP.HCM', 'thuc_tap', '2025-05-20'),

('PHP Backend Developer',
 'Phát triển tính năng cho hệ thống quản lý doanh nghiệp ERP. Tối ưu hiệu suất và bảo mật.',
 'Thành thạo PHP, MySQL. Biết framework Laravel hoặc CodeIgniter. Có kinh nghiệm REST API. Ưu tiên biết Docker.',
 'Lương ổn định, đóng BHXH đầy đủ. Môi trường ổn định, thân thiện. Thưởng dự án.',
 1, 4, 12000000, 20000000, 'Hà Nội', 'toan_thoi_gian', '2025-06-01');

-- JOB - SKILL
INSERT INTO ky_nang_cong_viec VALUES
-- Job 1: Java Backend
(1, 1, 3),  -- Java (level 3)
(1, 2, 3),  -- Spring Boot (level 3)
(1, 14, 3), -- MySQL (level 3)
(1, 23, 2), -- REST API (level 2)
(1, 20, 2), -- Git (level 2)
(1, 18, 1), -- Docker (level 1)
-- Job 2: Senior ReactJS
(2, 7, 4),  -- ReactJS (level 4)
(2, 12, 4), -- JavaScript (level 4)
(2, 13, 3), -- TypeScript (level 3)
(2, 10, 3), -- HTML (level 3)
(2, 11, 3), -- CSS (level 3)
(2, 20, 2), -- Git (level 2)
-- Job 3: Data Analyst Intern
(3, 5, 2),  -- Python (level 2)
(3, 27, 2), -- Data Analysis (level 2)
(3, 28, 2), -- Pandas (level 2)
(3, 14, 2), -- MySQL (level 2)
-- Job 4: Full Stack Node.js
(4, 3, 3),  -- Node.js (level 3)
(4, 4, 3),  -- Express.js (level 3)
(4, 7, 2),  -- ReactJS (level 2)
(4, 14, 2), -- MySQL (level 2)
(4, 23, 3), -- REST API (level 3)
(4, 20, 2), -- Git (level 2)
-- Job 5: DevOps
(5, 18, 3), -- Docker (level 3)
(5, 19, 2), -- Kubernetes (level 2)
(5, 21, 3), -- Linux (level 3)
(5, 22, 2), -- AWS (level 2)
(5, 20, 3), -- Git (level 3)
-- Job 6: Machine Learning
(6, 5, 4),  -- Python (level 4)
(6, 25, 3), -- Machine Learning (level 3)
(6, 26, 3), -- Deep Learning (level 3)
(6, 29, 3), -- TensorFlow (level 3)
(6, 27, 2), -- Data Analysis (level 2)
-- Job 7: Frontend Intern
(7, 10, 2), -- HTML (level 2)
(7, 11, 2), -- CSS (level 2)
(7, 12, 2), -- JavaScript (level 2)
(7, 7, 1),  -- ReactJS (level 1)
-- Job 8: PHP Backend
(8, 6, 3),  -- PHP (level 3)
(8, 14, 3), -- MySQL (level 3)
(8, 23, 2), -- REST API (level 2)
(8, 20, 2); -- Git (level 2)

-- ỨNG TUYỂN
INSERT INTO ung_tuyen (nguoi_dung_id, cong_viec_id, thu_gioi_thieu, trang_thai) VALUES
(1, 1, 'Tôi có 2 năm kinh nghiệm Java và rất muốn đóng góp cho TechCorp.', 'cho_duyet'),
(2, 2, 'Với kinh nghiệm ReactJS của mình, tôi tự tin hoàn thành tốt vị trí này.', 'chap_nhan'),
(3, 3, 'Tôi là sinh viên mới tốt nghiệp ngành Data Science, rất muốn học hỏi thêm.', 'cho_duyet');

-- LƯU CÔNG VIỆC
INSERT INTO luu_cong_viec (nguoi_dung_id, cong_viec_id) VALUES
(1, 2),
(1, 4),
(2, 1),
(3, 6);
-- =======
 BO SUNG THEM CONG VIEC
-- ================================================================
INSERT INTO cong_viec (tieu_de, mo_ta, yeu_cau, quyen_loi, cong_ty_id, nha_tuyen_dung_id, muc_luong_min, muc_luong_max, dia_chi, loai_hinh, han_nop) VALUES

('Vue.js Frontend Developer',
 'Xây dựng và tối ưu giao diện web SPA sử dụng Vue.js 3 + Pinia. Phối hợp với backend team qua REST API.',
 'Tối thiểu 1 năm kinh nghiệm Vue.js. Thành thạo JavaScript ES6+, HTML, CSS. Biết Tailwind CSS là lợi thế.',
 'Lương cạnh tranh. Làm việc hybrid. Phúc lợi đầy đủ. Team trẻ năng động.',
 4, 4, 14000000, 22000000, 'TP.HCM', 'toan_thoi_gian', '2026-08-01'),

('Senior Java Microservices',
 'Thiết kế và phát triển hệ thống microservices quy mô lớn. Tối ưu performance, đảm bảo high availability.',
 'Tối thiểu 4 năm kinh nghiệm Java. Thành thạo Spring Boot, Spring Cloud. Có kinh nghiệm Kafka, Redis, Docker.',
 'Lương 30-50 triệu. Thưởng dự án. Cổ phần. Bảo hiểm cao cấp.',
 1, 4, 30000000, 50000000, 'Hà Nội', 'toan_thoi_gian', '2026-08-15'),

('UI/UX Designer',
 'Thiết kế trải nghiệm người dùng cho ứng dụng web và mobile. Tạo wireframe, prototype, design system.',
 'Tối thiểu 2 năm kinh nghiệm UI/UX. Thành thạo Figma. Có portfolio đẹp. Hiểu về accessibility.',
 'Lương hấp dẫn. MacBook. Phần mềm design được tài trợ. Môi trường sáng tạo.',
 4, 4, 15000000, 28000000, 'TP.HCM', 'toan_thoi_gian', '2026-07-30'),

('Android Developer',
 'Phát triển và duy trì ứng dụng Android native. Tích hợp với backend API, tối ưu UI/UX mobile.',
 'Thành thạo Kotlin hoặc Java Android. Biết Jetpack Compose là lợi thế. Hiểu về Material Design.',
 'Lương 18-32 triệu. Thiết bị test được cấp. Môi trường agile. Học hỏi công nghệ mới.',
 2, 4, 18000000, 32000000, 'TP.HCM', 'toan_thoi_gian', '2026-08-10'),

('iOS Developer (Swift)',
 'Phát triển ứng dụng iOS sử dụng Swift và SwiftUI. Tối ưu hiệu suất, publish lên App Store.',
 'Thành thạo Swift, UIKit hoặc SwiftUI. Có app đã publish là lợi thế. Biết Core Data, Combine.',
 'Lương 20-35 triệu. MacBook Pro. Môi trường startup. Stock option.',
 2, 4, 20000000, 35000000, 'TP.HCM', 'toan_thoi_gian', '2026-08-05'),

('QA Engineer (Automation)',
 'Xây dựng framework test automation cho web và API. Viết test case, báo cáo bug, đảm bảo chất lượng sản phẩm.',
 'Kinh nghiệm Selenium, Playwright hoặc Cypress. Biết Python hoặc JavaScript. Hiểu về CI/CD pipeline.',
 'Lương 12-20 triệu. Môi trường chuyên nghiệp. Đào tạo kỹ năng. Thưởng KPI.',
 1, 4, 12000000, 20000000, 'Hà Nội', 'toan_thoi_gian', '2026-07-25'),

('Business Analyst (IT)',
 'Phân tích yêu cầu nghiệp vụ, viết tài liệu đặc tả. Cầu nối giữa khách hàng và team phát triển.',
 'Tối thiểu 2 năm kinh nghiệm BA. Thành thạo UML, BPMN. Kỹ năng giao tiếp tốt. Tiếng Anh B2+.',
 'Lương 15-25 triệu. Đi công tác nước ngoài. Phát triển nghề nghiệp. Môi trường quốc tế.',
 1, 4, 15000000, 25000000, 'Hà Nội', 'toan_thoi_gian', '2026-08-01'),

('Data Engineer',
 'Xây dựng và vận hành data pipeline. Thiết kế data warehouse, tích hợp nguồn dữ liệu đa dạng.',
 'Thành thạo Python, SQL. Kinh nghiệm Spark, Airflow hoặc dbt. Hiểu về cloud data platform AWS/GCP.',
 'Lương 22-40 triệu. Remote friendly. Budget học tập. Conference attendance.',
 3, 4, 22000000, 40000000, 'Đà Nẵng', 'toan_thoi_gian', '2026-08-20'),

('Scrum Master / Agile Coach',
 'Dẫn dắt quy trình Scrum cho 2-3 team. Coaching team về Agile mindset, loại bỏ impediment.',
 'Chứng chỉ CSM hoặc PSM. Tối thiểu 3 năm kinh nghiệm Scrum Master. Kỹ năng facilitation tốt.',
 'Lương 25-40 triệu. Hỗ trợ thi chứng chỉ. Flexible working. Leadership development.',
 5, 4, 25000000, 40000000, 'Hà Nội', 'toan_thoi_gian', '2026-07-31'),

('Cloud Solutions Architect',
 'Thiết kế kiến trúc hệ thống trên AWS/Azure. Tư vấn giải pháp cloud cho khách hàng doanh nghiệp.',
 'Chứng chỉ AWS Solutions Architect hoặc tương đương. Tối thiểu 5 năm kinh nghiệm IT. Tiếng Anh tốt.',
 'Lương 40-70 triệu. Phụ cấp đi lại. Tài trợ chứng chỉ. Môi trường enterprise.',
 5, 4, 40000000, 70000000, 'Hà Nội', 'toan_thoi_gian', '2026-08-25'),

('Python Developer (Backend)',
 'Xây dựng API và microservices bằng Python. Làm việc với Django REST Framework hoặc FastAPI.',
 'Thành thạo Python, Django hoặc FastAPI. Biết PostgreSQL, Redis. Hiểu về Docker, CI/CD.',
 'Lương 16-28 triệu. Remote 3 ngày/tuần. Team quốc tế. Công nghệ hiện đại.',
 3, 4, 16000000, 28000000, 'TP.HCM', 'toan_thoi_gian', '2026-08-01'),

('Product Manager',
 'Định hướng và phát triển sản phẩm SaaS B2B. Nghiên cứu thị trường, viết PRD, phối hợp dev và design.',
 'Tối thiểu 3 năm kinh nghiệm PM. Tư duy data-driven. Kỹ năng giao tiếp xuất sắc. Tiếng Anh tốt.',
 'Lương 30-50 triệu. Quyền quyết định sản phẩm. Stock option. Môi trường startup scale-up.',
 2, 4, 30000000, 50000000, 'TP.HCM', 'toan_thoi_gian', '2026-08-10'),

('Network Engineer',
 'Quản lý và vận hành hạ tầng mạng doanh nghiệp. Cấu hình router, switch, firewall, VPN.',
 'Chứng chỉ CCNA trở lên. Kinh nghiệm Cisco, Juniper. Biết network security. Sẵn sàng trực 24/7.',
 'Lương 15-25 triệu. Phụ cấp trực. Đào tạo nâng cao. Môi trường ổn định.',
 5, 4, 15000000, 25000000, 'Hà Nội', 'toan_thoi_gian', '2026-07-28'),

('Cybersecurity Analyst',
 'Phân tích và ứng phó sự cố bảo mật. Thực hiện pentest, đánh giá rủi ro, xây dựng chính sách bảo mật.',
 'Kiến thức vững về network security, OWASP. Biết công cụ pentest. Chứng chỉ CEH/OSCP là lợi thế.',
 'Lương 20-35 triệu. Môi trường thách thức. Tài trợ chứng chỉ bảo mật. Team chuyên nghiệp.',
 5, 4, 20000000, 35000000, 'Hà Nội', 'toan_thoi_gian', '2026-08-15'),

('Technical Writer',
 'Viết tài liệu kỹ thuật, hướng dẫn API, user guide. Duy trì developer portal và knowledge base.',
 'Kỹ năng viết tiếng Anh xuất sắc. Hiểu biết về phần mềm và API. Biết Markdown, Swagger. Tỉ mỉ, chính xác.',
 'Lương 12-20 triệu. Remote hoàn toàn. Giờ làm linh hoạt. Môi trường quốc tế.',
 1, 4, 12000000, 20000000, 'Hà Nội', 'tu_do', '2026-08-01'),

('React Native Developer',
 'Phát triển ứng dụng mobile cross-platform cho iOS và Android. Tích hợp native modules khi cần.',
 'Thành thạo React Native. Hiểu về iOS và Android native. Biết Redux hoặc Zustand. Có app đã release là lợi thế.',
 'Lương 18-32 triệu. Thiết bị test cả iOS và Android. Hybrid work. Team sản phẩm.',
 4, 4, 18000000, 32000000, 'TP.HCM', 'toan_thoi_gian', '2026-08-12'),

('Database Administrator (DBA)',
 'Quản trị, tối ưu hệ thống database MySQL và PostgreSQL quy mô lớn. Backup, recovery, performance tuning.',
 'Tối thiểu 3 năm kinh nghiệm DBA. Thành thạo MySQL/PostgreSQL. Biết replication, partitioning, indexing.',
 'Lương 20-35 triệu. Môi trường ổn định. Đào tạo chuyên sâu. Thưởng hiệu suất.',
 1, 4, 20000000, 35000000, 'Hà Nội', 'toan_thoi_gian', '2026-07-31'),

('Golang Backend Developer',
 'Phát triển các service hiệu suất cao bằng Golang. Xây dựng API, message queue consumer, background jobs.',
 'Thành thạo Golang. Biết Gin hoặc Echo framework. Kinh nghiệm với gRPC, Kafka là lợi thế.',
 'Lương 22-38 triệu. Remote-first. Tech stack hiện đại. Team quốc tế nhỏ gọn.',
 2, 4, 22000000, 38000000, 'TP.HCM', 'toan_thoi_gian', '2026-08-20'),

('AI/LLM Application Developer',
 'Xây dựng ứng dụng tích hợp Large Language Models (GPT, Claude). Thiết kế prompt, RAG pipeline, AI agent.',
 'Kinh nghiệm làm việc với OpenAI API hoặc tương đương. Biết Python, LangChain hoặc LlamaIndex. Tư duy sáng tạo.',
 'Lương 25-45 triệu. Cutting-edge technology. Budget API/compute được tài trợ. Môi trường research.',
 3, 4, 25000000, 45000000, 'TP.HCM', 'toan_thoi_gian', '2026-08-25'),

('IT Support Specialist',
 'Hỗ trợ kỹ thuật cho nhân viên nội bộ. Cài đặt, cấu hình máy tính, xử lý sự cố phần cứng/phần mềm.',
 'Kiến thức về Windows, macOS, Linux. Kỹ năng troubleshooting tốt. Giao tiếp tốt. Chứng chỉ CompTIA A+ là lợi thế.',
 'Lương 8-14 triệu. Môi trường ổn định. Đào tạo kỹ năng. Lộ trình thăng tiến rõ ràng.',
 1, 4, 8000000, 14000000, 'Hà Nội', 'toan_thoi_gian', '2026-07-25');
