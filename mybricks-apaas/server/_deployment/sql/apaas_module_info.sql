CREATE TABLE IF NOT EXISTS `apaas_module_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(256) CHARACTER SET utf8mb4 DEFAULT NULL,
  `origin_file_id` bigint DEFAULT NULL COMMENT '源文件ID',
  `version` varchar(50) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '版本',
  `description` varchar(256) DEFAULT NULL,
  `creator_name` varchar(256) CHARACTER SET utf8mb4 DEFAULT NULL,
  `creator_id` varchar(128) DEFAULT NULL,
  `create_time` bigint DEFAULT NULL,
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;