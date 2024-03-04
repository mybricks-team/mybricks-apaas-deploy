CREATE TABLE IF NOT EXISTS `domain_table_meta` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '表名',
  `domain_file_id` bigint NOT NULL COMMENT '领域模型文件 ID',
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `project_id` bigint DEFAULT NULL COMMENT '领域模型文件所处项目ID',
  PRIMARY KEY (`id`),
  KEY `idx_domain_file_id` (`domain_file_id`),
  KEY `idx_table_name` (`table_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='领域模型元信息表';