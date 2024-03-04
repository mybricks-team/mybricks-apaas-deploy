CREATE TABLE IF NOT EXISTS `apaas_service_pub` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `file_id` bigint DEFAULT NULL COMMENT '文件id',
  `service_id` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件内具体服务id',
  `file_pub_id` bigint DEFAULT NULL COMMENT '所属文件发布id',
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `content` mediumtext COLLATE utf8mb4_general_ci COMMENT '详细内容',
  `env` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '发布环境',
  `status` int unsigned NOT NULL COMMENT '状态',
  `creator_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建者ID',
  `creator_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '服务名称',
  PRIMARY KEY (`id`),
  KEY `idx_fileId_serviceId_env` (`file_id`,`service_id`,`env`),
  KEY `idx_fileid_serviceId_projectid_env` (`file_id`,`service_id`,`project_id`,`env`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;