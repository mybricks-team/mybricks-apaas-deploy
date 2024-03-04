CREATE TABLE IF NOT EXISTS `material_info` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `type` varchar(100) NOT NULL DEFAULT '' COMMENT '组件库/组件类型',
  `scope_status` int(11) DEFAULT '0' COMMENT '物料露出状态，-1-私有，0-workspace公开，1-全局公开',
  `namespace` varchar(255) NOT NULL DEFAULT '' COMMENT '组件唯一标识',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `creator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '创建人id',
  `creator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '创建人名',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人id',
  `updator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人名称',
  `icon` mediumtext NOT NULL COMMENT '物料图标',
  `preview_img` mediumtext NOT NULL COMMENT '物料预览图',
  `title` varchar(100) NOT NULL DEFAULT '' COMMENT '物料名称',
  `description` varchar(256) DEFAULT '' COMMENT '描述',
  `status` int(11) DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  `meta` mediumtext COMMENT '物料额外信息',
  `scene_id` bigint(20) DEFAULT NULL COMMENT '场景ID',
  PRIMARY KEY (`id`),
  KEY `idx_namespace` (`namespace`),
  KEY `idx_type` (`type`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='物料表';