-- 短剧生成平台数据库初始化脚本
-- 创建数据库和用户

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS shortdrama
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果不存在）
-- 注意：生产环境请使用强密码
CREATE USER IF NOT EXISTS 'shortdrama'@'%' IDENTIFIED BY 'your_secure_password_here';

-- 授予权限
GRANT ALL PRIVILEGES ON shortdrama.* TO 'shortdrama'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 使用数据库
USE shortdrama;

-- 注意：数据表结构由 Liquibase 管理，应用启动时会自动创建
-- 此脚本仅创建数据库和用户
