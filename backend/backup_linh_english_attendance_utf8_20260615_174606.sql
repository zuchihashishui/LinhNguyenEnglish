-- =====================================================
-- Backup UTF-8 chuan cho linh_english_attendance
-- Sinh luc: 2026-06-15T10:46:06.960Z
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `linh_english_attendance` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `linh_english_attendance`;

-- --------------------------------------------------------
-- Cau truc bang `attendances`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `attendances`;
CREATE TABLE `attendances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `student_id` int NOT NULL,
  `is_present` tinyint(1) NOT NULL DEFAULT '0',
  `lesson_score` tinyint DEFAULT NULL,
  `lesson_grade` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacher_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendances_session_student` (`session_id`,`student_id`),
  KEY `idx_attendances_session_id` (`session_id`),
  KEY `idx_attendances_student_id` (`student_id`),
  CONSTRAINT `fk_attendances_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendances_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_lesson_grade` CHECK (((`lesson_grade` is null) or (`lesson_grade` in (_utf8mb4'Tốt',_utf8mb4'Khá',_utf8mb4'Trung bình',_utf8mb4'Yếu')))),
  CONSTRAINT `chk_lesson_score` CHECK (((`lesson_score` is null) or (`lesson_score` between 1 and 10)))
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40000 ALTER TABLE `attendances` DISABLE KEYS */;
INSERT INTO `attendances` VALUES
  (1,1,8,1,9,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (2,1,7,1,7,'Khá','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (3,1,9,1,8,'Khá','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (4,1,5,1,8,'Khá','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (5,1,3,1,8,'Khá','Cần ôn thêm từ vựng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (6,1,10,1,9,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (7,1,1,1,9,'Tốt','Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (8,1,4,1,5,'Trung bình','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (9,1,2,1,9,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (10,1,6,0,NULL,NULL,'Vắng không phép','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (11,2,8,1,5,'Trung bình','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (12,2,7,1,10,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (13,2,9,1,9,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (14,2,5,1,7,'Khá','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (15,2,3,1,8,'Khá','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (16,2,10,1,9,'Tốt','Cần ôn thêm từ vựng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (17,2,1,1,9,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (18,2,4,1,7,'Khá','Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (19,2,2,0,NULL,NULL,'Vắng không phép','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (20,2,6,0,NULL,NULL,'Xin nghỉ ốm','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (21,3,8,1,9,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (22,3,7,1,9,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (23,3,9,1,7,'Khá','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (24,3,5,1,8,'Khá','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (25,3,3,1,10,'Tốt','Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (26,3,10,1,9,'Tốt','Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (27,3,1,1,9,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (28,3,4,1,7,'Khá','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (29,3,2,1,9,'Tốt','Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (30,3,6,1,9,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (31,4,8,1,7,'Khá','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (32,4,7,1,10,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (33,4,9,1,8,'Khá','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (34,4,5,1,9,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (35,4,3,1,9,'Tốt','Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (36,4,10,1,5,'Trung bình','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (37,4,1,0,NULL,NULL,'Vắng không phép','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (38,4,4,1,NULL,NULL,'Xin nghỉ ốm','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (39,4,2,1,NULL,NULL,'Xin nghỉ ốm','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (40,4,6,1,NULL,NULL,'Xin nghỉ ốm','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (41,5,11,1,7,'Khá','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (42,5,12,1,5,'Trung bình','Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (43,6,14,1,8,'Khá','Cần ôn thêm từ vựng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (44,6,15,1,6,'Trung bình','Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (45,6,13,0,NULL,NULL,'Vắng không phép','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (46,7,14,1,9,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (47,7,15,1,10,'Tốt','Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (48,7,13,1,5,'Trung bình','Cần ôn thêm từ vựng.','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (49,9,1,0,NULL,NULL,'Vắng không phép','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (50,9,2,1,9,'Tốt',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (51,9,3,1,9,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (52,9,4,0,NULL,NULL,'Có việc gia đình','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (53,9,5,1,8,'Khá',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (54,9,6,1,10,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (55,9,7,1,9,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (56,9,8,0,NULL,NULL,'Có việc gia đình','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (57,9,9,0,NULL,NULL,'Xin nghỉ ốm','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (58,9,10,1,5,'Trung bình','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (59,10,1,1,10,'Tốt',NULL,'2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (60,10,2,1,8,'Khá','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (61,10,3,1,9,'Tốt','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (62,10,4,1,9,'Tốt',NULL,'2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (63,10,5,1,6,'Trung bình',NULL,'2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (64,10,6,1,10,'Tốt','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (65,10,7,1,5,'Trung bình',NULL,'2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (66,10,8,1,6,'Trung bình','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (67,10,9,1,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (68,10,10,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (69,11,1,0,NULL,NULL,'Xin nghỉ ốm','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (70,11,2,1,6,'Trung bình','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (71,11,3,1,8,'Khá',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (72,11,4,1,8,'Khá','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (73,11,5,1,9,'Tốt',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (74,11,6,0,NULL,NULL,'Có việc gia đình','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (75,11,7,1,9,'Tốt',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (76,11,8,1,10,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (77,11,9,1,5,'Trung bình','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (78,11,10,1,6,'Trung bình','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (79,12,1,1,10,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (80,12,2,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (81,12,3,1,6,'Trung bình',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (82,12,4,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (83,12,5,1,10,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (84,12,6,0,NULL,NULL,'Vắng không phép','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (85,12,7,1,7,'Khá',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (86,12,8,1,6,'Trung bình','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (87,12,9,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (88,12,10,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (89,13,1,1,10,'Tốt','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (90,13,2,1,7,'Khá',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (91,13,3,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (92,13,4,1,8,'Khá',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (93,13,5,1,10,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (94,13,6,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (95,13,7,1,5,'Trung bình','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (96,13,8,1,8,'Khá','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (97,13,9,1,5,'Trung bình','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (98,13,10,1,5,'Trung bình','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (99,14,1,1,9,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (100,14,2,1,8,'Khá',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (101,14,3,1,10,'Tốt',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (102,14,4,0,NULL,NULL,'Xin nghỉ ốm','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (103,14,5,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (104,14,6,1,10,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (105,14,7,0,NULL,NULL,'Vắng không phép','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (106,14,8,1,7,'Khá',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (107,14,9,1,7,'Khá','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (108,14,10,1,10,'Tốt',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (109,15,11,1,10,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (110,15,12,1,5,'Trung bình','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (111,16,11,1,7,'Khá',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (112,16,12,1,5,'Trung bình','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (113,17,11,1,6,'Trung bình','Chú ý nghe giảng hơn.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (114,17,12,1,6,'Trung bình','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (115,18,11,1,5,'Trung bình','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (116,18,12,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (117,19,11,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (118,19,12,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (119,20,11,1,6,'Trung bình','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (120,20,12,1,7,'Khá','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (121,21,11,1,5,'Trung bình','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (122,21,12,1,6,'Trung bình',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (123,22,13,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (124,22,14,1,6,'Trung bình','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (125,22,15,1,10,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (126,23,13,1,8,'Khá','Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (127,23,14,1,9,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (128,23,15,0,NULL,NULL,'Vắng không phép','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (129,24,13,1,7,'Khá','Chú ý nghe giảng hơn.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (130,24,14,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (131,24,15,1,5,'Trung bình',NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (132,25,13,1,9,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (133,25,14,1,5,'Trung bình','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (134,25,15,1,10,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (135,26,13,0,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (136,26,14,1,9,'Tốt','Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (137,26,15,1,9,'Tốt','Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (138,27,13,1,10,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:54','2026-06-14 01:16:54'),
  (139,27,14,1,5,'Trung bình','Chú ý nghe giảng hơn.','2026-06-14 01:16:54','2026-06-14 01:16:54'),
  (140,27,15,1,10,'Tốt','Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:54','2026-06-14 01:16:54'),
  (191,8,8,1,7,'Tốt','học tập trung','2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (192,8,7,1,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (193,8,9,1,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (194,8,5,1,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (195,8,3,1,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (196,8,10,1,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (197,8,1,0,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (198,8,4,0,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (199,8,2,0,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (200,8,6,0,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04');
/*!40000 ALTER TABLE `attendances` ENABLE KEYS */;

-- --------------------------------------------------------
-- Cau truc bang `classes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_classes_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES
  (1,'Lớp 10A1 - Tiếng Anh','Lớp 10',2,'2026-06-14 00:20:47'),
  (2,'Lớp 11B2 - Tiếng Anh','Lớp 11',3,'2026-06-14 00:20:47'),
  (3,'Lớp 12C3 - IELTS','Lớp 12',4,'2026-06-14 00:20:47'),
  (9,'sdsdf','sdfsdf',2,'2026-06-14 16:04:09');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;

-- --------------------------------------------------------
-- Cau truc bang `sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `session_date` date NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sessions_class_date` (`class_id`,`session_date`),
  KEY `idx_sessions_class_id` (`class_id`),
  CONSTRAINT `fk_sessions_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES
  (1,1,'2026-06-06','Unit 1: Family Life - Reading','Đọc hiểu bài Family Life.','2026-06-14 00:20:47'),
  (2,1,'2026-06-11','Unit 2: Friends - Listening','Luyện nghe chủ đề Friends.','2026-06-14 00:20:47'),
  (3,1,'2026-06-12','Unit 3: Teen Life - Vocabulary','Học từ vựng chương 3.','2026-06-14 00:20:47'),
  (4,1,'2026-06-13','Unit 3: Teen Life - Speaking','Ôn tập từ vựng chương 3.','2026-06-14 00:20:47'),
  (5,2,'2026-06-13','Unit 5: Travel - Speaking','Nói về du lịch.','2026-06-14 00:20:47'),
  (6,3,'2026-06-10','IELTS Speaking Part 1 - Intro','Làm quen part 1.','2026-06-14 00:20:47'),
  (7,3,'2026-06-13','IELTS Speaking Part 2 - Cue Card','Long turn.','2026-06-14 00:20:47'),
  (8,1,'2026-06-14','Test t? d?ng','test','2026-06-14 01:00:27'),
  (9,1,'2026-06-03','Unit 3: Teen Life - Vocabulary','Buổi học tự động','2026-06-14 01:16:22'),
  (10,1,'2026-06-04','Unit 2: Friends - Vocabulary','Buổi học tự động','2026-06-14 01:16:53'),
  (11,1,'2026-06-07','Unit 2: Friends - Grammar','Buổi học tự động','2026-06-14 01:16:53'),
  (12,1,'2026-06-08','Unit 2: Friends - Vocabulary','Buổi học tự động','2026-06-14 01:16:53'),
  (13,1,'2026-06-09','Unit 3: Teen Life - Speaking','Buổi học tự động','2026-06-14 01:16:53'),
  (14,1,'2026-06-10','Unit 3: Teen Life - Reading','Buổi học tự động','2026-06-14 01:16:53'),
  (15,2,'2026-06-03','Unit 2: Friends - Speaking','Buổi học tự động','2026-06-14 01:16:53'),
  (16,2,'2026-06-04','Unit 3: Teen Life - Listening','Buổi học tự động','2026-06-14 01:16:53'),
  (17,2,'2026-06-07','Unit 3: Teen Life - Reading','Buổi học tự động','2026-06-14 01:16:53'),
  (18,2,'2026-06-08','Unit 1: Family Life - Listening','Buổi học tự động','2026-06-14 01:16:53'),
  (19,2,'2026-06-09','Unit 3: Teen Life - Vocabulary','Buổi học tự động','2026-06-14 01:16:53'),
  (20,2,'2026-06-10','Unit 2: Friends - Reading','Buổi học tự động','2026-06-14 01:16:53'),
  (21,2,'2026-06-11','Unit 3: Teen Life - Speaking','Buổi học tự động','2026-06-14 01:16:53'),
  (22,3,'2026-06-03','Unit 1: Family Life - Speaking','Buổi học tự động','2026-06-14 01:16:53'),
  (23,3,'2026-06-04','Unit 2: Friends - Speaking','Buổi học tự động','2026-06-14 01:16:53'),
  (24,3,'2026-06-07','Unit 1: Family Life - Speaking','Buổi học tự động','2026-06-14 01:16:53'),
  (25,3,'2026-06-08','Unit 2: Friends - Vocabulary','Buổi học tự động','2026-06-14 01:16:53'),
  (26,3,'2026-06-09','Unit 1: Family Life - Listening','Buổi học tự động','2026-06-14 01:16:53'),
  (27,3,'2026-06-11','Unit 1: Family Life - Writing','Buổi học tự động','2026-06-14 01:16:54'),
  (28,1,'2026-06-25','Buổi học 2026-06-25','Tạo nhanh từ trang điểm danh','2026-06-14 01:36:11'),
  (29,1,'2026-06-15','Buổi học 2026-06-15','Tạo nhanh từ trang điểm danh','2026-06-14 11:12:25'),
  (30,9,'2026-06-14','Buổi học 14/6/2026','Tạo tự động khi bấm Điểm danh','2026-06-14 16:04:12');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;

-- --------------------------------------------------------
-- Cau truc bang `students`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('M','F','O') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_code` (`student_code`),
  KEY `idx_students_class_id` (`class_id`),
  CONSTRAINT `fk_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES
  (1,1,'Nguyễn Minh Anh','HS001','F','2008-04-12','2026-06-14 00:20:47'),
  (2,1,'Trần Quốc Bảo','HS002','M','2008-08-25','2026-06-14 00:20:47'),
  (3,1,'Lê Hồng Châu','HS003','F','2008-02-09','2026-06-14 00:20:47'),
  (4,1,'Phạm Gia Đức','HS004','M','2008-11-30','2026-06-14 00:20:47'),
  (5,1,'Hoàng Bảo Hân','HS005','F','2008-06-18','2026-06-14 00:20:47'),
  (6,1,'Vũ Khánh Huy','HS006','M','2008-09-04','2026-06-14 00:20:47'),
  (7,1,'Đặng Thùy Linh','HS007','F','2008-01-22','2026-06-14 00:20:47'),
  (8,1,'Bùi Quang Minh','HS008','M','2008-05-15','2026-06-14 00:20:47'),
  (9,1,'Đỗ Thanh Ngân','HS009','F','2008-07-07','2026-06-14 00:20:47'),
  (10,1,'Ngô Tuấn Phong','HS010','M','2008-03-28','2026-06-14 00:20:47'),
  (11,2,'Đào Duy Thành','HS011','M','2007-05-02','2026-06-14 00:20:47'),
  (12,2,'Hà Kim Yến','HS012','F','2007-09-14','2026-06-14 00:20:47'),
  (13,3,'Trương An Khang','HS013','M','2006-03-10','2026-06-14 00:20:47'),
  (14,3,'Lý Bảo Ngọc','HS014','F','2006-08-22','2026-06-14 00:20:47'),
  (15,3,'Phan Công Phú','HS015','M','2006-12-05','2026-06-14 00:20:47'),
  (16,9,'sSDDS','SDFSDFDSF','M','2026-06-02','2026-06-14 16:04:33');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;

-- --------------------------------------------------------
-- Cau truc bang `teachers`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES
  (1,'admin','98ed4eb3fbd8a87681e6662b3dddccc7:808b1f7ba20ef0704eb354aa41fbc8eada82c5626f7f241e9f45843327ff193d40472480660651919506f671a4ef14e9276c09a0818e9553bc6d67cd630cb271','Quản trị viên',1,'2026-06-14 00:20:46'),
  (2,'linhnguyen','71e24edc8f84b5c6852e445d06f749a8:085889b9b1a1b3829a0f20444b7d62dfaf6ef76aa5ac7f92d72f166636097bf8fac77b52e1d4de1a2d17d36e4567782e80c100d4d6fb34c273ced4c0146902cd','Nguyễn Thị Linh',0,'2026-06-14 00:20:46'),
  (3,'mai','811b9c8d4a1657a3fd09aeafef96963d:7015bfb6836477692c184126469d4cfce189cf887fbf8b29c88e9483b244a2d8caa90aae46511202cddd05b851bd7a06d18a7da28d1b916ce10e1f7f9f58fb96','Nguyễn Thị Mai',0,'2026-06-14 00:20:47'),
  (4,'tuan','4d2b54ea6a5d5a21948a6d408a8d5b29:3e6e540ad5e93aa2a8047b27c21913073012b4568e92164efad94d892d9b9a9202ef69b42270751eff36cd496b4a29022e708e283b954702eec1f0b9f5702e28','Trần Minh Tuấn',0,'2026-06-14 00:20:47'),
  (9,'testuser_656715','12d3197972cf52e897b40d24b08efd94:444c4eb21bd2b6b56a5fc4f7edbff18bf958ae52dc6c319fb18e6fe98cc17a9d1e3cb791dad3ecd4d4bdb686ab1dbfde3f10c9afa7ff2df25e9c569efa8f257f','Test User',0,'2026-06-14 01:17:36'),
  (10,'testuser_727366','094714d45a07056f988284b0d6603f4f:3840a13d7debc93fbc52ec4d4e8429a034e53893bca557094a0991f608d0de5b3fa70e63aec9577a66717915a24a1352a1353664b3fecd242155e443cc7c65bb','Test User',0,'2026-06-14 01:18:47'),
  (11,'letiendinh','313486a0b6ac89f0ddeead9a50594ae1:cd061c98334692583921b6c69991ba40303387748aacad62186d8b79144f8fb2296cb82958aacdde6a407629d79a6eff5bd8b16d744aedab6e7d680d41674035','Lê Tiến Đình',0,'2026-06-14 01:56:48');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;

SET FOREIGN_KEY_CHECKS = 1;

-- Backup hoan tat: 2026-06-15T10:46:06.990Z