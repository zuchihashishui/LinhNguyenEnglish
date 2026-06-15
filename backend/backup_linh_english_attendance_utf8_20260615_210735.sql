-- =====================================================
-- Backup UTF-8 chuan cho linh_english_attendance
-- Sinh luc: 2026-06-15T14:07:35.263Z
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
  `exercise_score` tinyint DEFAULT NULL COMMENT 'Điểm bài tập (1-10)',
  `teacher_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendances_session_student` (`session_id`,`student_id`),
  KEY `idx_attendances_session_id` (`session_id`),
  KEY `idx_attendances_student_id` (`student_id`),
  CONSTRAINT `fk_attendances_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendances_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_exercise_score` CHECK (((`exercise_score` is null) or (`exercise_score` between 1 and 10))),
  CONSTRAINT `chk_lesson_grade` CHECK (((`lesson_grade` is null) or (`lesson_grade` in (_utf8mb4'Tốt',_utf8mb4'Khá',_utf8mb4'Trung bình',_utf8mb4'Yếu')))),
  CONSTRAINT `chk_lesson_score` CHECK (((`lesson_score` is null) or (`lesson_score` between 1 and 10)))
) ENGINE=InnoDB AUTO_INCREMENT=253 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40000 ALTER TABLE `attendances` DISABLE KEYS */;
INSERT INTO `attendances` VALUES
  (1,1,8,1,9,'Tốt',5,'Làm bài tập tốt','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (2,1,7,1,7,'Khá',9,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (3,1,9,1,8,'Khá',10,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (4,1,5,1,8,'Khá',7,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (5,1,3,1,8,'Khá',9,'Cần ôn thêm từ vựng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (6,1,10,1,9,'Tốt',8,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (7,1,1,1,9,'Tốt',10,'Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (8,1,4,1,5,'Trung bình',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (9,1,2,1,9,'Tốt',9,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (10,1,6,0,NULL,NULL,NULL,'Vắng không phép','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (11,2,8,1,5,'Trung bình',10,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (12,2,7,1,10,'Tốt',5,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (13,2,9,1,9,'Tốt',7,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (14,2,5,1,7,'Khá',5,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (15,2,3,1,8,'Khá',6,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (16,2,10,1,9,'Tốt',9,'Cần ôn thêm từ vựng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (17,2,1,1,9,'Tốt',6,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (18,2,4,1,7,'Khá',6,'Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (19,2,2,0,NULL,NULL,NULL,'Vắng không phép','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (20,2,6,0,NULL,NULL,NULL,'Xin nghỉ ốm','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (21,3,8,1,9,'Tốt',8,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (22,3,7,1,9,'Tốt',7,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (23,3,9,1,7,'Khá',8,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (24,3,5,1,8,'Khá',5,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (25,3,3,1,10,'Tốt',9,'Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (26,3,10,1,9,'Tốt',9,'Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (27,3,1,1,9,'Tốt',10,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (28,3,4,1,7,'Khá',8,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (29,3,2,1,9,'Tốt',9,'Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (30,3,6,1,9,'Tốt',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (31,4,8,1,7,'Khá',7,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (32,4,7,1,10,'Tốt',7,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (33,4,9,1,8,'Khá',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (34,4,5,1,9,'Tốt',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (35,4,3,1,9,'Tốt',9,'Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (36,4,10,1,5,'Trung bình',6,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (37,4,1,0,NULL,NULL,NULL,'Vắng không phép','2026-06-14 00:20:47','2026-06-14 01:35:27'),
  (38,4,4,1,NULL,NULL,9,'Xin nghỉ ốm','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (39,4,2,1,NULL,NULL,10,'Xin nghỉ ốm','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (40,4,6,1,NULL,NULL,10,'Xin nghỉ ốm','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (41,5,11,1,7,'Khá',9,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (42,5,12,1,5,'Trung bình',6,'Tích cực tham gia hoạt động nhóm.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (43,6,14,1,8,'Khá',7,'Cần ôn thêm từ vựng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (44,6,15,1,6,'Trung bình',8,'Phát biểu tích cực, trả lời đúng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (45,6,13,0,NULL,NULL,NULL,'Vắng không phép','2026-06-14 00:20:47','2026-06-14 00:20:47'),
  (46,7,14,1,9,'Tốt',9,'Hoàn thành tốt bài tập.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (47,7,15,1,10,'Tốt',9,'Chú ý nghe giảng hơn.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (48,7,13,1,5,'Trung bình',9,'Cần ôn thêm từ vựng.','2026-06-14 00:20:47','2026-06-15 18:30:29'),
  (49,9,1,0,NULL,NULL,NULL,'Vắng không phép','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (50,9,2,1,9,'Tốt',9,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (51,9,3,1,9,'Tốt',8,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (52,9,4,0,NULL,NULL,NULL,'Có việc gia đình','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (53,9,5,1,8,'Khá',9,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (54,9,6,1,10,'Tốt',9,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (55,9,7,1,9,'Tốt',9,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (56,9,8,0,NULL,NULL,NULL,'Có việc gia đình','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (57,9,9,0,NULL,NULL,NULL,'Xin nghỉ ốm','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (58,9,10,1,5,'Trung bình',7,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (59,10,1,1,10,'Tốt',9,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (60,10,2,1,8,'Khá',10,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (61,10,3,1,9,'Tốt',9,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (62,10,4,1,9,'Tốt',9,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (63,10,5,1,6,'Trung bình',8,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (64,10,6,1,10,'Tốt',7,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (65,10,7,1,5,'Trung bình',9,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (66,10,8,1,6,'Trung bình',8,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (67,10,9,1,NULL,NULL,5,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (68,10,10,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:32:49'),
  (69,11,1,0,NULL,NULL,NULL,'Xin nghỉ ốm','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (70,11,2,1,6,'Trung bình',9,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (71,11,3,1,8,'Khá',10,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (72,11,4,1,8,'Khá',5,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (73,11,5,1,9,'Tốt',8,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (74,11,6,0,NULL,NULL,NULL,'Có việc gia đình','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (75,11,7,1,9,'Tốt',7,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (76,11,8,1,10,'Tốt',8,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (77,11,9,1,5,'Trung bình',10,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (78,11,10,1,6,'Trung bình',10,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (79,12,1,1,10,'Tốt',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (80,12,2,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (81,12,3,1,6,'Trung bình',9,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (82,12,4,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (83,12,5,1,10,'Tốt',7,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (84,12,6,0,NULL,NULL,NULL,'Vắng không phép','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (85,12,7,1,7,'Khá',10,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (86,12,8,1,6,'Trung bình',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (87,12,9,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (88,12,10,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (89,13,1,1,10,'Tốt',9,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (90,13,2,1,7,'Khá',10,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (91,13,3,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (92,13,4,1,8,'Khá',5,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (93,13,5,1,10,'Tốt',10,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (94,13,6,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (95,13,7,1,5,'Trung bình',5,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (96,13,8,1,8,'Khá',5,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (97,13,9,1,5,'Trung bình',9,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (98,13,10,1,5,'Trung bình',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (99,14,1,1,9,'Tốt',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (100,14,2,1,8,'Khá',9,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (101,14,3,1,10,'Tốt',5,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (102,14,4,0,NULL,NULL,NULL,'Xin nghỉ ốm','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (103,14,5,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (104,14,6,1,10,'Tốt',9,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (105,14,7,0,NULL,NULL,NULL,'Vắng không phép','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (106,14,8,1,7,'Khá',9,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (107,14,9,1,7,'Khá',7,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (108,14,10,1,10,'Tốt',7,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (109,15,11,1,10,'Tốt',7,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (110,15,12,1,5,'Trung bình',8,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (111,16,11,1,7,'Khá',7,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (112,16,12,1,5,'Trung bình',8,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (113,17,11,1,6,'Trung bình',8,'Chú ý nghe giảng hơn.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (114,17,12,1,6,'Trung bình',8,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (115,18,11,1,5,'Trung bình',7,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (116,18,12,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (117,19,11,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (118,19,12,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (119,20,11,1,6,'Trung bình',6,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (120,20,12,1,7,'Khá',7,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (121,21,11,1,5,'Trung bình',7,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (122,21,12,1,6,'Trung bình',5,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (123,22,13,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (124,22,14,1,6,'Trung bình',8,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (125,22,15,1,10,'Tốt',9,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (126,23,13,1,8,'Khá',9,'Cần ôn thêm từ vựng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (127,23,14,1,9,'Tốt',9,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (128,23,15,0,NULL,NULL,NULL,'Vắng không phép','2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (129,24,13,1,7,'Khá',8,'Chú ý nghe giảng hơn.','2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (130,24,14,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (131,24,15,1,5,'Trung bình',6,NULL,'2026-06-14 01:16:53','2026-06-15 18:30:29'),
  (132,25,13,1,9,'Tốt',8,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:30'),
  (133,25,14,1,5,'Trung bình',7,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:30'),
  (134,25,15,1,10,'Tốt',8,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:53','2026-06-15 18:30:30'),
  (135,26,13,0,NULL,NULL,NULL,NULL,'2026-06-14 01:16:53','2026-06-14 01:16:53'),
  (136,26,14,1,9,'Tốt',7,'Phát biểu tích cực, trả lời đúng.','2026-06-14 01:16:53','2026-06-15 18:30:30'),
  (137,26,15,1,9,'Tốt',10,'Hoàn thành tốt bài tập.','2026-06-14 01:16:53','2026-06-15 18:30:30'),
  (138,27,13,1,10,'Tốt',9,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:54','2026-06-15 18:30:30'),
  (139,27,14,1,5,'Trung bình',5,'Chú ý nghe giảng hơn.','2026-06-14 01:16:54','2026-06-15 18:30:30'),
  (140,27,15,1,10,'Tốt',9,'Tích cực tham gia hoạt động nhóm.','2026-06-14 01:16:54','2026-06-15 18:30:30'),
  (191,8,8,1,7,'Tốt',7,'học tập trung','2026-06-14 01:38:13','2026-06-15 18:30:30'),
  (192,8,7,1,NULL,NULL,9,NULL,'2026-06-14 01:38:13','2026-06-15 18:30:30'),
  (193,8,9,1,NULL,NULL,8,NULL,'2026-06-14 01:38:13','2026-06-15 18:30:30'),
  (194,8,5,1,NULL,NULL,10,NULL,'2026-06-14 01:38:13','2026-06-15 18:30:30'),
  (195,8,3,1,NULL,NULL,7,NULL,'2026-06-14 01:38:13','2026-06-15 18:30:30'),
  (196,8,10,1,NULL,NULL,9,NULL,'2026-06-14 01:38:13','2026-06-15 18:30:30'),
  (197,8,1,0,NULL,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (198,8,4,0,NULL,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (199,8,2,0,NULL,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04'),
  (200,8,6,0,NULL,NULL,NULL,NULL,'2026-06-14 01:38:13','2026-06-14 11:12:04');
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
  (3,'Lớp 12C3 - IELTS','Lớp 12',4,'2026-06-14 00:20:47');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;

-- --------------------------------------------------------
-- Cau truc bang `migrations`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
  (1,'001_init.sql','2026-06-15 18:41:31'),
  (2,'002_add_exercise_score.sql','2026-06-15 18:41:31'),
  (3,'003_add_session_date_index.sql','2026-06-15 18:41:31');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;

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
  KEY `idx_sessions_session_date` (`session_date`),
  KEY `idx_sessions_class_date` (`class_id`,`session_date`),
  CONSTRAINT `fk_sessions_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES
  (1,1,'2026-06-06','Unit 1: Family Life - Reading','Ghi chu moi','2026-06-14 00:20:47'),
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
  (29,1,'2026-06-15','Buổi học 2026-06-15','Tạo nhanh từ trang điểm danh','2026-06-14 11:12:25');
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
  (8,1,'Bui Quang Minh','HS008','M','2008-05-15','2026-06-14 00:20:47'),
  (9,1,'Đỗ Thanh Ngân','HS009','F','2008-07-07','2026-06-14 00:20:47'),
  (10,1,'Ngô Tuấn Phong','HS010','M','2008-03-28','2026-06-14 00:20:47'),
  (11,2,'Đào Duy Thành','HS011','M','2007-05-02','2026-06-14 00:20:47'),
  (12,2,'Hà Kim Yến','HS012','F','2007-09-14','2026-06-14 00:20:47'),
  (13,3,'Trương An Khang','HS013','M','2006-03-10','2026-06-14 00:20:47'),
  (14,3,'Lý Bảo Ngọc','HS014','F','2006-08-22','2026-06-14 00:20:47'),
  (15,3,'Phan Công Phú','HS015','M','2006-12-05','2026-06-14 00:20:47');
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
  (1,'admin','6e950ffaf00112d25e649995da8f5d88:4cba6fd251a55ca33eef64ac95e0ab56250674a632a78c130d6ee75c00c9b23fdb133ef9199cd60ef5747f6db26a22fd8943c3b3234402208cf6c7e9d9641ce9','Quản trị viên',1,'2026-06-14 00:20:46'),
  (2,'linhnguyen','71e24edc8f84b5c6852e445d06f749a8:085889b9b1a1b3829a0f20444b7d62dfaf6ef76aa5ac7f92d72f166636097bf8fac77b52e1d4de1a2d17d36e4567782e80c100d4d6fb34c273ced4c0146902cd','Nguyễn Thị Linh',0,'2026-06-14 00:20:46'),
  (3,'mai','5d7e7e43ef07fe25974b22419300f6b7:f61d281315320d8841c83891b9255000de5fc3c9d4767075c67990e0e78729e599647d5d08021bfe2abce98ebb49ce05b61c22c2a3cc24d10cb9e4ea9f78f346','Nguyễn Thị Mai',0,'2026-06-14 00:20:47'),
  (4,'tuan','4d2b54ea6a5d5a21948a6d408a8d5b29:3e6e540ad5e93aa2a8047b27c21913073012b4568e92164efad94d892d9b9a9202ef69b42270751eff36cd496b4a29022e708e283b954702eec1f0b9f5702e28','Trần Minh Tuấn',0,'2026-06-14 00:20:47'),
  (9,'testuser_656715','12d3197972cf52e897b40d24b08efd94:444c4eb21bd2b6b56a5fc4f7edbff18bf958ae52dc6c319fb18e6fe98cc17a9d1e3cb791dad3ecd4d4bdb686ab1dbfde3f10c9afa7ff2df25e9c569efa8f257f','Test User',0,'2026-06-14 01:17:36'),
  (10,'testuser_727366','094714d45a07056f988284b0d6603f4f:3840a13d7debc93fbc52ec4d4e8429a034e53893bca557094a0991f608d0de5b3fa70e63aec9577a66717915a24a1352a1353664b3fecd242155e443cc7c65bb','Test User',0,'2026-06-14 01:18:47'),
  (11,'letiendinh','313486a0b6ac89f0ddeead9a50594ae1:cd061c98334692583921b6c69991ba40303387748aacad62186d8b79144f8fb2296cb82958aacdde6a407629d79a6eff5bd8b16d744aedab6e7d680d41674035','Lê Tiến Đình',0,'2026-06-14 01:56:48');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;

SET FOREIGN_KEY_CHECKS = 1;

-- Backup hoan tat: 2026-06-15T14:07:35.288Z