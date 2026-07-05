-- Migration: Thêm các cột còn thiếu vào bảng ung_tuyen
-- Chạy file này trên database hiện có (không cần reset dữ liệu)

USE goi_y_viec_lam;

-- Thêm cột han_xac_nhan nếu chưa có
ALTER TABLE ung_tuyen
  ADD COLUMN IF NOT EXISTS han_xac_nhan DATETIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS da_chon TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cv_file_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cv_file_data LONGBLOB DEFAULT NULL;

-- Thêm cột sở thích tìm việc vào bảng ho_so
ALTER TABLE ho_so
  ADD COLUMN IF NOT EXISTS loai_hinh_mong_muon ENUM('toan_thoi_gian','ban_thoi_gian','tu_do','thuc_tap') DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dia_chi_mong_muon VARCHAR(100) DEFAULT NULL;

-- Tạo bảng thong_bao nếu chưa có
CREATE TABLE IF NOT EXISTS thong_bao (
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
