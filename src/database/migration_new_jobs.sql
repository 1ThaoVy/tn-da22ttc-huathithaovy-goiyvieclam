-- Migration: Thêm 20 công việc mẫu mới
-- Chạy file này trên database hiện có (không reset dữ liệu)

USE goi_y_viec_lam;

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
