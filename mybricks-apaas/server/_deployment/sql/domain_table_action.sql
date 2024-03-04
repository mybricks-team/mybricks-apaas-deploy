CREATE TABLE IF NOT EXISTS `domain_table_action` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `table_meta` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '表格元信息',
  `action_log` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '表格操作记录',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `domain_meta_id` bigint NOT NULL COMMENT 'domain_meta表记录ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='领域模型操作记录表';