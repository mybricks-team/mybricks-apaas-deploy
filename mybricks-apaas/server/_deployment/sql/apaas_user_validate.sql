CREATE TABLE IF NOT EXISTS `apaas_user_validate` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `user_id` varchar(256) NOT NULL COMMENT '用户名',
  `type` varchar(256) NOT NULL COMMENT '验证类型，邮箱/手机号',
  `captcha` varchar(256) DEFAULT NULL COMMENT '验证码',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `status` int DEFAULT NULL COMMENT '状态',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;