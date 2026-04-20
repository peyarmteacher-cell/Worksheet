/* 
   สคริปต์สร้างฐานข้อมูล KruAI Studio สำหรับ PHP 
   คุณครูนำไปรันในเมนู SQL ของ phpMyAdmin ได้เลยครับ
*/

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `national_id` varchar(13) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `school` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `api_key` text DEFAULT NULL,
  `status` enum('pending','approved') DEFAULT 'pending',
  `auth_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `national_id` (`national_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `exercises` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `indicator` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `exercises_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* สร้างบัญชี Admin เริ่มต้น (รหัสผ่านคือ 123456) */
INSERT IGNORE INTO `users` (`national_id`, `full_name`, `password`, `school`, `position`, `status`) 
VALUES ('admin', 'ผู้ดูแลระบบ', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ศธ.', 'ผู้ดูแลระบบ', 'approved');
