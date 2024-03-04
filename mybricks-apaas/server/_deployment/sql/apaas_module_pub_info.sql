CREATE TABLE IF NOT EXISTS `apaas_module_pub_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `module_id` bigint DEFAULT NULL,
  `version` varchar(50) DEFAULT NULL,
  `content` mediumtext,
  `ext_name` varchar(256) DEFAULT NULL,
  `file_name` varchar(256) DEFAULT NULL,
  `file_id` bigint DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `creator_id` varchar(128) CHARACTER SET utf8mb4 DEFAULT NULL,
  `creator_name` varchar(256) DEFAULT NULL,
  `create_time` bigint DEFAULT NULL,
  `commit_info` mediumtext,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_moduleId_version` (`module_id`,`version`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;