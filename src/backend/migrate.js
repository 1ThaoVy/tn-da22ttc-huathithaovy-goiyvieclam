const db = require('./config/db');
async function run() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS thong_bao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nguoi_nhan_id INT NOT NULL,
        tieu_de VARCHAR(255) NOT NULL,
        noi_dung TEXT,
        loai VARCHAR(50) DEFAULT 'thong_tin',
        lien_ket VARCHAR(255) DEFAULT NULL,
        da_doc TINYINT(1) DEFAULT 0,
        ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nguoi_nhan_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
      )
    `);
    console.log('Created thong_bao table');
  } catch(e) { console.log('thong_bao:', e.message); }

  try {
    await db.query('ALTER TABLE ung_tuyen ADD COLUMN han_xac_nhan DATETIME DEFAULT NULL');
    console.log('Added han_xac_nhan column');
  } catch(e) { console.log('han_xac_nhan:', e.message); }

  process.exit(0);
}
run();
