-- Adminer 4.8.1 MySQL 8.4.10-0ubuntu0.26.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `account_transactions`;
CREATE TABLE `account_transactions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('invoice_raised','payment_received','return_credit','manual_adjustment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `debit_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `credit_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `running_balance` decimal(15,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_transactions_created_by_foreign` (`created_by`),
  KEY `account_transactions_reference_number_index` (`reference_number`),
  KEY `account_transactions_transaction_date_index` (`transaction_date`),
  KEY `idx_account_trans_cust_date` (`customer_id`,`transaction_date`),
  CONSTRAINT `account_transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `account_transactions_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `account_transactions` (`id`, `customer_id`, `type`, `reference_number`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `transaction_date`, `created_by`, `created_at`, `updated_at`) VALUES
('2a956f5d-b818-40b3-a250-fde97213cfd8',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'invoice_raised',	'LHI-2026-0002',	'Invoice raised for Order: LHO-2026-0003',	660000.00,	0.00,	880000.00,	'2026-07-31',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:49',	'2026-07-31 16:43:49'),
('3e9eab63-d74a-459d-ae22-7089c5c4e527',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'invoice_raised',	'LHI-2026-0001',	'Invoice raised for Order: LHO-2026-0004',	220000.00,	0.00,	220000.00,	'2026-07-31',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:34',	'2026-07-31 16:43:34'),
('9ad22b98-8671-44fb-b346-8e3ab62ced29',	'41d30568-25de-4ed2-844f-4089e884cad2',	'invoice_raised',	'LHI-2026-0003',	'Invoice raised for Order: LHO-2026-0002',	260000.00,	0.00,	260000.00,	'2026-07-31',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:55',	'2026-07-31 16:43:55'),
('f53d3bfc-ceb1-469c-8672-32529e195f99',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'invoice_raised',	'LHI-2026-0004',	'Invoice raised for Order: LHO-2026-0001',	225000.00,	0.00,	1105000.00,	'2026-07-31',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:59',	'2026-07-31 16:43:59');

DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-08c6af7092d75977286199750f3a47e86fd2674d',	'i:20;',	1785351263),
('laravel-cache-08c6af7092d75977286199750f3a47e86fd2674d:timer',	'i:1785351263;',	1785351263),
('laravel-cache-1bee436135dfb844b811884c4c36e6700f183a4a',	'i:1;',	1785572153),
('laravel-cache-1bee436135dfb844b811884c4c36e6700f183a4a:timer',	'i:1785572153;',	1785572153),
('laravel-cache-22315eb8b37a5b7e793c9ca51d25120c3945878d',	'i:5;',	1785570495),
('laravel-cache-22315eb8b37a5b7e793c9ca51d25120c3945878d:timer',	'i:1785570495;',	1785570495),
('laravel-cache-2b3d093c93ad252535ccffafac1ef3384fd9a93d',	'i:1;',	1785492504),
('laravel-cache-2b3d093c93ad252535ccffafac1ef3384fd9a93d:timer',	'i:1785492504;',	1785492504),
('laravel-cache-2bc51053a87ff424feefa6ff1157e59c4f489947',	'i:3;',	1785355583),
('laravel-cache-2bc51053a87ff424feefa6ff1157e59c4f489947:timer',	'i:1785355583;',	1785355583),
('laravel-cache-2ddfb1f4757ded2b0d8bab44c38f760d140dfb22',	'i:3;',	1785572174),
('laravel-cache-2ddfb1f4757ded2b0d8bab44c38f760d140dfb22:timer',	'i:1785572174;',	1785572174),
('laravel-cache-2e824ae842d3ee816705d2685b1743afab2c37ad',	'i:2;',	1785516429),
('laravel-cache-2e824ae842d3ee816705d2685b1743afab2c37ad:timer',	'i:1785516429;',	1785516429),
('laravel-cache-339081b80e57af16cd3014e334462662bb0f3a53',	'i:1;',	1785323263),
('laravel-cache-339081b80e57af16cd3014e334462662bb0f3a53:timer',	'i:1785323263;',	1785323263),
('laravel-cache-389dc65dcc91825c23c50c562bfa38880b599ba7',	'i:1;',	1785480658),
('laravel-cache-389dc65dcc91825c23c50c562bfa38880b599ba7:timer',	'i:1785480658;',	1785480658),
('laravel-cache-3e1cd87a1054394dbf01522b69b23a175d442508',	'i:6;',	1785332165),
('laravel-cache-3e1cd87a1054394dbf01522b69b23a175d442508:timer',	'i:1785332165;',	1785332165),
('laravel-cache-47e7b5623aaae54b7f37478f85eefefae51152a8',	'i:2;',	1785570550),
('laravel-cache-47e7b5623aaae54b7f37478f85eefefae51152a8:timer',	'i:1785570550;',	1785570550),
('laravel-cache-4e2673ab3f1c016fa27962b4c7fed83dbdf5ad30',	'i:1;',	1785570416),
('laravel-cache-4e2673ab3f1c016fa27962b4c7fed83dbdf5ad30:timer',	'i:1785570416;',	1785570416),
('laravel-cache-5ff6bbc89ecb5b005c33ac8141b4ffb86edcf63a',	'i:1;',	1785516385),
('laravel-cache-5ff6bbc89ecb5b005c33ac8141b4ffb86edcf63a:timer',	'i:1785516385;',	1785516385),
('laravel-cache-706876e6104be5aa21e776783793fc16141819ce',	'i:4;',	1785570418),
('laravel-cache-706876e6104be5aa21e776783793fc16141819ce:timer',	'i:1785570418;',	1785570418),
('laravel-cache-70bc306d8e21fc090ec83d512588134695155c58',	'i:8;',	1785478605),
('laravel-cache-70bc306d8e21fc090ec83d512588134695155c58:timer',	'i:1785478605;',	1785478605),
('laravel-cache-7eb40911600b98c4842914baa954d080a4de53ad',	'i:2;',	1785414000),
('laravel-cache-7eb40911600b98c4842914baa954d080a4de53ad:timer',	'i:1785414000;',	1785414000),
('laravel-cache-86cae38071d9b4af9eac524aef1494fb59784830',	'i:5;',	1785492587),
('laravel-cache-86cae38071d9b4af9eac524aef1494fb59784830:timer',	'i:1785492587;',	1785492587),
('laravel-cache-91c245b9a5bae45366a1fdc92a329e78a737fb29',	'i:5;',	1785574003),
('laravel-cache-91c245b9a5bae45366a1fdc92a329e78a737fb29:timer',	'i:1785574003;',	1785574003),
('laravel-cache-9730d429b70331d0176146c8baf0456125236e5f',	'i:2;',	1785417376),
('laravel-cache-9730d429b70331d0176146c8baf0456125236e5f:timer',	'i:1785417376;',	1785417376),
('laravel-cache-a51627c4738971a65dac025eeefc110de06e64da',	'i:9;',	1785517247),
('laravel-cache-a51627c4738971a65dac025eeefc110de06e64da:timer',	'i:1785517247;',	1785517247),
('laravel-cache-a8890c969ae497ea8c0e4be3d2f60d4a08fccdf2',	'i:1;',	1785570497),
('laravel-cache-a8890c969ae497ea8c0e4be3d2f60d4a08fccdf2:timer',	'i:1785570497;',	1785570497),
('laravel-cache-c0446ffc3252efba05604e4a9370051f80b81e4e',	'i:28;',	1785490782),
('laravel-cache-c0446ffc3252efba05604e4a9370051f80b81e4e:timer',	'i:1785490782;',	1785490782),
('laravel-cache-c93667a907884a82ebd70836b15387f15d3be515',	'i:1;',	1785517104),
('laravel-cache-c93667a907884a82ebd70836b15387f15d3be515:timer',	'i:1785517104;',	1785517104),
('laravel-cache-d0dd94ff091f6ec5aa68d87f3e8750ad542373d4',	'i:2;',	1785570418),
('laravel-cache-d0dd94ff091f6ec5aa68d87f3e8750ad542373d4:timer',	'i:1785570418;',	1785570418),
('laravel-cache-d18219515eb79d31dc9e814076f8b7059d22668f',	'i:1;',	1785323263),
('laravel-cache-d18219515eb79d31dc9e814076f8b7059d22668f:timer',	'i:1785323263;',	1785323263),
('laravel-cache-edd8d863858ce0cf1df5a4e8d9fe07b484db7fc4',	'i:3;',	1785332520),
('laravel-cache-edd8d863858ce0cf1df5a4e8d9fe07b484db7fc4:timer',	'i:1785332520;',	1785332520),
('laravel-cache-f4b7b3c26088f1c23e35522b2760ce10bf377177',	'i:6;',	1785328935),
('laravel-cache-f4b7b3c26088f1c23e35522b2760ce10bf377177:timer',	'i:1785328935;',	1785328935),
('laravel-cache-fd4b70bf632e2ac10c48ad0cfbe91c404e74e3bc',	'i:1;',	1785570529),
('laravel-cache-fd4b70bf632e2ac10c48ad0cfbe91c404e74e3bc:timer',	'i:1785570529;',	1785570529);

DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `customer_accounts`;
CREATE TABLE `customer_accounts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_invoiced` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `last_payment_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_accounts_customer_id_unique` (`customer_id`),
  KEY `customer_accounts_current_balance_index` (`current_balance`),
  CONSTRAINT `customer_accounts_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customer_accounts` (`id`, `customer_id`, `current_balance`, `total_invoiced`, `total_paid`, `last_payment_date`, `created_at`, `updated_at`) VALUES
('152566a8-14d6-47f7-8170-1e65d61b6db7',	'05617e21-3521-4398-9eea-92b5bb6dfaaa',	0.00,	0.00,	0.00,	NULL,	'2026-08-01 07:20:22',	'2026-08-01 07:20:22'),
('1d88339c-fcbd-4f4f-b0e9-d109e4835392',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	1105000.00,	1105000.00,	0.00,	NULL,	'2026-07-31 14:38:53',	'2026-07-31 16:43:59'),
('6f4166ed-b64c-4011-8a0d-fe3553856c00',	'95066b62-0db4-4d26-9bdb-7ef01ee320a6',	0.00,	0.00,	0.00,	NULL,	'2026-08-01 07:24:05',	'2026-08-01 07:24:05'),
('855fe42f-5a68-425d-9643-4723cd1adbf9',	'88a7b280-138e-45a0-a36c-817a3c1fd684',	0.00,	0.00,	0.00,	NULL,	'2026-07-31 17:01:20',	'2026-07-31 17:01:20'),
('8a55a317-bbd9-4ef4-8327-c73fa8a73e3b',	'9aa1e184-d1cd-49dc-bbda-a1702ca46ea0',	0.00,	0.00,	0.00,	NULL,	'2026-08-01 07:25:04',	'2026-08-01 07:25:04'),
('9ff5ba8d-a146-44ff-ab03-6fae25552d4c',	'41d30568-25de-4ed2-844f-4089e884cad2',	260000.00,	260000.00,	0.00,	NULL,	'2026-07-31 14:41:04',	'2026-07-31 16:43:55'),
('db8212c2-dde4-4393-98f7-6c0d889d5126',	'dc6bc19a-fa94-4b54-8594-66eae8c2b21b',	0.00,	0.00,	0.00,	NULL,	'2026-07-31 14:39:36',	'2026-07-31 14:39:36');

DROP TABLE IF EXISTS `customer_satisfaction_scores`;
CREATE TABLE `customer_satisfaction_scores` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `score_date` date NOT NULL,
  `on_time_delivery_rate` decimal(5,2) NOT NULL,
  `return_rate` decimal(5,2) NOT NULL,
  `order_completion_rate` decimal(5,2) NOT NULL,
  `payment_reliability_score` decimal(5,2) NOT NULL,
  `order_frequency_trend` enum('increasing','stable','declining') COLLATE utf8mb4_unicode_ci NOT NULL,
  `overall_score` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_satisfaction_scores_customer_id_foreign` (`customer_id`),
  CONSTRAINT `customer_satisfaction_scores_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_primary` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_secondary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `logo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_zone_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_type` enum('supermarket','restaurant','individual','institution','wholesaler') COLLATE utf8mb4_unicode_ci NOT NULL,
  `classification` enum('independent','file_opener','branch') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'independent',
  `credit_terms` enum('cash','7_days','14_days','30_days') COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit_limit` decimal(15,2) NOT NULL,
  `account_status` enum('active','suspended','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `date_registered` date NOT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customers_delivery_zone_id_foreign` (`delivery_zone_id`),
  KEY `customers_created_by_foreign` (`created_by`),
  KEY `customers_parent_id_index` (`parent_id`),
  CONSTRAINT `customers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `customers_delivery_zone_id_foreign` FOREIGN KEY (`delivery_zone_id`) REFERENCES `delivery_zones` (`id`),
  CONSTRAINT `customers_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customers` (`id`, `parent_id`, `name`, `contact_person`, `phone_primary`, `phone_secondary`, `email`, `address`, `latitude`, `longitude`, `logo_path`, `delivery_zone_id`, `customer_type`, `classification`, `credit_terms`, `credit_limit`, `account_status`, `notes`, `date_registered`, `created_by`, `created_at`, `updated_at`) VALUES
('05617e21-3521-4398-9eea-92b5bb6dfaaa',	'88a7b280-138e-45a0-a36c-817a3c1fd684',	'Fraine Kira',	'Contact',	'0842464286',	NULL,	NULL,	'Kira',	0.40888333,	32.64182135,	NULL,	'138fbe62-a76d-4c44-9fa0-2b68b90fc86d',	'supermarket',	'branch',	'7_days',	10000000.00,	'active',	NULL,	'2026-08-01',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:20:22',	'2026-08-01 07:20:22'),
('15dbc4b1-dc16-41f6-863e-d3a60a28536a',	NULL,	'Farm shop',	'Daudi',	'0789042022',	NULL,	NULL,	'Akright',	0.16254279,	32.53300866,	NULL,	'921c8a76-a82f-4a51-9b26-2e7fe750ff3f',	'individual',	'independent',	'7_days',	10000000.00,	'active',	NULL,	'2026-07-31',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 14:38:53',	'2026-07-31 14:38:53'),
('41d30568-25de-4ed2-844f-4089e884cad2',	'dc6bc19a-fa94-4b54-8594-66eae8c2b21b',	'Ugaroll Lweza',	'Contact',	'0784266526',	NULL,	'c@gmail.com',	'Lweza',	0.21838506,	32.54488679,	NULL,	'1e542417-230d-4040-b35d-ecf063d697c6',	'restaurant',	'branch',	'7_days',	10000000.00,	'active',	NULL,	'2026-07-31',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 14:41:04',	'2026-07-31 14:41:04'),
('88a7b280-138e-45a0-a36c-817a3c1fd684',	NULL,	'Fraine',	'alajidaaokldad',	'0454265053',	NULL,	NULL,	'fraine',	NULL,	NULL,	'customers/logos/OORove1E1kh7TPKB8tC9xPwMd6WElnHYSN4gdh4b.jpg',	'92e77b2d-5cad-4c3e-bab7-7072a4ec7c4b',	'supermarket',	'file_opener',	'7_days',	10000000.00,	'active',	NULL,	'2026-07-31',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 17:01:20',	'2026-08-01 08:06:32'),
('95066b62-0db4-4d26-9bdb-7ef01ee320a6',	NULL,	'Standard Supermarket',	'standard',	'140541505404',	NULL,	NULL,	'standard',	NULL,	NULL,	'customers/logos/FtW7QejLT4947N9NRnLwl51eIrCMZKHw2uvD8HnQ.jpg',	'b761bf8c-dc83-4e0a-a24c-a83757b888f2',	'supermarket',	'file_opener',	'7_days',	10000000.00,	'active',	NULL,	'2026-08-01',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:24:05',	'2026-08-01 08:06:50'),
('9aa1e184-d1cd-49dc-bbda-a1702ca46ea0',	'95066b62-0db4-4d26-9bdb-7ef01ee320a6',	'Standard Downtown',	'standard',	'0167868875',	NULL,	NULL,	'standard downtown',	0.31104170,	32.57733480,	NULL,	'4cbb4d2b-d387-4e92-a4da-7c4913db080a',	'supermarket',	'branch',	'7_days',	10000000.00,	'active',	NULL,	'2026-08-01',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:25:04',	'2026-08-01 07:42:46'),
('dc6bc19a-fa94-4b54-8594-66eae8c2b21b',	NULL,	'Ugaroll',	'Contact',	'07154263256',	NULL,	NULL,	'Ugaroll',	NULL,	NULL,	'customers/logos/5jJAFNlwo4IXT1n1pibUcQMkRAQ9WikQX3lTa3RR.png',	'abdefd6e-5b2f-4ba2-9fdd-ad8608cc07eb',	'restaurant',	'file_opener',	'7_days',	10000000.00,	'active',	NULL,	'2026-07-31',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 14:39:36',	'2026-08-01 08:07:35');

DROP TABLE IF EXISTS `daily_store_snapshots`;
CREATE TABLE `daily_store_snapshots` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `snapshot_date` date NOT NULL,
  `store_type` enum('production','sales') COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `production_store_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sales_store_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `received_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `transferred_out_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `transferred_in_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `dispatched_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `returns_in_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `wastage_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `closing_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `generated_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_store_snapshots_product_id_foreign` (`product_id`),
  KEY `daily_store_snapshots_generated_by_foreign` (`generated_by`),
  KEY `daily_store_snapshots_production_store_id_foreign` (`production_store_id`),
  KEY `daily_store_snapshots_sales_store_id_foreign` (`sales_store_id`),
  CONSTRAINT `daily_store_snapshots_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`),
  CONSTRAINT `daily_store_snapshots_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `daily_store_snapshots_production_store_id_foreign` FOREIGN KEY (`production_store_id`) REFERENCES `production_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_store_snapshots_sales_store_id_foreign` FOREIGN KEY (`sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `deliveries`;
CREATE TABLE `deliveries` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispatched_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `status` enum('assigned','in_transit','delivered','undone') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'assigned',
  `delay_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `custom_delay_reason` text COLLATE utf8mb4_unicode_ci,
  `is_penalized` tinyint(1) NOT NULL DEFAULT '0',
  `delivery_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `location_history` json DEFAULT NULL,
  `distance_traveled` decimal(8,2) NOT NULL DEFAULT '0.00',
  `fuel_consumed` decimal(8,2) NOT NULL DEFAULT '0.00',
  `duration_seconds` int NOT NULL DEFAULT '0',
  `undone_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `undone_at` timestamp NULL DEFAULT NULL,
  `undone_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_sales_store_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `deliveries_assigned_by_foreign` (`assigned_by`),
  KEY `deliveries_status_index` (`status`),
  KEY `deliveries_dispatched_at_index` (`dispatched_at`),
  KEY `deliveries_delivered_at_index` (`delivered_at`),
  KEY `deliveries_order_id_foreign` (`order_id`),
  KEY `deliveries_undone_by_foreign` (`undone_by`),
  KEY `deliveries_return_sales_store_id_foreign` (`return_sales_store_id`),
  KEY `idx_deliveries_driver_status` (`driver_id`,`status`),
  CONSTRAINT `deliveries_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`),
  CONSTRAINT `deliveries_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `deliveries_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `deliveries_return_sales_store_id_foreign` FOREIGN KEY (`return_sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `deliveries_undone_by_foreign` FOREIGN KEY (`undone_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `deliveries` (`id`, `order_id`, `driver_id`, `assigned_by`, `dispatched_at`, `delivered_at`, `status`, `delay_reason`, `custom_delay_reason`, `is_penalized`, `delivery_notes`, `created_at`, `updated_at`, `current_latitude`, `current_longitude`, `location_history`, `distance_traveled`, `fuel_consumed`, `duration_seconds`, `undone_reason`, `undone_at`, `undone_by`, `return_sales_store_id`) VALUES
('3a9af18e-d72d-4a48-b6fd-77b4cc504b24',	'bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	NULL,	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:45:41',	'2026-07-31 16:53:51',	'delivered',	NULL,	NULL,	0,	'{\"recipient_name\":\"Daudi\",\"recipient_phone\":\"0784964646\",\"emergency_driver\":\"Duudi\",\"emergency_phone\":\"0576764646\",\"pass_number\":\"PASS-20260731-0001\",\"notes\":null}',	'2026-07-31 16:45:41',	'2026-07-31 16:53:51',	0.16241020,	32.53312540,	'[[0.1624618, 32.5331098], [0.1623507, 32.5330122], [0.1626444, 32.5329568], [0.1624102, 32.5331254]]',	0.08,	0.01,	1,	NULL,	NULL,	NULL,	NULL),
('647ec536-0ccf-4f7e-aad6-7a51149c7c92',	'cf3d35d5-c824-4d40-83b1-ad79c9f97705',	NULL,	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:57:29',	'2026-07-31 16:58:05',	'delivered',	NULL,	NULL,	0,	'{\"recipient_name\":\"Daudi\",\"recipient_phone\":\"078855633336\",\"emergency_driver\":\"Daudi\",\"emergency_phone\":\"07083590362\",\"pass_number\":\"PASS-20260731-0003\",\"notes\":null}',	'2026-07-31 16:57:29',	'2026-07-31 16:58:05',	NULL,	NULL,	NULL,	0.00,	0.00,	0,	NULL,	NULL,	NULL,	NULL),
('7153dce6-ea23-4a6d-92d8-79d6721cccb5',	'3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	'38e51642-d241-4aa8-9e27-ba3815c54317',	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-08-01 07:46:12',	'2026-08-01 07:47:18',	'delivered',	NULL,	NULL,	0,	'{\"recipient_name\":\"Contact\",\"recipient_phone\":\"0842464286\",\"notes\":\"Delivered via Driver Portal Mobile Confirmation\"}',	'2026-08-01 07:46:12',	'2026-08-01 07:47:19',	0.40888333,	32.64182135,	'[[0.40888333, 32.64182135]]',	0.00,	0.00,	23,	NULL,	NULL,	NULL,	NULL),
('84d02dd3-6fcd-4e63-a640-1ae88fde73e5',	'9c798782-bd12-4d03-8c73-b870315013b8',	NULL,	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-08-01 07:44:56',	'2026-08-01 07:45:25',	'delivered',	NULL,	NULL,	0,	'{\"recipient_name\":\"Standard\",\"recipient_phone\":\"078855633336\",\"emergency_driver\":\"Mugabi stephen\",\"emergency_phone\":\"0712345678\",\"pass_number\":\"PASS-20260801-0002\",\"notes\":null}',	'2026-08-01 07:44:56',	'2026-08-01 07:45:25',	NULL,	NULL,	NULL,	0.00,	0.00,	0,	NULL,	NULL,	NULL,	NULL),
('a6670c2c-9ffb-4ec5-a914-afbd456f560c',	'14443073-633e-4fac-a410-ddaddb79cc6c',	NULL,	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:51:44',	'2026-07-31 16:53:00',	'delivered',	NULL,	NULL,	0,	'{\"recipient_name\":\"Daudi\",\"recipient_phone\":\"073590362\",\"emergency_driver\":\"Daudi\",\"emergency_phone\":\"07083590362\",\"pass_number\":\"PASS-20260731-0002\",\"notes\":null}',	'2026-07-31 16:51:44',	'2026-07-31 16:53:00',	NULL,	NULL,	NULL,	0.00,	0.00,	0,	NULL,	NULL,	NULL,	NULL),
('e84d1345-d5c9-4438-8e70-f2e3a374dc49',	'3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'c8e6b7b6-6c44-4bf9-b3bb-fb7be1a1af2b',	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-07-31 16:57:02',	'2026-07-31 16:59:46',	'delivered',	NULL,	NULL,	0,	'{\"recipient_name\":\"Daudi\",\"recipient_phone\":\"0789042022\",\"notes\":\"Delivered via Driver Portal Mobile Confirmation\"}',	'2026-07-31 16:57:02',	'2026-07-31 16:59:48',	0.16254279,	32.53300866,	'[[0.16254279, 32.53300866]]',	0.00,	0.00,	51,	NULL,	NULL,	NULL,	NULL);

DROP TABLE IF EXISTS `delivery_pass_events`;
CREATE TABLE `delivery_pass_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `delivery_pass_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` enum('created','shared','claimed','transit_started','location_updated','arrived','delivered','completed','revoked','expired') COLLATE utf8mb4_unicode_ci NOT NULL,
  `performed_by_type` enum('user','guest_driver','system') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `performed_by_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `delivery_pass_events_delivery_pass_id_event_type_index` (`delivery_pass_id`,`event_type`),
  CONSTRAINT `delivery_pass_events_delivery_pass_id_foreign` FOREIGN KEY (`delivery_pass_id`) REFERENCES `delivery_passes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `delivery_pass_events` (`id`, `delivery_pass_id`, `event_type`, `performed_by_type`, `performed_by_id`, `metadata`, `created_at`) VALUES
(1,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	'created',	'user',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'{\"ip\": \"41.84.203.84\", \"order_ids\": [\"bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9\"], \"order_count\": 1}',	'2026-07-31 16:45:06'),
(2,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	'claimed',	'guest_driver',	'0576764646',	'{\"ip\": \"41.84.203.84\", \"driver_name\": \"Duudi\", \"driver_phone\": \"0576764646\", \"vehicle_info\": \"Emergency Boda\"}',	'2026-07-31 16:45:41'),
(3,	'fca4317b-1b27-482f-881d-0fd2afbb620e',	'created',	'user',	'4132bf95-06b4-4705-be84-c1973727e14e',	'{\"ip\": \"41.84.203.84\", \"order_ids\": [\"14443073-633e-4fac-a410-ddaddb79cc6c\"], \"order_count\": 1}',	'2026-07-31 16:50:53'),
(4,	'fca4317b-1b27-482f-881d-0fd2afbb620e',	'claimed',	'guest_driver',	'07083590362',	'{\"ip\": \"41.84.203.84\", \"driver_name\": \"Daudi\", \"driver_phone\": \"07083590362\", \"vehicle_info\": \"Emergency Boda\"}',	'2026-07-31 16:51:44'),
(5,	'fca4317b-1b27-482f-881d-0fd2afbb620e',	'completed',	'guest_driver',	'07083590362',	'{\"ip\": \"41.84.203.84\", \"recipient_name\": \"Daudi\"}',	'2026-07-31 16:53:00'),
(6,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	'completed',	'guest_driver',	'0576764646',	'{\"ip\": \"41.84.203.84\", \"recipient_name\": \"Daudi\"}',	'2026-07-31 16:53:51'),
(7,	'a83b1eaf-0606-4f38-85fd-c231359cc5e3',	'created',	'user',	'4132bf95-06b4-4705-be84-c1973727e14e',	'{\"ip\": \"41.84.203.84\", \"order_ids\": [\"cf3d35d5-c824-4d40-83b1-ad79c9f97705\"], \"order_count\": 1}',	'2026-07-31 16:57:14'),
(8,	'a83b1eaf-0606-4f38-85fd-c231359cc5e3',	'claimed',	'guest_driver',	'07083590362',	'{\"ip\": \"41.84.203.84\", \"driver_name\": \"Daudi\", \"driver_phone\": \"07083590362\", \"vehicle_info\": \"Emergency Boda\"}',	'2026-07-31 16:57:29'),
(9,	'a83b1eaf-0606-4f38-85fd-c231359cc5e3',	'completed',	'guest_driver',	'07083590362',	'{\"ip\": \"41.84.203.84\", \"recipient_name\": \"Daudi\"}',	'2026-07-31 16:58:05'),
(10,	'324fec8d-36c9-4d1f-9d44-a76abd90a24f',	'created',	'user',	'4132bf95-06b4-4705-be84-c1973727e14e',	'{\"ip\": \"41.84.203.84\", \"order_ids\": [\"9c798782-bd12-4d03-8c73-b870315013b8\", \"3279eec7-ba1f-4d29-a315-92bd4ecf77d3\"], \"order_count\": 2}',	'2026-08-01 07:43:36'),
(11,	'324fec8d-36c9-4d1f-9d44-a76abd90a24f',	'revoked',	'user',	'4132bf95-06b4-4705-be84-c1973727e14e',	'{\"ip\": \"41.84.203.84\", \"reason\": \"Revoked by Dispatch Manager\"}',	'2026-08-01 07:44:05'),
(12,	'f788391d-5ec4-4ec2-a525-e18821dcc2d7',	'created',	'user',	'4132bf95-06b4-4705-be84-c1973727e14e',	'{\"ip\": \"41.84.203.84\", \"order_ids\": [\"9c798782-bd12-4d03-8c73-b870315013b8\"], \"order_count\": 1}',	'2026-08-01 07:44:14'),
(13,	'f788391d-5ec4-4ec2-a525-e18821dcc2d7',	'claimed',	'guest_driver',	'0712345678',	'{\"ip\": \"41.84.203.84\", \"driver_name\": \"Mugabi stephen\", \"driver_phone\": \"0712345678\", \"vehicle_info\": \"UAT907Y\"}',	'2026-08-01 07:44:56'),
(14,	'f788391d-5ec4-4ec2-a525-e18821dcc2d7',	'completed',	'guest_driver',	'0712345678',	'{\"ip\": \"41.84.203.84\", \"recipient_name\": \"Standard\"}',	'2026-08-01 07:45:25');

DROP TABLE IF EXISTS `delivery_pass_locations`;
CREATE TABLE `delivery_pass_locations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `delivery_pass_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `accuracy` double DEFAULT NULL,
  `speed` double DEFAULT NULL,
  `heading` double DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `delivery_pass_locations_delivery_pass_id_created_at_index` (`delivery_pass_id`,`created_at`),
  CONSTRAINT `delivery_pass_locations_delivery_pass_id_foreign` FOREIGN KEY (`delivery_pass_id`) REFERENCES `delivery_passes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `delivery_pass_locations` (`id`, `delivery_pass_id`, `latitude`, `longitude`, `accuracy`, `speed`, `heading`, `created_at`) VALUES
(1,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	0.1624618,	32.5331098,	26.795999526978,	NULL,	NULL,	'2026-07-31 16:49:36'),
(2,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	0.1624312,	32.5330993,	22.483999252319,	NULL,	NULL,	'2026-07-31 16:50:43'),
(3,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	0.1623507,	32.5330122,	25.32799911499,	2.9000000953674,	322,	'2026-07-31 16:50:52'),
(4,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	0.1626444,	32.5329568,	19.309999465942,	3.0799999237061,	330,	'2026-07-31 16:50:53'),
(5,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	0.1626312,	32.5330470,	18.417999267578,	0,	NULL,	'2026-07-31 16:50:54'),
(6,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	0.1624102,	32.5331254,	15.010999679565,	0.18000000715256,	330,	'2026-07-31 16:50:57');

DROP TABLE IF EXISTS `delivery_pass_media`;
CREATE TABLE `delivery_pass_media` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_pass_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_type` enum('recipient_signature','signed_document_photo','delivery_photo','return_photo') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image/png',
  `file_size` bigint unsigned NOT NULL DEFAULT '0',
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `delivery_pass_media_delivery_pass_id_foreign` (`delivery_pass_id`),
  KEY `delivery_pass_media_order_id_foreign` (`order_id`),
  CONSTRAINT `delivery_pass_media_delivery_pass_id_foreign` FOREIGN KEY (`delivery_pass_id`) REFERENCES `delivery_passes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_pass_media_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `delivery_pass_media` (`id`, `delivery_pass_id`, `order_id`, `media_type`, `file_path`, `mime_type`, `file_size`, `recipient_name`, `recipient_phone`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
('1a4c7676-df31-4c04-8da5-5720b00fceb6',	'fca4317b-1b27-482f-881d-0fd2afbb620e',	NULL,	'signed_document_photo',	'delivery_proofs/documents/doc_6a6cd2ec3b6bb.jpg',	'image/jpeg',	1024,	'Daudi',	'073590362',	0.3476000,	32.5825000,	'2026-07-31 16:53:00',	'2026-07-31 16:53:00'),
('2307f8b9-b16e-43fe-94cd-60c92afa624f',	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	NULL,	'signed_document_photo',	'delivery_proofs/documents/doc_6a6cd31f228ad.jpg',	'image/jpeg',	1024,	'Daudi',	'0784964646',	0.1624537,	32.5330736,	'2026-07-31 16:53:51',	'2026-07-31 16:53:51'),
('62786177-8dd8-4b1e-9a6d-96d10f89d478',	'f788391d-5ec4-4ec2-a525-e18821dcc2d7',	NULL,	'recipient_signature',	'delivery_proofs/signatures/sig_6a6da415ce207.png',	'image/png',	1024,	'Standard',	'078855633336',	0.3476000,	32.5825000,	'2026-08-01 07:45:25',	'2026-08-01 07:45:25'),
('7c533be7-18c3-4256-b313-e1e45e9229a3',	'a83b1eaf-0606-4f38-85fd-c231359cc5e3',	NULL,	'recipient_signature',	'delivery_proofs/signatures/sig_6a6cd41debdda.png',	'image/png',	1024,	'Daudi',	'078855633336',	0.3476000,	32.5825000,	'2026-07-31 16:58:05',	'2026-07-31 16:58:05'),
('87328549-3e50-4f57-87ae-474c0cba98d2',	'fca4317b-1b27-482f-881d-0fd2afbb620e',	NULL,	'recipient_signature',	'delivery_proofs/signatures/sig_6a6cd2ec3ba60.png',	'image/png',	1024,	'Daudi',	'073590362',	0.3476000,	32.5825000,	'2026-07-31 16:53:00',	'2026-07-31 16:53:00'),
('ba645bd8-087c-485c-84fe-a2df2001e76f',	'a83b1eaf-0606-4f38-85fd-c231359cc5e3',	NULL,	'signed_document_photo',	'delivery_proofs/documents/doc_6a6cd41debce1.jpg',	'image/jpeg',	1024,	'Daudi',	'078855633336',	0.3476000,	32.5825000,	'2026-07-31 16:58:05',	'2026-07-31 16:58:05'),
('e35fea56-3dcc-4176-959d-5de243a65505',	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	NULL,	'recipient_signature',	'delivery_proofs/signatures/sig_6a6cd31f22a63.png',	'image/png',	1024,	'Daudi',	'0784964646',	0.1624537,	32.5330736,	'2026-07-31 16:53:51',	'2026-07-31 16:53:51'),
('fe4ff414-f096-45c6-ba3b-f4bac13f30ef',	'f788391d-5ec4-4ec2-a525-e18821dcc2d7',	NULL,	'signed_document_photo',	'delivery_proofs/documents/doc_6a6da415ce0b1.jpg',	'image/jpeg',	1024,	'Standard',	'078855633336',	0.3476000,	32.5825000,	'2026-08-01 07:45:25',	'2026-08-01 07:45:25');

DROP TABLE IF EXISTS `delivery_pass_orders`;
CREATE TABLE `delivery_pass_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `delivery_pass_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sequence` int unsigned NOT NULL DEFAULT '1',
  `status` enum('assigned','in_transit','delivered','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'assigned',
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_pass_orders_delivery_pass_id_order_id_unique` (`delivery_pass_id`,`order_id`),
  KEY `delivery_pass_orders_order_id_foreign` (`order_id`),
  CONSTRAINT `delivery_pass_orders_delivery_pass_id_foreign` FOREIGN KEY (`delivery_pass_id`) REFERENCES `delivery_passes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_pass_orders_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `delivery_pass_orders` (`id`, `delivery_pass_id`, `order_id`, `sequence`, `status`, `delivered_at`, `created_at`, `updated_at`) VALUES
(1,	'bba74d66-1f99-4f5d-a25b-25e43a71eb36',	'bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	1,	'delivered',	'2026-07-31 16:53:51',	'2026-07-31 16:45:06',	'2026-07-31 16:53:51'),
(2,	'fca4317b-1b27-482f-881d-0fd2afbb620e',	'14443073-633e-4fac-a410-ddaddb79cc6c',	1,	'delivered',	'2026-07-31 16:53:00',	'2026-07-31 16:50:53',	'2026-07-31 16:53:00'),
(3,	'a83b1eaf-0606-4f38-85fd-c231359cc5e3',	'cf3d35d5-c824-4d40-83b1-ad79c9f97705',	1,	'delivered',	'2026-07-31 16:58:05',	'2026-07-31 16:57:14',	'2026-07-31 16:58:05'),
(4,	'324fec8d-36c9-4d1f-9d44-a76abd90a24f',	'9c798782-bd12-4d03-8c73-b870315013b8',	1,	'assigned',	NULL,	'2026-08-01 07:43:36',	'2026-08-01 07:43:36'),
(5,	'324fec8d-36c9-4d1f-9d44-a76abd90a24f',	'3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	2,	'assigned',	NULL,	'2026-08-01 07:43:36',	'2026-08-01 07:43:36'),
(6,	'f788391d-5ec4-4ec2-a525-e18821dcc2d7',	'9c798782-bd12-4d03-8c73-b870315013b8',	1,	'delivered',	'2026-08-01 07:45:25',	'2026-08-01 07:44:14',	'2026-08-01 07:45:25');

DROP TABLE IF EXISTS `delivery_passes`;
CREATE TABLE `delivery_passes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pass_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secure_token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('generated','shared','claimed','in_transit','arrived','delivered','completed','revoked','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'generated',
  `driver_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_info` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `claimed_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `revoked_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revocation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_passes_pass_number_unique` (`pass_number`),
  UNIQUE KEY `delivery_passes_secure_token_unique` (`secure_token`),
  KEY `delivery_passes_pass_number_index` (`pass_number`),
  KEY `delivery_passes_secure_token_index` (`secure_token`),
  KEY `delivery_passes_status_index` (`status`),
  KEY `delivery_passes_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `delivery_passes` (`id`, `pass_number`, `secure_token`, `status`, `driver_name`, `driver_phone`, `vehicle_info`, `claimed_at`, `started_at`, `completed_at`, `expires_at`, `revoked_at`, `revoked_by`, `revocation_reason`, `created_by`, `created_at`, `updated_at`) VALUES
('324fec8d-36c9-4d1f-9d44-a76abd90a24f',	'PASS-20260801-0001',	'SUBk7KXDhyn0Cb2jEPkSOFbxlJY8DmtBdc2vwz3zmqmtnN1IdzmnJgA07d1ycCbT',	'revoked',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2026-08-01 19:43:36',	'2026-08-01 07:44:05',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Revoked by Dispatch Manager',	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-08-01 07:43:36',	'2026-08-01 07:44:05'),
('a83b1eaf-0606-4f38-85fd-c231359cc5e3',	'PASS-20260731-0003',	'ibirRP8KYC6IcTJzoQpG35OAiL4kpaYkvuUwECopz7c7llSMXI8jGX72zGcpRk9u',	'completed',	'Daudi',	'07083590362',	'Emergency Boda',	'2026-07-31 16:57:29',	NULL,	'2026-07-31 16:58:05',	'2026-08-02 16:57:14',	NULL,	NULL,	NULL,	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-07-31 16:57:14',	'2026-07-31 16:58:05'),
('bba74d66-1f99-4f5d-a25b-25e43a71eb36',	'PASS-20260731-0001',	'uBeK06bahWj1c0UJTbC1qhK0u34tvZwJ7OlAlZNK7r4PjG3VdC6VtwQc9mSiaBoI',	'completed',	'Duudi',	'0576764646',	'Emergency Boda',	'2026-07-31 16:45:41',	NULL,	'2026-07-31 16:53:51',	'2026-07-31 22:45:06',	NULL,	NULL,	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:45:06',	'2026-07-31 16:53:51'),
('f788391d-5ec4-4ec2-a525-e18821dcc2d7',	'PASS-20260801-0002',	'uKM6oWgD7xjH6fkyo052hoOLSbZkcfymUAPuZh2VhD69FsnUCIHtpBSk8aaLQspM',	'completed',	'Mugabi stephen',	'0712345678',	'UAT907Y',	'2026-08-01 07:44:56',	NULL,	'2026-08-01 07:45:25',	'2026-08-01 19:44:14',	NULL,	NULL,	NULL,	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-08-01 07:44:14',	'2026-08-01 07:45:25'),
('fca4317b-1b27-482f-881d-0fd2afbb620e',	'PASS-20260731-0002',	'9GcPY8pOFIpOgWqrKiwLMkViMhQvl2z8yVPqUMziYEAznafbyaseEcgkNGzYdluh',	'completed',	'Daudi',	'07083590362',	'Emergency Boda',	'2026-07-31 16:51:44',	NULL,	'2026-07-31 16:53:00',	'2026-08-01 04:50:53',	NULL,	NULL,	NULL,	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-07-31 16:50:53',	'2026-07-31 16:53:00');

DROP TABLE IF EXISTS `delivery_proofs`;
CREATE TABLE `delivery_proofs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signature_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gps_latitude` decimal(10,6) DEFAULT NULL,
  `gps_longitude` decimal(10,6) DEFAULT NULL,
  `confirmed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_proofs_delivery_id_unique` (`delivery_id`),
  KEY `delivery_proofs_confirmed_by_foreign` (`confirmed_by`),
  CONSTRAINT `delivery_proofs_confirmed_by_foreign` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `delivery_proofs_delivery_id_foreign` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `delivery_proofs` (`id`, `delivery_id`, `photo_url`, `signature_path`, `gps_latitude`, `gps_longitude`, `confirmed_at`, `confirmed_by`, `created_at`, `updated_at`) VALUES
('295a5a7c-5f05-4af2-919f-4b99d4d37062',	'a6670c2c-9ffb-4ec5-a914-afbd456f560c',	'delivery_proofs/documents/doc_6a6cd2ec3b6bb.jpg',	'delivery_proofs/signatures/sig_6a6cd2ec3ba60.png',	0.347600,	32.582500,	'2026-07-31 16:53:00',	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:53:00',	'2026-07-31 16:53:00'),
('2cba234d-6d59-44f0-8a63-b3b5a743b8ca',	'3a9af18e-d72d-4a48-b6fd-77b4cc504b24',	'delivery_proofs/documents/doc_6a6cd31f228ad.jpg',	'delivery_proofs/signatures/sig_6a6cd31f22a63.png',	0.162454,	32.533074,	'2026-07-31 16:53:51',	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:53:51',	'2026-07-31 16:53:51'),
('3bec712b-3417-486e-82c5-5a5307447a67',	'84d02dd3-6fcd-4e63-a640-1ae88fde73e5',	'delivery_proofs/documents/doc_6a6da415ce0b1.jpg',	'delivery_proofs/signatures/sig_6a6da415ce207.png',	0.347600,	32.582500,	'2026-08-01 07:45:25',	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-08-01 07:45:25',	'2026-08-01 07:45:25'),
('a8820ede-2eb0-4b65-8d0b-9d3f3ba00315',	'e84d1345-d5c9-4438-8e70-f2e3a374dc49',	'delivery_proofs/documents/RxMZCNFrO8CsqrKmjFtmpDgxK4peg4Upl6S8M4ZP.jpg',	'delivery_proofs/signatures/6a6cd4841fd2d.png',	0.162543,	32.533009,	'2026-07-31 16:59:46',	'0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'2026-07-31 16:59:48',	'2026-07-31 16:59:48'),
('b81036b6-59e2-4785-a7fd-4329d0ee3cd5',	'647ec536-0ccf-4f7e-aad6-7a51149c7c92',	'delivery_proofs/documents/doc_6a6cd41debce1.jpg',	'delivery_proofs/signatures/sig_6a6cd41debdda.png',	0.347600,	32.582500,	'2026-07-31 16:58:05',	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:58:05',	'2026-07-31 16:58:05'),
('f1e1ca74-95af-4311-9668-f5c7d57522a9',	'7153dce6-ea23-4a6d-92d8-79d6721cccb5',	'delivery_proofs/documents/4lEYZORn9OYeHAHDb54o2efb0mL5x80MmKN1eWcU.jpg',	'delivery_proofs/signatures/6a6da487e216f.png',	0.408883,	32.641821,	'2026-08-01 07:47:18',	'01a92785-b414-451f-a141-ab9a2051b620',	'2026-08-01 07:47:19',	'2026-08-01 07:47:19');

DROP TABLE IF EXISTS `delivery_zones`;
CREATE TABLE `delivery_zones` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `delivery_zones` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('138fbe62-a76d-4c44-9fa0-2b68b90fc86d',	'Kira',	NULL,	1,	'2026-07-30 09:41:42',	'2026-07-30 09:41:42'),
('1e542417-230d-4040-b35d-ecf063d697c6',	'Lweza',	NULL,	1,	'2026-07-29 14:18:22',	'2026-07-29 14:18:22'),
('3d5a1142-91cf-48f1-b117-4b5c04f879e0',	'Fraine ntinda',	NULL,	1,	'2026-07-28 11:07:21',	'2026-07-28 11:07:21'),
('4cbb4d2b-d387-4e92-a4da-7c4913db080a',	'downtown',	NULL,	1,	'2026-08-01 07:25:04',	'2026-08-01 07:25:04'),
('88f6dae0-b484-4b33-9080-2293e4889cb2',	'Fraine ntinda HQ',	NULL,	1,	'2026-07-28 11:02:46',	'2026-07-28 11:02:46'),
('921c8a76-a82f-4a51-9b26-2e7fe750ff3f',	'akright',	NULL,	1,	'2026-07-29 11:47:58',	'2026-07-29 11:47:58'),
('92e77b2d-5cad-4c3e-bab7-7072a4ec7c4b',	'Fraine',	NULL,	1,	'2026-07-31 17:01:20',	'2026-07-31 17:01:20'),
('abdefd6e-5b2f-4ba2-9fdd-ad8608cc07eb',	'Ugaroll',	NULL,	1,	'2026-07-29 14:16:06',	'2026-07-29 14:16:06'),
('b761bf8c-dc83-4e0a-a24c-a83757b888f2',	'standard',	NULL,	1,	'2026-08-01 07:24:05',	'2026-08-01 07:24:05'),
('be83121c-a4a4-45d7-9c2f-7bca5b5a1c9b',	'Kisenyi',	NULL,	1,	'2026-07-30 08:47:02',	'2026-07-30 08:47:02'),
('e977244c-844e-45b1-8750-b82718c7e967',	'Kabalagala',	NULL,	1,	'2026-07-29 09:45:46',	'2026-07-29 09:45:46');

DROP TABLE IF EXISTS `driver_performance_log`;
CREATE TABLE `driver_performance_log` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivered_at` timestamp NOT NULL,
  `required_delivery_date` date NOT NULL,
  `is_on_time` tinyint(1) NOT NULL,
  `has_photo_proof` tinyint(1) NOT NULL,
  `base_points` int NOT NULL,
  `bonus_points` int NOT NULL,
  `total_points` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_performance_log_driver_id_foreign` (`driver_id`),
  KEY `driver_performance_log_delivery_id_foreign` (`delivery_id`),
  KEY `driver_performance_log_order_id_foreign` (`order_id`),
  CONSTRAINT `driver_performance_log_delivery_id_foreign` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`),
  CONSTRAINT `driver_performance_log_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `driver_performance_log_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `driver_shifts`;
CREATE TABLE `driver_shifts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shift_date` date NOT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `status` enum('active','completed','scheduled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `deliveries_count` int NOT NULL DEFAULT '0',
  `crates_delivered` int NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_shifts_driver_id_foreign` (`driver_id`),
  KEY `driver_shifts_vehicle_id_foreign` (`vehicle_id`),
  CONSTRAINT `driver_shifts_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `driver_shifts_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `driver_vehicle`;
CREATE TABLE `driver_vehicle` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `driver_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_vehicle_driver_id_foreign` (`driver_id`),
  KEY `driver_vehicle_vehicle_id_foreign` (`vehicle_id`),
  CONSTRAINT `driver_vehicle_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `driver_vehicle_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `driver_vehicle` (`id`, `driver_id`, `vehicle_id`, `created_at`, `updated_at`) VALUES
(1,	'38e51642-d241-4aa8-9e27-ba3815c54317',	'85f49057-1aba-40ba-a171-d8ef80a1dd1e',	NULL,	NULL),
(2,	'83f9a2cb-d875-4386-bc1a-476c3789180a',	'd2fac59e-59a3-4bb5-a742-90489809f579',	NULL,	NULL),
(3,	'c8e6b7b6-6c44-4bf9-b3bb-fb7be1a1af2b',	'85f49057-1aba-40ba-a171-d8ef80a1dd1e',	NULL,	NULL),
(4,	'c8e6b7b6-6c44-4bf9-b3bb-fb7be1a1af2b',	'a19f468e-dc1f-4c97-a9ce-9733ef2fa613',	NULL,	NULL),
(5,	'c8e6b7b6-6c44-4bf9-b3bb-fb7be1a1af2b',	'd2fac59e-59a3-4bb5-a742-90489809f579',	NULL,	NULL);

DROP TABLE IF EXISTS `drivers`;
CREATE TABLE `drivers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employment_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `date_joined` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `avatar_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `drivers_user_id_foreign` (`user_id`),
  KEY `drivers_vehicle_id_foreign` (`vehicle_id`),
  CONSTRAINT `drivers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `drivers_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `drivers` (`id`, `user_id`, `full_name`, `phone`, `vehicle_id`, `license_number`, `employment_status`, `date_joined`, `notes`, `avatar_path`, `license_path`, `created_at`, `updated_at`) VALUES
('38e51642-d241-4aa8-9e27-ba3815c54317',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mugabi Stephen',	'0785218499',	'85f49057-1aba-40ba-a171-d8ef80a1dd1e',	'13786564',	'active',	'2026-07-29',	NULL,	'avatars/Vbw4PL92NgTYSkc1Hbff0TcbhsR9DaQPDDQFn7Vn.jpg',	'licenses/ECcRXHcqGY0lwO9oW4OHcyUmkjuPfyFb2LVj6m6w.jpg',	'2026-07-29 09:59:34',	'2026-08-01 07:46:12'),
('83f9a2cb-d875-4386-bc1a-476c3789180a',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Emilio Lumbuye',	'0777699438',	'd2fac59e-59a3-4bb5-a742-90489809f579',	'12345678',	'active',	'2026-07-29',	NULL,	'avatars/eoHLyed5oYu9ZmWNd4178cpzJE2UX79khRzWB7J4.jpg',	'licenses/Oth2UYuONSIwczrtwW8xYadrZGjhnzm7doKH8aaP.png',	'2026-07-29 10:29:20',	'2026-07-29 14:25:26'),
('c8e6b7b6-6c44-4bf9-b3bb-fb7be1a1af2b',	'0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'Johnson',	'982738494',	'd2fac59e-59a3-4bb5-a742-90489809f579',	'0982994',	'active',	'2026-07-30',	NULL,	'avatars/4r7XTCD7X9SmHhHmrjhibHDgRlKxUVsHJ3hrVqFY.jpg',	'licenses/nlP80cOOMOmhaaQZYmMCQh70PvAfFWw07UrW9ppu.jpg',	'2026-07-30 09:34:35',	'2026-07-31 16:57:02');

DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `failed_jobs` (`id`, `uuid`, `connection`, `queue`, `payload`, `exception`, `failed_at`) VALUES
(1,	'c057c4a7-7d27-440e-b454-4226e5496d09',	'database',	'default',	'{\"uuid\":\"c057c4a7-7d27-440e-b454-4226e5496d09\",\"displayName\":\"App\\\\Notifications\\\\TransferRequestedNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;s:36:\\\"28e21626-e4d1-445e-b630-4df6abed4646\\\";}s:9:\\\"relations\\\";a:1:{i:0;s:22:\\\"notificationPreference\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:47:\\\"App\\\\Notifications\\\\TransferRequestedNotification\\\":6:{s:10:\\\"transferId\\\";s:36:\\\"fd4609da-7142-4c58-80f6-c81b4519031f\\\";s:11:\\\"requestedBy\\\";s:16:\\\"Johnson Naamanya\\\";s:11:\\\"productName\\\";s:18:\\\"White Eggs (Trays)\\\";s:8:\\\"quantity\\\";d:35;s:16:\\\"notificationUuid\\\";s:36:\\\"da09555d-543a-4bcf-950b-c8f1c3ae498c\\\";s:2:\\\"id\\\";s:36:\\\"4b7dbe18-7ca2-4b29-bcde-2be2b76f14f4\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\",\"batchId\":null},\"createdAt\":1785513232,\"delay\":null}',	'PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php:47\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(47): PDO->prepare()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(827): Illuminate\\Database\\MySqlConnection->{closure:Illuminate\\Database\\MySqlConnection::insert():42}()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#49 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#50 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#51 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#52 {main}\n\nNext Illuminate\\Database\\QueryException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lokoorders_prod, SQL: insert into `notifications` (`id`, `type`, `data`, `read_at`, `notifiable_id`, `notifiable_type`, `updated_at`, `created_at`) values (4b7dbe18-7ca2-4b29-bcde-2be2b76f14f4, App\\Notifications\\TransferRequestedNotification, {\"id\":\"da09555d-543a-4bcf-950b-c8f1c3ae498c\",\"notification_uuid\":\"da09555d-543a-4bcf-950b-c8f1c3ae498c\",\"schema_version\":1,\"priority\":\"medium\",\"title\":\"New Store Transfer Requested\",\"body\":\"Johnson Naamanya requested a transfer of 35 Trays\\/Units of White Eggs (Trays).\",\"route_data\":{\"type\":\"pending_transfer\",\"id\":\"fd4609da-7142-4c58-80f6-c81b4519031f\",\"path\":\"\\/pending-requests?tab=transfers\"},\"expires_at\":\"2026-08-01T15:53:55+00:00\"}, ?, 28e21626-e4d1-445e-b630-4df6abed4646, App\\Models\\User, 2026-07-31 15:53:55, 2026-07-31 15:53:55)) in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php:838\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#49 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#50 {main}',	'2026-07-31 15:53:55'),
(2,	'5b597695-4ab6-4bd5-ae9c-79d676b528f9',	'database',	'default',	'{\"uuid\":\"5b597695-4ab6-4bd5-ae9c-79d676b528f9\",\"displayName\":\"App\\\\Notifications\\\\TransferRequestedNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;s:36:\\\"644edb07-006c-41eb-b16a-6487adf784e6\\\";}s:9:\\\"relations\\\";a:1:{i:0;s:22:\\\"notificationPreference\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:47:\\\"App\\\\Notifications\\\\TransferRequestedNotification\\\":6:{s:10:\\\"transferId\\\";s:36:\\\"fd4609da-7142-4c58-80f6-c81b4519031f\\\";s:11:\\\"requestedBy\\\";s:16:\\\"Johnson Naamanya\\\";s:11:\\\"productName\\\";s:18:\\\"White Eggs (Trays)\\\";s:8:\\\"quantity\\\";d:35;s:16:\\\"notificationUuid\\\";s:36:\\\"0841f929-942a-4e06-911c-2838381b9a21\\\";s:2:\\\"id\\\";s:36:\\\"5bf70c91-1f13-4b6f-9a36-d02b2692a035\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\",\"batchId\":null},\"createdAt\":1785513232,\"delay\":null}',	'PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php:47\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(47): PDO->prepare()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(827): Illuminate\\Database\\MySqlConnection->{closure:Illuminate\\Database\\MySqlConnection::insert():42}()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#49 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#50 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#51 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#52 {main}\n\nNext Illuminate\\Database\\QueryException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lokoorders_prod, SQL: insert into `notifications` (`id`, `type`, `data`, `read_at`, `notifiable_id`, `notifiable_type`, `updated_at`, `created_at`) values (5bf70c91-1f13-4b6f-9a36-d02b2692a035, App\\Notifications\\TransferRequestedNotification, {\"id\":\"0841f929-942a-4e06-911c-2838381b9a21\",\"notification_uuid\":\"0841f929-942a-4e06-911c-2838381b9a21\",\"schema_version\":1,\"priority\":\"medium\",\"title\":\"New Store Transfer Requested\",\"body\":\"Johnson Naamanya requested a transfer of 35 Trays\\/Units of White Eggs (Trays).\",\"route_data\":{\"type\":\"pending_transfer\",\"id\":\"fd4609da-7142-4c58-80f6-c81b4519031f\",\"path\":\"\\/pending-requests?tab=transfers\"},\"expires_at\":\"2026-08-01T15:53:55+00:00\"}, ?, 644edb07-006c-41eb-b16a-6487adf784e6, App\\Models\\User, 2026-07-31 15:53:55, 2026-07-31 15:53:55)) in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php:838\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#49 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#50 {main}',	'2026-07-31 15:53:55'),
(3,	'beb7a357-e165-4a2e-8d8f-b62eb8ec45b4',	'database',	'default',	'{\"uuid\":\"beb7a357-e165-4a2e-8d8f-b62eb8ec45b4\",\"displayName\":\"App\\\\Notifications\\\\TransferRequestedNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;s:36:\\\"28e21626-e4d1-445e-b630-4df6abed4646\\\";}s:9:\\\"relations\\\";a:1:{i:0;s:22:\\\"notificationPreference\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:47:\\\"App\\\\Notifications\\\\TransferRequestedNotification\\\":6:{s:10:\\\"transferId\\\";s:36:\\\"6d666933-d3f0-4372-9928-c65426a76d65\\\";s:11:\\\"requestedBy\\\";s:16:\\\"Johnson Naamanya\\\";s:11:\\\"productName\\\";s:18:\\\"Brown Eggs (Trays)\\\";s:8:\\\"quantity\\\";d:55;s:16:\\\"notificationUuid\\\";s:36:\\\"cf9cbb48-9965-4c76-ade0-7752f2ea0445\\\";s:2:\\\"id\\\";s:36:\\\"1d0244e6-74fd-4c98-8d34-7759cb647658\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\",\"batchId\":null},\"createdAt\":1785513892,\"delay\":null}',	'PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php:47\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(47): PDO->prepare()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(827): Illuminate\\Database\\MySqlConnection->{closure:Illuminate\\Database\\MySqlConnection::insert():42}()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#49 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#50 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#51 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#52 {main}\n\nNext Illuminate\\Database\\QueryException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lokoorders_prod, SQL: insert into `notifications` (`id`, `type`, `data`, `read_at`, `notifiable_id`, `notifiable_type`, `updated_at`, `created_at`) values (1d0244e6-74fd-4c98-8d34-7759cb647658, App\\Notifications\\TransferRequestedNotification, {\"id\":\"cf9cbb48-9965-4c76-ade0-7752f2ea0445\",\"notification_uuid\":\"cf9cbb48-9965-4c76-ade0-7752f2ea0445\",\"schema_version\":1,\"priority\":\"medium\",\"title\":\"New Store Transfer Requested\",\"body\":\"Johnson Naamanya requested a transfer of 55 Trays\\/Units of Brown Eggs (Trays).\",\"route_data\":{\"type\":\"pending_transfer\",\"id\":\"6d666933-d3f0-4372-9928-c65426a76d65\",\"path\":\"\\/pending-requests?tab=transfers\"},\"expires_at\":\"2026-08-01T16:04:52+00:00\"}, ?, 28e21626-e4d1-445e-b630-4df6abed4646, App\\Models\\User, 2026-07-31 16:04:52, 2026-07-31 16:04:52)) in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php:838\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#49 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#50 {main}',	'2026-07-31 16:04:52'),
(4,	'57eb60d5-5f43-4c9b-8166-fe4656cd4750',	'database',	'default',	'{\"uuid\":\"57eb60d5-5f43-4c9b-8166-fe4656cd4750\",\"displayName\":\"App\\\\Notifications\\\\TransferRequestedNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;s:36:\\\"644edb07-006c-41eb-b16a-6487adf784e6\\\";}s:9:\\\"relations\\\";a:1:{i:0;s:22:\\\"notificationPreference\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:47:\\\"App\\\\Notifications\\\\TransferRequestedNotification\\\":6:{s:10:\\\"transferId\\\";s:36:\\\"6d666933-d3f0-4372-9928-c65426a76d65\\\";s:11:\\\"requestedBy\\\";s:16:\\\"Johnson Naamanya\\\";s:11:\\\"productName\\\";s:18:\\\"Brown Eggs (Trays)\\\";s:8:\\\"quantity\\\";d:55;s:16:\\\"notificationUuid\\\";s:36:\\\"61c9ee1a-72fc-47c3-b828-0ca0e8357f11\\\";s:2:\\\"id\\\";s:36:\\\"9f8fe6d7-b36e-4c23-aba4-88fd9ce0dc6b\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\",\"batchId\":null},\"createdAt\":1785513892,\"delay\":null}',	'PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php:47\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(47): PDO->prepare()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(827): Illuminate\\Database\\MySqlConnection->{closure:Illuminate\\Database\\MySqlConnection::insert():42}()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#49 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#50 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#51 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#52 {main}\n\nNext Illuminate\\Database\\QueryException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lokoorders_prod, SQL: insert into `notifications` (`id`, `type`, `data`, `read_at`, `notifiable_id`, `notifiable_type`, `updated_at`, `created_at`) values (9f8fe6d7-b36e-4c23-aba4-88fd9ce0dc6b, App\\Notifications\\TransferRequestedNotification, {\"id\":\"61c9ee1a-72fc-47c3-b828-0ca0e8357f11\",\"notification_uuid\":\"61c9ee1a-72fc-47c3-b828-0ca0e8357f11\",\"schema_version\":1,\"priority\":\"medium\",\"title\":\"New Store Transfer Requested\",\"body\":\"Johnson Naamanya requested a transfer of 55 Trays\\/Units of Brown Eggs (Trays).\",\"route_data\":{\"type\":\"pending_transfer\",\"id\":\"6d666933-d3f0-4372-9928-c65426a76d65\",\"path\":\"\\/pending-requests?tab=transfers\"},\"expires_at\":\"2026-08-01T16:04:52+00:00\"}, ?, 644edb07-006c-41eb-b16a-6487adf784e6, App\\Models\\User, 2026-07-31 16:04:52, 2026-07-31 16:04:52)) in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php:838\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#49 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#50 {main}',	'2026-07-31 16:04:52'),
(5,	'4243c176-a6ae-4d3c-8eee-2c0ab536a616',	'database',	'default',	'{\"uuid\":\"4243c176-a6ae-4d3c-8eee-2c0ab536a616\",\"displayName\":\"App\\\\Notifications\\\\TransferRequestedNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;s:36:\\\"28e21626-e4d1-445e-b630-4df6abed4646\\\";}s:9:\\\"relations\\\";a:1:{i:0;s:22:\\\"notificationPreference\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:47:\\\"App\\\\Notifications\\\\TransferRequestedNotification\\\":6:{s:10:\\\"transferId\\\";s:36:\\\"00566259-cf18-4deb-8574-a12fe78d2597\\\";s:11:\\\"requestedBy\\\";s:16:\\\"Johnson Naamanya\\\";s:11:\\\"productName\\\";s:18:\\\"Cream Eggs (Trays)\\\";s:8:\\\"quantity\\\";d:11;s:16:\\\"notificationUuid\\\";s:36:\\\"4b54fd79-f463-4cc5-859f-0be3d6708b14\\\";s:2:\\\"id\\\";s:36:\\\"2e80235a-70e9-4131-b1ef-c41e85cf5fe5\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\",\"batchId\":null},\"createdAt\":1785514013,\"delay\":null}',	'PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php:47\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(47): PDO->prepare()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(827): Illuminate\\Database\\MySqlConnection->{closure:Illuminate\\Database\\MySqlConnection::insert():42}()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#49 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#50 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#51 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#52 {main}\n\nNext Illuminate\\Database\\QueryException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lokoorders_prod, SQL: insert into `notifications` (`id`, `type`, `data`, `read_at`, `notifiable_id`, `notifiable_type`, `updated_at`, `created_at`) values (2e80235a-70e9-4131-b1ef-c41e85cf5fe5, App\\Notifications\\TransferRequestedNotification, {\"id\":\"4b54fd79-f463-4cc5-859f-0be3d6708b14\",\"notification_uuid\":\"4b54fd79-f463-4cc5-859f-0be3d6708b14\",\"schema_version\":1,\"priority\":\"medium\",\"title\":\"New Store Transfer Requested\",\"body\":\"Johnson Naamanya requested a transfer of 11 Trays\\/Units of Cream Eggs (Trays).\",\"route_data\":{\"type\":\"pending_transfer\",\"id\":\"00566259-cf18-4deb-8574-a12fe78d2597\",\"path\":\"\\/pending-requests?tab=transfers\"},\"expires_at\":\"2026-08-01T16:06:56+00:00\"}, ?, 28e21626-e4d1-445e-b630-4df6abed4646, App\\Models\\User, 2026-07-31 16:06:56, 2026-07-31 16:06:56)) in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php:838\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#49 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#50 {main}',	'2026-07-31 16:06:56'),
(6,	'8b6ad206-2587-435e-9ad4-44a93f6bacac',	'database',	'default',	'{\"uuid\":\"8b6ad206-2587-435e-9ad4-44a93f6bacac\",\"displayName\":\"App\\\\Notifications\\\\TransferRequestedNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\",\"command\":\"O:48:\\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\\":3:{s:11:\\\"notifiables\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";a:1:{i:0;s:36:\\\"644edb07-006c-41eb-b16a-6487adf784e6\\\";}s:9:\\\"relations\\\";a:1:{i:0;s:22:\\\"notificationPreference\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:47:\\\"App\\\\Notifications\\\\TransferRequestedNotification\\\":6:{s:10:\\\"transferId\\\";s:36:\\\"00566259-cf18-4deb-8574-a12fe78d2597\\\";s:11:\\\"requestedBy\\\";s:16:\\\"Johnson Naamanya\\\";s:11:\\\"productName\\\";s:18:\\\"Cream Eggs (Trays)\\\";s:8:\\\"quantity\\\";d:11;s:16:\\\"notificationUuid\\\";s:36:\\\"67a6878f-0ef4-4f06-bbea-259e0145babe\\\";s:2:\\\"id\\\";s:36:\\\"d2b86baf-044e-4b08-93d4-b4dae0fdd641\\\";}s:8:\\\"channels\\\";a:1:{i:0;s:8:\\\"database\\\";}}\",\"batchId\":null},\"createdAt\":1785514013,\"delay\":null}',	'PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php:47\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(47): PDO->prepare()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(827): Illuminate\\Database\\MySqlConnection->{closure:Illuminate\\Database\\MySqlConnection::insert():42}()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#49 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#50 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#51 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#52 {main}\n\nNext Illuminate\\Database\\QueryException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'data\' in \'field list\' (Connection: mysql, Host: 127.0.0.1, Port: 3306, Database: lokoorders_prod, SQL: insert into `notifications` (`id`, `type`, `data`, `read_at`, `notifiable_id`, `notifiable_type`, `updated_at`, `created_at`) values (d2b86baf-044e-4b08-93d4-b4dae0fdd641, App\\Notifications\\TransferRequestedNotification, {\"id\":\"67a6878f-0ef4-4f06-bbea-259e0145babe\",\"notification_uuid\":\"67a6878f-0ef4-4f06-bbea-259e0145babe\",\"schema_version\":1,\"priority\":\"medium\",\"title\":\"New Store Transfer Requested\",\"body\":\"Johnson Naamanya requested a transfer of 11 Trays\\/Units of Cream Eggs (Trays).\",\"route_data\":{\"type\":\"pending_transfer\",\"id\":\"00566259-cf18-4deb-8574-a12fe78d2597\",\"path\":\"\\/pending-requests?tab=transfers\"},\"expires_at\":\"2026-08-01T16:06:56+00:00\"}, ?, 644edb07-006c-41eb-b16a-6487adf784e6, App\\Models\\User, 2026-07-31 16:06:56, 2026-07-31 16:06:56)) in /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php:838\nStack trace:\n#0 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php(794): Illuminate\\Database\\Connection->runQueryCallback()\n#1 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/MySqlConnection.php(42): Illuminate\\Database\\Connection->run()\n#2 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(4121): Illuminate\\Database\\MySqlConnection->insert()\n#3 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2237): Illuminate\\Database\\Query\\Builder->insert()\n#4 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1412): Illuminate\\Database\\Eloquent\\Builder->__call()\n#5 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1240): Illuminate\\Database\\Eloquent\\Model->performInsert()\n#6 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(391): Illuminate\\Database\\Eloquent\\Model->save()\n#7 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/helpers.php(393): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->{closure:Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany::create():388}()\n#8 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Relations/HasOneOrMany.php(388): tap()\n#9 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(19): Illuminate\\Database\\Eloquent\\Relations\\HasOneOrMany->create()\n#10 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(161): Illuminate\\Notifications\\Channels\\DatabaseChannel->send()\n#11 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(116): Illuminate\\Notifications\\NotificationSender->sendToNotifiable()\n#12 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->{closure:Illuminate\\Notifications\\NotificationSender::sendNow():111}()\n#13 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(111): Illuminate\\Notifications\\NotificationSender->withLocale()\n#14 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(60): Illuminate\\Notifications\\NotificationSender->sendNow()\n#15 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(118): Illuminate\\Notifications\\ChannelManager->sendNow()\n#16 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle()\n#17 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#18 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#19 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#20 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#21 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(129): Illuminate\\Container\\Container->call()\n#22 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Bus\\Dispatcher->{closure:Illuminate\\Bus\\Dispatcher::dispatchNow():126}()\n#23 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#24 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then()\n#25 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow()\n#26 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->{closure:Illuminate\\Queue\\CallQueuedHandler::dispatchThroughMiddleware():129}()\n#27 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->{closure:Illuminate\\Pipeline\\Pipeline::prepareDestination():178}()\n#28 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then()\n#29 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware()\n#30 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call()\n#31 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(493): Illuminate\\Queue\\Jobs\\Job->fire()\n#32 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(443): Illuminate\\Queue\\Worker->process()\n#33 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(208): Illuminate\\Queue\\Worker->runJob()\n#34 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon()\n#35 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker()\n#36 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#37 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::{closure:Illuminate\\Container\\BoundMethod::call():35}()\n#38 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure()\n#39 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod()\n#40 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Container/Container.php(799): Illuminate\\Container\\BoundMethod::call()\n#41 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(211): Illuminate\\Container\\Container->call()\n#42 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute()\n#43 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Console/Command.php(180): Symfony\\Component\\Console\\Command\\Command->run()\n#44 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run()\n#45 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand()\n#46 /var/www/lokoorders/loko-harvest-api/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun()\n#47 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run()\n#48 /var/www/lokoorders/loko-harvest-api/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle()\n#49 /var/www/lokoorders/loko-harvest-api/artisan(16): Illuminate\\Foundation\\Application->handleCommand()\n#50 {main}',	'2026-07-31 16:06:56');

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL,
  `efris_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('cash','efris_invoice','mobile_money','bank_transfer','credit_note','mixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('unpaid','partially_paid','paid','overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
  UNIQUE KEY `invoices_order_id_unique` (`order_id`),
  KEY `invoices_customer_id_foreign` (`customer_id`),
  KEY `invoices_created_by_foreign` (`created_by`),
  CONSTRAINT `invoices_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `invoices_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `invoices_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `invoices` (`id`, `invoice_number`, `order_id`, `customer_id`, `issue_date`, `due_date`, `subtotal`, `tax_amount`, `total_amount`, `efris_number`, `payment_method`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
('3ee87336-03f9-472a-b65a-bbfb56549f4d',	'LHI-2026-0001',	'bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'2026-07-31',	'2026-08-07',	220000.00,	0.00,	220000.00,	NULL,	'cash',	'unpaid',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:34',	'2026-07-31 16:43:34'),
('af5ff713-cea9-4bcb-a95b-ffba4d443070',	'LHI-2026-0004',	'cf3d35d5-c824-4d40-83b1-ad79c9f97705',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'2026-07-31',	'2026-08-07',	225000.00,	0.00,	225000.00,	NULL,	'cash',	'unpaid',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:59',	'2026-07-31 16:43:59'),
('c6fe32e2-cb5b-4d97-bed3-1b58d3fbfcc3',	'LHI-2026-0003',	'14443073-633e-4fac-a410-ddaddb79cc6c',	'41d30568-25de-4ed2-844f-4089e884cad2',	'2026-07-31',	'2026-08-07',	260000.00,	0.00,	260000.00,	NULL,	'cash',	'unpaid',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:55',	'2026-07-31 16:43:55'),
('cb2d517e-d553-4fd8-99ce-292ea701cd9f',	'LHI-2026-0002',	'3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'2026-07-31',	'2026-08-07',	660000.00,	0.00,	660000.00,	NULL,	'cash',	'unpaid',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:49',	'2026-07-31 16:43:49');

DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1,	'0001_01_01_000000_create_users_table',	1),
(2,	'0001_01_01_000001_create_cache_table',	1),
(3,	'0001_01_01_000002_create_jobs_table',	1),
(4,	'2026_05_16_175304_create_personal_access_tokens_table',	1),
(5,	'2026_05_16_182900_create_vehicles_table',	1),
(6,	'2026_05_16_182949_create_products_table',	1),
(7,	'2026_05_16_182951_create_delivery_zones_table',	1),
(8,	'2026_05_16_182952_create_customers_table',	1),
(9,	'2026_05_16_182953_create_customer_accounts_table',	1),
(10,	'2026_05_16_182955_create_account_transactions_table',	1),
(11,	'2026_05_16_182956_create_production_store_intakes_table',	1),
(12,	'2026_05_16_182957_create_production_store_stock_table',	1),
(13,	'2026_05_16_182959_create_store_transfers_table',	1),
(14,	'2026_05_16_183000_create_sales_store_stock_table',	1),
(15,	'2026_05_16_183001_create_sales_store_movements_table',	1),
(16,	'2026_05_16_183002_create_store_adjustments_table',	1),
(17,	'2026_05_16_183004_create_daily_store_snapshots_table',	1),
(18,	'2026_05_16_183005_create_orders_table',	1),
(19,	'2026_05_16_183007_create_order_items_table',	1),
(20,	'2026_05_16_183008_create_order_status_history_table',	1),
(21,	'2026_05_16_183010_create_drivers_table',	1),
(22,	'2026_05_16_183011_create_deliveries_table',	1),
(23,	'2026_05_16_183013_create_delivery_proofs_table',	1),
(24,	'2026_05_16_183014_create_invoices_table',	1),
(25,	'2026_05_16_183016_create_payments_table',	1),
(26,	'2026_05_16_183017_create_payment_invoice_allocations_table',	1),
(27,	'2026_05_16_183018_create_return_vouchers_table',	1),
(28,	'2026_05_16_183019_create_driver_performance_log_table',	1),
(29,	'2026_05_16_183020_create_customer_satisfaction_scores_table',	1),
(30,	'2026_05_16_183022_create_notifications_table',	1),
(31,	'2026_05_16_183024_create_sms_logs_table',	1),
(32,	'2026_05_16_183026_create_system_settings_table',	1),
(33,	'2026_05_28_094428_add_valuation_price_to_production_store_intakes_table',	1),
(34,	'2026_05_28_102500_add_batch_reference_to_production_store_stock_table',	1),
(35,	'2026_06_16_112537_create_production_stores_and_transfers_tables',	1),
(36,	'2026_06_16_115841_create_sales_stores_and_transfers_tables',	1),
(37,	'2026_06_16_152325_create_sales_store_conversions_table',	1),
(38,	'2026_06_16_190000_add_production_and_sales_prices_to_products_table',	1),
(39,	'2026_06_16_211500_add_sales_store_id_to_orders_table',	1),
(40,	'2026_06_18_102940_add_parent_id_to_customers_table',	1),
(41,	'2026_06_18_190520_create_driver_shifts_table',	1),
(42,	'2026_06_18_192343_add_images_to_drivers_and_vehicles_tables',	1),
(43,	'2026_06_18_203007_add_fuel_fields_to_vehicles_table',	1),
(44,	'2026_06_18_203524_add_tank_capacity_to_vehicles_table',	1),
(45,	'2026_06_18_220544_add_batch_reference_to_sales_store_conversions',	1),
(46,	'2026_06_19_002000_add_batch_reference_to_sales_tables',	1),
(47,	'2026_06_19_012000_convert_shoprite_and_mega_to_dynamic_parent_child',	1),
(48,	'2026_06_19_134410_add_logo_path_to_customers_table',	1),
(49,	'2026_06_20_014629_add_coordinates_to_customers_table',	1),
(50,	'2026_06_20_064500_create_vehicle_logs_table',	1),
(51,	'2026_06_21_090654_add_initial_fuel_to_vehicles_table',	1),
(52,	'2026_06_21_092018_add_evidence_path_to_vehicle_logs_table',	1),
(53,	'2026_06_21_120251_add_signature_path_to_delivery_proofs_table',	1),
(54,	'2026_06_21_133700_add_delay_reason_to_deliveries_table',	1),
(55,	'2026_06_21_174000_add_tracking_fields_to_deliveries_table',	1),
(56,	'2026_06_25_104903_update_users_status_field',	1),
(57,	'2026_06_25_160401_add_performance_indexes_to_tables',	1),
(58,	'2026_06_26_002741_add_missing_columns_to_payments_table',	1),
(59,	'2026_06_26_014000_add_signature_and_replacements_to_return_vouchers_table',	1),
(60,	'2026_06_26_020000_add_classification_to_customers_table',	1),
(61,	'2026_06_26_021000_add_performance_indexes_to_ledger_tables',	1),
(62,	'2026_06_26_112946_alter_users_role_to_string',	1),
(63,	'2026_06_28_063130_modify_deliveries_table_for_undone_deliveries',	1),
(64,	'2026_06_29_170000_add_replacement_details_to_return_vouchers_table',	1),
(65,	'2026_06_29_180000_add_fiscal_document_number_to_orders_table',	1),
(66,	'2026_06_30_180000_create_order_replacement_allocations_table',	1),
(67,	'2026_06_30_190000_add_driver_id_to_order_replacement_allocations_table',	1),
(68,	'2026_07_02_193824_add_stock_tracking_fields_to_store_stocks_tables',	1),
(69,	'2026_07_02_201500_recalculate_historical_stock_metrics',	1),
(70,	'2026_07_02_235500_add_granular_audit_fields_to_sales_stock_table',	1),
(71,	'2026_07_03_002500_reconcile_sales_stock_discrepancy',	1),
(72,	'2026_07_03_084000_add_new_white_egg_sales_products',	1),
(73,	'2026_07_03_093000_recalculate_sales_store_stock_opening_closing',	1),
(74,	'2026_07_03_102000_add_damages_to_store_stock_tables',	1),
(75,	'2026_07_03_102500_update_store_adjustments_table',	1),
(76,	'2026_07_03_130000_create_damage_and_shell_egg_products',	1),
(77,	'2026_07_03_140000_add_egg_unit_prices_to_products_table',	1),
(78,	'2026_07_03_141000_add_egg_valuation_price_to_stocks_and_intakes_tables',	1),
(79,	'2026_07_03_150000_create_driver_vehicle_table',	1),
(80,	'2026_07_08_193700_add_status_and_approvals_to_store_transfers_table',	1),
(81,	'2026_07_08_214000_add_status_and_approvals_to_sales_store_conversions_table',	1),
(82,	'2026_07_24_141533_add_performance_indexes_to_inventory_tables',	1),
(83,	'2026_07_24_224530_change_orders_status_columns_to_string',	1),
(84,	'2026_07_25_180500_create_processed_requests_table',	1),
(85,	'2026_07_26_140000_update_notifications_table_schema',	1),
(86,	'2026_07_26_141000_create_push_subscriptions_table',	1),
(87,	'2026_07_26_142000_create_user_notification_preferences_table',	1),
(88,	'2026_07_26_155200_add_phase2_composite_indexes',	1),
(89,	'2026_07_28_150000_insert_base_system_products',	2),
(90,	'2026_07_31_000001_create_delivery_passes_table',	3),
(91,	'2026_07_31_000002_create_delivery_pass_orders_table',	3),
(92,	'2026_07_31_000003_create_delivery_pass_locations_table',	3),
(93,	'2026_07_31_000004_create_delivery_pass_media_table',	3),
(94,	'2026_07_31_000005_create_delivery_pass_events_table',	3),
(95,	'2026_07_31_120000_make_driver_id_nullable_on_deliveries_table',	4);

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('new_order','ready_for_dispatch','driver_assigned','delivery_confirmed','payment_received','return_raised','low_stock','invoice_overdue') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `group_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route_data` json DEFAULT NULL,
  `schema_version` int NOT NULL DEFAULT '1',
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `reference_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_foreign` (`user_id`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `line_total` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_product_id_foreign` (`product_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `batch_reference`, `quantity`, `unit_price`, `line_total`, `created_at`, `updated_at`) VALUES
('09435c5b-1a83-42b2-937d-d6d132264ee4',	'9c798782-bd12-4d03-8c73-b870315013b8',	'241b255c-6b2c-4c62-8276-96994f3b59c6',	'KIB001A',	36.00,	4000.00,	144000.00,	'2026-08-01 07:42:28',	'2026-08-01 07:42:28'),
('0c02e686-a661-41d7-bbf5-c192e9a8c7c2',	'9c798782-bd12-4d03-8c73-b870315013b8',	'dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'KIB001A',	50.00,	10500.00,	525000.00,	'2026-08-01 07:42:28',	'2026-08-01 07:42:28'),
('1f8ce578-3e17-4003-a81c-4a6ebbc72439',	'9c798782-bd12-4d03-8c73-b870315013b8',	'31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'KIB001A',	15.00,	15000.00,	225000.00,	'2026-08-01 07:42:28',	'2026-08-01 07:42:28'),
('2ea8065b-e4bb-410e-a81a-d853f456f307',	'3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	'dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'KIB001A',	30.00,	10500.00,	315000.00,	'2026-08-01 07:41:25',	'2026-08-01 07:41:25'),
('41a4813d-45a3-4ebb-ac13-1c91750ff3f6',	'3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	'241b255c-6b2c-4c62-8276-96994f3b59c6',	'KIB001A',	20.00,	4000.00,	80000.00,	'2026-08-01 07:41:25',	'2026-08-01 07:41:25'),
('541f5610-628c-44b8-a62c-76649377ce8d',	'3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'3f6e8a7f-a244-4e24-ae1e-c34c2dc91309',	'B001A',	55.00,	12000.00,	660000.00,	'2026-07-31 16:15:48',	'2026-07-31 16:15:48'),
('57b7446b-e2de-4a42-85ab-3aaad16b59c6',	'bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'B002A',	11.00,	20000.00,	220000.00,	'2026-07-31 16:42:26',	'2026-07-31 16:42:26'),
('b8284125-f533-4764-b785-3de3e06a7f4c',	'cf3d35d5-c824-4d40-83b1-ad79c9f97705',	'1cbec570-dabc-4070-90d7-ab17cba61d6a',	'B003A',	15.00,	15000.00,	225000.00,	'2026-07-31 15:58:58',	'2026-07-31 15:58:58'),
('ba023375-5132-40ea-83b9-bc472ce46f4f',	'14443073-633e-4fac-a410-ddaddb79cc6c',	'1cbec570-dabc-4070-90d7-ab17cba61d6a',	'B003A',	20.00,	13000.00,	260000.00,	'2026-07-31 15:59:21',	'2026-07-31 15:59:21'),
('fcf444ec-f22c-4237-b5b4-b909a7327f06',	'3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	'31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'KIB001A',	20.00,	15000.00,	300000.00,	'2026-08-01 07:41:25',	'2026-08-01 07:41:25');

DROP TABLE IF EXISTS `order_replacement_allocations`;
CREATE TABLE `order_replacement_allocations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sales_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allocated_quantity` decimal(10,2) NOT NULL,
  `delivered_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `returned_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('allocated','delivered','returned','partially_returned') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'allocated',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_replacement_allocations_order_id_foreign` (`order_id`),
  KEY `order_replacement_allocations_product_id_foreign` (`product_id`),
  KEY `order_replacement_allocations_sales_store_id_foreign` (`sales_store_id`),
  KEY `order_replacement_allocations_created_by_foreign` (`created_by`),
  KEY `order_replacement_allocations_driver_id_foreign` (`driver_id`),
  CONSTRAINT `order_replacement_allocations_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_replacement_allocations_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_replacement_allocations_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_replacement_allocations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_replacement_allocations_sales_store_id_foreign` FOREIGN KEY (`sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `order_status_history`;
CREATE TABLE `order_status_history` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_status_history_order_id_foreign` (`order_id`),
  KEY `order_status_history_changed_by_foreign` (`changed_by`),
  CONSTRAINT `order_status_history_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `order_status_history_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `changed_by`, `changed_at`, `notes`, `created_at`, `updated_at`) VALUES
('0a65c03d-5e45-491f-b4e8-c956d0c281e0',	'9c798782-bd12-4d03-8c73-b870315013b8',	'delivered',	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-08-01 07:45:25',	'Emergency QR Delivery completed by Mugabi stephen. Recipient: Standard',	'2026-08-01 07:45:25',	'2026-08-01 07:45:25'),
('2ee857b1-2cad-45f9-8b57-32d67a434782',	'14443073-633e-4fac-a410-ddaddb79cc6c',	'ready_for_dispatch',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:44:31',	NULL,	'2026-07-31 16:44:31',	'2026-07-31 16:44:31'),
('32108058-2086-45ce-9c76-4039d3676812',	'cf3d35d5-c824-4d40-83b1-ad79c9f97705',	'ready_for_dispatch',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:44:25',	NULL,	'2026-07-31 16:44:25',	'2026-07-31 16:44:25'),
('33e0474d-a98f-4211-9d12-5c695dd2cdaa',	'bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	'ready_for_dispatch',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:37',	NULL,	'2026-07-31 16:43:37',	'2026-07-31 16:43:37'),
('3991d99b-c086-40da-b1e5-41475590f4ba',	'bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	'processing',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:34',	NULL,	'2026-07-31 16:43:34',	'2026-07-31 16:43:34'),
('3afb861c-5b3e-464b-b9cf-802d417d0ed3',	'cf3d35d5-c824-4d40-83b1-ad79c9f97705',	'processing',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:59',	NULL,	'2026-07-31 16:43:59',	'2026-07-31 16:43:59'),
('3df56add-9112-4b4c-9649-e5693b90852c',	'3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	'dispatched',	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-08-01 07:46:12',	'Driver assigned and dispatched',	'2026-08-01 07:46:12',	'2026-08-01 07:46:12'),
('3e9de64b-55f0-4126-8552-5501ae51e1ea',	'14443073-633e-4fac-a410-ddaddb79cc6c',	'processing',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:55',	NULL,	'2026-07-31 16:43:55',	'2026-07-31 16:43:55'),
('5f7815f4-f280-4d79-8fc6-49fb9cec74a1',	'9c798782-bd12-4d03-8c73-b870315013b8',	'ready_for_dispatch',	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-08-01 07:44:05',	'Emergency QR Pass (PASS-20260801-0001) was revoked. Reverted order status.',	'2026-08-01 07:44:05',	'2026-08-01 07:44:05'),
('6750fc5f-197c-4460-a675-695c7d3660d6',	'cf3d35d5-c824-4d40-83b1-ad79c9f97705',	'delivered',	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:58:05',	'Emergency QR Delivery completed by Daudi. Recipient: Daudi',	'2026-07-31 16:58:05',	'2026-07-31 16:58:05'),
('746132d6-4fb7-4a50-ad04-c23e877feda0',	'3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	'ready_for_dispatch',	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-08-01 07:44:05',	'Emergency QR Pass (PASS-20260801-0001) was revoked. Reverted order status.',	'2026-08-01 07:44:05',	'2026-08-01 07:44:05'),
('8709ecf6-7f31-4fd9-9b41-ca07c2bad824',	'3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	'on_route',	'01a92785-b414-451f-a141-ab9a2051b620',	'2026-08-01 07:46:41',	'Driver started delivery route.',	'2026-08-01 07:46:41',	'2026-08-01 07:46:41'),
('8fcfcf9e-b2ef-4f73-a6dd-80a3b3c69c6f',	'3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'on_route',	'0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'2026-07-31 16:58:42',	'Driver started delivery route.',	'2026-07-31 16:58:42',	'2026-07-31 16:58:42'),
('a65e144d-e445-42d1-aaf7-c33f7b7dc9b2',	'3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'ready_for_dispatch',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:44:18',	NULL,	'2026-07-31 16:44:18',	'2026-07-31 16:44:18'),
('bd597a35-9729-42f0-b366-3b44a722fc4f',	'3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'dispatched',	'4132bf95-06b4-4705-be84-c1973727e14e',	'2026-07-31 16:57:02',	'Driver assigned and dispatched',	'2026-07-31 16:57:02',	'2026-07-31 16:57:02'),
('c57a8e75-21c1-4759-9a74-fec66dd11f1f',	'14443073-633e-4fac-a410-ddaddb79cc6c',	'delivered',	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:53:00',	'Emergency QR Delivery completed by Daudi. Recipient: Daudi',	'2026-07-31 16:53:00',	'2026-07-31 16:53:00'),
('d12e7a02-21ce-4967-933d-f58ecb65cc78',	'bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	'delivered',	'28e21626-e4d1-445e-b630-4df6abed4646',	'2026-07-31 16:53:51',	'Emergency QR Delivery completed by Duudi. Recipient: Daudi',	'2026-07-31 16:53:51',	'2026-07-31 16:53:51'),
('df672f32-fb2c-4aa5-a61e-48a7320b4f04',	'3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'processing',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:49',	NULL,	'2026-07-31 16:43:49',	'2026-07-31 16:43:49');

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fiscal_document_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sales_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_date` date NOT NULL,
  `required_delivery_date` date NOT NULL,
  `urgency` enum('normal','urgent','critical') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `order_notes` text COLLATE utf8mb4_unicode_ci,
  `total_amount` decimal(15,2) NOT NULL,
  `admin_override_reason` text COLLATE utf8mb4_unicode_ci,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_unique` (`order_number`),
  KEY `orders_customer_id_foreign` (`customer_id`),
  KEY `orders_created_by_foreign` (`created_by`),
  KEY `orders_order_date_index` (`order_date`),
  KEY `orders_status_index` (`status`),
  KEY `idx_orders_status_date` (`status`,`order_date`),
  KEY `idx_orders_store_status` (`sales_store_id`,`status`),
  CONSTRAINT `orders_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `orders_sales_store_id_foreign` FOREIGN KEY (`sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `orders` (`id`, `order_number`, `fiscal_document_number`, `customer_id`, `sales_store_id`, `order_date`, `required_delivery_date`, `urgency`, `status`, `order_notes`, `total_amount`, `admin_override_reason`, `created_by`, `created_at`, `updated_at`) VALUES
('14443073-633e-4fac-a410-ddaddb79cc6c',	'LHO-2026-0002',	NULL,	'41d30568-25de-4ed2-844f-4089e884cad2',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'2026-08-02',	'normal',	'delivered',	NULL,	260000.00,	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:59:21',	'2026-07-31 16:53:00'),
('3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'LHO-2026-0003',	'inv664',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'2026-08-02',	'normal',	'delivered',	NULL,	660000.00,	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:14:13',	'2026-08-01 07:54:18'),
('3279eec7-ba1f-4d29-a315-92bd4ecf77d3',	'LHO-2026-0005',	'126333455203',	'05617e21-3521-4398-9eea-92b5bb6dfaaa',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'2026-08-03',	'normal',	'delivered',	NULL,	695000.00,	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:41:25',	'2026-08-01 07:52:19'),
('9c798782-bd12-4d03-8c73-b870315013b8',	'LHO-2026-0006',	'126343721413',	'9aa1e184-d1cd-49dc-bbda-a1702ca46ea0',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'2026-08-03',	'normal',	'delivered',	NULL,	894000.00,	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:42:28',	'2026-08-01 07:51:36'),
('bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	'LHO-2026-0004',	'inv664',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'2026-08-02',	'normal',	'delivered',	NULL,	220000.00,	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:42:26',	'2026-08-01 07:53:57'),
('cf3d35d5-c824-4d40-83b1-ad79c9f97705',	'LHO-2026-0001',	'inv664',	'15dbc4b1-dc16-41f6-863e-d3a60a28536a',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'2026-08-02',	'normal',	'delivered',	NULL,	225000.00,	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:58:58',	'2026-08-01 07:54:35');

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `payment_invoice_allocations`;
CREATE TABLE `payment_invoice_allocations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_allocated` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_invoice_allocations_payment_id_foreign` (`payment_id`),
  KEY `payment_invoice_allocations_invoice_id_foreign` (`invoice_id`),
  CONSTRAINT `payment_invoice_allocations_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_invoice_allocations_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` enum('cash','mobile_money','bank_transfer','efris_credit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_payment_number_unique` (`payment_number`),
  KEY `payments_customer_id_foreign` (`customer_id`),
  KEY `payments_received_by_foreign` (`received_by`),
  KEY `payments_payment_date_index` (`payment_date`),
  KEY `payments_created_by_foreign` (`created_by`),
  CONSTRAINT `payments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `payments_received_by_foreign` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0',	'a7b169cd3693e45b71a3a8df68097dcf2c003f8b09fc6eb785003c5fb718fc06',	'[\"*\"]',	'2026-07-26 21:49:01',	NULL,	'2026-07-26 21:45:52',	'2026-07-26 21:49:01'),
(2,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'e85ae61daea7ca4005424cb72f6f699119ad2f00d39be17a8c9bfc3d3f2d03a8',	'[\"*\"]',	'2026-07-26 21:47:18',	NULL,	'2026-07-26 21:47:08',	'2026-07-26 21:47:18'),
(3,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'a585ef04c195fc48d3286eec35934ffd9d440401f670984fb84001730e552653',	'[\"*\"]',	'2026-07-26 21:54:17',	NULL,	'2026-07-26 21:53:26',	'2026-07-26 21:54:17'),
(4,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd8c1e359d408ca60edf3c619a0f57676d10dfae6ee4c3493cfe6499c8a7cc270',	'[\"*\"]',	'2026-07-26 21:58:31',	NULL,	'2026-07-26 21:58:16',	'2026-07-26 21:58:31'),
(5,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd36f0e7dd7d4c653e677a4506dfa3cca9474efb50cf95a56c907e1364af9778b',	'[\"*\"]',	'2026-07-26 22:10:27',	NULL,	'2026-07-26 22:10:20',	'2026-07-26 22:10:27'),
(6,	'App\\Models\\User',	'd8fa00bd-a12d-43c6-8ed6-3236baf6a867',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'3991979a4edc59d28b714391e249d38daea5dd96d57be55a2d67c9788e8e050d',	'[\"*\"]',	'2026-07-26 22:11:05',	NULL,	'2026-07-26 22:10:44',	'2026-07-26 22:11:05'),
(7,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0',	'd39fb2f0fd5b1d244f646d5384f5b3661be319e839504b22777f9bfc68b39211',	'[\"*\"]',	'2026-07-26 22:18:08',	NULL,	'2026-07-26 22:15:43',	'2026-07-26 22:18:08'),
(8,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'90a3707d4b8168d69d2bf104743f3f60462eb54c298ba0766b4f381f33dec04d',	'[\"*\"]',	'2026-07-26 22:16:47',	NULL,	'2026-07-26 22:16:19',	'2026-07-26 22:16:47'),
(9,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'0bcd37cb6605dd6dd85e9bb0943ae9b6dc66fa6dd763ca26191d1b9e640e6c0b',	'[\"*\"]',	'2026-07-26 22:17:25',	NULL,	'2026-07-26 22:17:05',	'2026-07-26 22:17:25'),
(10,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'a03a5a5e56c8af8bb52e8650a14fad44bfba3d7375cd5672956bbd4de1ebfbd5',	'[\"*\"]',	'2026-07-29 08:05:03',	NULL,	'2026-07-26 22:17:33',	'2026-07-29 08:05:03'),
(11,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'ee4299a5b110d197ae150364425a204bd99619fa84aa5146f06243ae9fa689e2',	'[\"*\"]',	'2026-07-26 22:38:17',	NULL,	'2026-07-26 22:21:18',	'2026-07-26 22:38:17'),
(12,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'97dad5d0b0d3cda2fbc1bcaa5df66a534aa0edd729180f2e4640d18a3df8c984',	'[\"*\"]',	'2026-07-26 22:53:24',	NULL,	'2026-07-26 22:36:28',	'2026-07-26 22:53:24'),
(13,	'App\\Models\\User',	'd8fa00bd-a12d-43c6-8ed6-3236baf6a867',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'41688186ad4762c30c78d43a588c4d3211f59bccffd6a85221bf77eddf8a05a2',	'[\"*\"]',	'2026-07-26 22:41:50',	NULL,	'2026-07-26 22:41:45',	'2026-07-26 22:41:50'),
(14,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'4dfaf3588cf2e12fcf23eb9e132ab15b99752d5a36692afa9abcb867ecab05eb',	'[\"*\"]',	'2026-07-26 22:51:56',	NULL,	'2026-07-26 22:50:31',	'2026-07-26 22:51:56'),
(15,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'32d8db311de54692879072d80bfda1d07dfdd500df4bcfeb8238460e4e4dbd19',	'[\"*\"]',	'2026-07-26 22:54:17',	NULL,	'2026-07-26 22:52:01',	'2026-07-26 22:54:17'),
(16,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'f064e080a18391cbf6fc48f235ddf1be858129b39cce5dd087714dc8c85c1447',	'[\"*\"]',	'2026-07-26 23:02:01',	NULL,	'2026-07-26 22:54:55',	'2026-07-26 23:02:01'),
(17,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'b8d6a60e5cfeb00b69e517a0bbbb3005f5287fc2b74487fdb4bab7d95894b3dc',	'[\"*\"]',	'2026-07-26 23:05:04',	NULL,	'2026-07-26 23:02:15',	'2026-07-26 23:05:04'),
(18,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'00f4186ddcbc490b801924e4bace757815eb6954b83afccb980bdd6b988a3f80',	'[\"*\"]',	'2026-07-26 23:04:49',	NULL,	'2026-07-26 23:02:41',	'2026-07-26 23:04:49'),
(19,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'a10161c889e9e5c11b95eb63a8fd6cdae8abf5d925184f6b94250015231a597d',	'[\"*\"]',	'2026-07-26 23:11:56',	NULL,	'2026-07-26 23:10:14',	'2026-07-26 23:11:56'),
(20,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd97c1e955a26dfb539598ca6898fca65ed712b8ff8798638421069b6b67962fa',	'[\"*\"]',	'2026-07-26 23:13:48',	NULL,	'2026-07-26 23:12:59',	'2026-07-26 23:13:48'),
(21,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'95f0a2d1139d9e406ac67d34022d8a73559c0629d83a62bbeb7371b6060caabd',	'[\"*\"]',	'2026-07-26 23:14:58',	NULL,	'2026-07-26 23:13:56',	'2026-07-26 23:14:58'),
(22,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'a7d4042e4fb99a5ce631c010cac8aedb61b935bf5145afdda8b147fa7baa25a2',	'[\"*\"]',	'2026-07-26 23:21:30',	NULL,	'2026-07-26 23:21:26',	'2026-07-26 23:21:30'),
(23,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'4f299fff77442bb5b397d43a8caefecc592b1882eda2645ac605fb04c710a611',	'[\"*\"]',	'2026-07-26 23:22:47',	NULL,	'2026-07-26 23:21:42',	'2026-07-26 23:22:47'),
(24,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'7b38ab78a90e653d91ace3a893c41802be416e805ecf512afacf2318bcc7d0a8',	'[\"*\"]',	'2026-07-26 23:47:52',	NULL,	'2026-07-26 23:47:44',	'2026-07-26 23:47:52'),
(25,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'bf4a839925eb9acd853dc998bececa87e7c0df504384e7f96c723833715d758a',	'[\"*\"]',	'2026-07-27 04:31:31',	NULL,	'2026-07-27 04:30:15',	'2026-07-27 04:31:31'),
(26,	'App\\Models\\User',	'28e21626-e4d1-445e-b630-4df6abed4646',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'f6f55f8470396b39e5a247ff96460306c53912a1a0a322075abcef8b1f9dd246',	'[\"*\"]',	'2026-07-27 06:37:29',	NULL,	'2026-07-27 04:31:42',	'2026-07-27 06:37:29'),
(27,	'App\\Models\\User',	'28e21626-e4d1-445e-b630-4df6abed4646',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'ab3c1d14387de8b244bf0479facd0ef8700c70797edcc9e699c754f7ba22641a',	'[\"*\"]',	'2026-07-27 07:52:07',	NULL,	'2026-07-27 07:51:56',	'2026-07-27 07:52:07'),
(28,	'App\\Models\\User',	'28e21626-e4d1-445e-b630-4df6abed4646',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'c280cf0de2b113893acbbc58826bff413348c9826dd43b8845c9a5e11e3a96d2',	'[\"*\"]',	'2026-07-27 08:19:12',	NULL,	'2026-07-27 08:19:06',	'2026-07-27 08:19:12'),
(29,	'App\\Models\\User',	'd8fa00bd-a12d-43c6-8ed6-3236baf6a867',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'174c4968ab42586b7df035283e4f6afd4dd1eeb2a36dc60d991bb4420ed85a5a',	'[\"*\"]',	'2026-07-27 08:19:19',	NULL,	'2026-07-27 08:19:19',	'2026-07-27 08:19:19'),
(30,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'bf23f20be47276fd22f7acf95f7249c2a55471e17d352018bb0ae74b1b24c2b6',	'[\"*\"]',	'2026-07-27 08:19:42',	NULL,	'2026-07-27 08:19:32',	'2026-07-27 08:19:42'),
(31,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'533e2bf946b3a85c09613a293eda4656dbf97ce28553fc5d1546d7feedcb7493',	'[\"*\"]',	'2026-07-27 08:21:05',	NULL,	'2026-07-27 08:20:20',	'2026-07-27 08:21:05'),
(32,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'4d9f2ee4ca89efc27528cfd815ec14148bb687ba92e21447d58f6f842bca9c38',	'[\"*\"]',	'2026-07-27 09:39:27',	NULL,	'2026-07-27 09:20:48',	'2026-07-27 09:39:27'),
(33,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'30ace2f66a3f1c94e353431bb7d5cc1f3b674154608572ae44b5a0644b64d2f9',	'[\"*\"]',	'2026-07-27 09:23:41',	NULL,	'2026-07-27 09:23:40',	'2026-07-27 09:23:41'),
(34,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'f8f280ea5e51e5bdbc274b595ae4460b725f37de0c6b329ee2dec218fc119eec',	'[\"*\"]',	'2026-07-27 13:37:01',	NULL,	'2026-07-27 09:46:25',	'2026-07-27 13:37:01'),
(35,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'040993a3bdd8a304b26421ee9f2ad3237bd6a6ef7c0719d52f89035c534c3d2b',	'[\"*\"]',	'2026-07-27 12:35:32',	NULL,	'2026-07-27 12:34:01',	'2026-07-27 12:35:32'),
(36,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'fc51e8cb4a30a9312fa4d0b7a2baa6933a285b21afea82be9534055c2ba59963',	'[\"*\"]',	'2026-07-27 12:35:47',	NULL,	'2026-07-27 12:35:46',	'2026-07-27 12:35:47'),
(37,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'f198024f1ea3f298cdbae186c2de335323bac1746f955bf517738eeeffe058a6',	'[\"*\"]',	'2026-07-27 19:38:12',	NULL,	'2026-07-27 19:38:11',	'2026-07-27 19:38:12'),
(38,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'30e811b53fd20614f1568b0b9f43eaac0bf753422ddd49e2eec8d98648f957c2',	'[\"*\"]',	'2026-07-28 11:07:44',	NULL,	'2026-07-28 11:00:27',	'2026-07-28 11:07:44'),
(39,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'a41deb96fb6046d8d1d00221f9255c67a4b4f5d453e36b16840b98a2ed404e04',	'[\"*\"]',	'2026-07-29 08:07:30',	NULL,	'2026-07-29 08:05:08',	'2026-07-29 08:07:30'),
(40,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'edb0d8f432a023fd374371e090e2d3aff09af27442ba1c6ad026d1a63e6b26ff',	'[\"*\"]',	'2026-07-29 08:19:00',	NULL,	'2026-07-29 08:07:53',	'2026-07-29 08:19:00'),
(41,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'ac86c5ebede3823309fddbeff7e0f7179195ae27e9e7e16d58ca00ae366cda08',	'[\"*\"]',	'2026-07-29 08:58:36',	NULL,	'2026-07-29 08:19:16',	'2026-07-29 08:58:36'),
(42,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'364fb11e509873a21775d6ef1c0bbc1f987455971b21e1dddfffdb9b596dbe6f',	'[\"*\"]',	'2026-07-29 09:05:38',	NULL,	'2026-07-29 08:58:46',	'2026-07-29 09:05:38'),
(43,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'ba45acc87770202b9895b0050570932b388162ff9842a3802394f5893d875472',	'[\"*\"]',	NULL,	NULL,	'2026-07-29 09:04:28',	'2026-07-29 09:04:28'),
(44,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'504870ecc85f69dc3a0c808fa7d7bbdd1a6dc13d44214d11674ae724df30161c',	'[\"*\"]',	NULL,	NULL,	'2026-07-29 09:05:38',	'2026-07-29 09:05:38'),
(45,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'f1ca789c72428a64740f903779a318854dbdc9f33dbfd8104d9ad7b2b39329e1',	'[\"*\"]',	'2026-07-29 11:44:32',	NULL,	'2026-07-29 09:08:28',	'2026-07-29 11:44:32'),
(46,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'5f9b56d670f796c633e95e922b884f29d0e98b63b3f66a9c87532311b4b2b838',	'[\"*\"]',	'2026-07-29 10:43:46',	NULL,	'2026-07-29 09:49:07',	'2026-07-29 10:43:46'),
(47,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'5df52d984ded538fb329800f9e789ff648786616850fcb17b8c932c38a810b9f',	'[\"*\"]',	'2026-07-29 10:01:39',	NULL,	'2026-07-29 10:01:02',	'2026-07-29 10:01:39'),
(48,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'e347f8e1530b4c6989584602d415a27e53d378958c6fac272bda8b7d23403537',	'[\"*\"]',	'2026-07-29 10:07:24',	NULL,	'2026-07-29 10:02:52',	'2026-07-29 10:07:24'),
(49,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'0ac5cd9bd90c4f1b3b6fef804d9ffe94132f1d3658c10c64061b88295d2f8fe3',	'[\"*\"]',	'2026-07-29 10:08:06',	NULL,	'2026-07-29 10:08:06',	'2026-07-29 10:08:06'),
(50,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'901b66d9bee7ebb2a83bb985e402b500dfbf8c961c64ccab86afa15c5e3d117a',	'[\"*\"]',	'2026-07-29 10:30:42',	NULL,	'2026-07-29 10:30:06',	'2026-07-29 10:30:42'),
(51,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'1745357678611e184d2f12bba92c93ca5519054c9a340bb6250afbfdb59affda',	'[\"*\"]',	'2026-07-29 10:49:40',	NULL,	'2026-07-29 10:49:39',	'2026-07-29 10:49:40'),
(52,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'6830c99dd5819e62ec4f2812051e864a22a3e8929bbc1fd5575e8bcbd2ef95db',	'[\"*\"]',	'2026-07-29 10:55:14',	NULL,	'2026-07-29 10:54:00',	'2026-07-29 10:55:14'),
(53,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'ea3bc4ecc35b16b996bdf6d72aa8186fa85e695373d778255dea939afab24b43',	'[\"*\"]',	'2026-07-29 10:59:22',	NULL,	'2026-07-29 10:55:32',	'2026-07-29 10:59:22'),
(54,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'98763d24a2765c1149f720d7613ce0147893959d57e7095370802daf0de43877',	'[\"*\"]',	'2026-07-29 11:06:39',	NULL,	'2026-07-29 10:58:23',	'2026-07-29 11:06:39'),
(55,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'a2806f248c195b2788ccc9d85f5e6b6e6e6fc4f63edee8af0b390ea0ff03392d',	'[\"*\"]',	'2026-07-29 10:59:57',	NULL,	'2026-07-29 10:59:56',	'2026-07-29 10:59:57'),
(56,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'0da0500426b8f59f5f5cfbde274536735c47ce6babcb251a8fc8ee1ee4456d4b',	'[\"*\"]',	'2026-07-29 11:09:04',	NULL,	'2026-07-29 11:09:03',	'2026-07-29 11:09:04'),
(57,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'b4a8a72f12ba0bf7b02ea0802906ff6196b3a2be1be615fca0cee0b097280dd1',	'[\"*\"]',	'2026-07-29 11:27:38',	NULL,	'2026-07-29 11:17:15',	'2026-07-29 11:27:38'),
(58,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'a7150382ce056aab5e0ce94430970b716e12c1cafcfc8b6d0474580aa809649c',	'[\"*\"]',	'2026-07-29 11:24:14',	NULL,	'2026-07-29 11:24:12',	'2026-07-29 11:24:14'),
(59,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'181583667f38b24ce7e7ec9b6106cea1e6f96b79c967d6ef11276cc7e9ca22c7',	'[\"*\"]',	'2026-07-29 11:31:17',	NULL,	'2026-07-29 11:30:17',	'2026-07-29 11:31:17'),
(60,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd2261d8aee0d72032fad940ca96c305847e3e5444b8fb40d1b38daa34c2abee7',	'[\"*\"]',	NULL,	NULL,	'2026-07-29 11:36:30',	'2026-07-29 11:36:30'),
(61,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd63964c52d2568c31d43aaa2f86fabbee68f98058be7228a4c9bbc2b0e5349b1',	'[\"*\"]',	NULL,	NULL,	'2026-07-29 11:37:13',	'2026-07-29 11:37:13'),
(62,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'3e2fed69796a030ae6f9f9941c42b4d4c0c8e324e3f2666c880ccc934ac99063',	'[\"*\"]',	'2026-07-29 11:49:19',	NULL,	'2026-07-29 11:43:47',	'2026-07-29 11:49:19'),
(63,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'db22f337a00678f510e293da62c3f58451a230024dbbb5a97288d43110d56bf0',	'[\"*\"]',	'2026-07-29 11:45:20',	NULL,	'2026-07-29 11:44:54',	'2026-07-29 11:45:20'),
(64,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'9bc207c7684a5d96ad261d2a42cbbe519e63d9cc78b053429d7ed2c9a81d2002',	'[\"*\"]',	'2026-07-29 16:33:28',	NULL,	'2026-07-29 11:45:28',	'2026-07-29 16:33:28'),
(65,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'b5133dd97f583a14b5df6a475fa6bb29a24f5eaddcd32aca85f0f9e017f3b9ba',	'[\"*\"]',	'2026-07-29 11:50:21',	NULL,	'2026-07-29 11:48:56',	'2026-07-29 11:50:21'),
(66,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'85930ad28a4806fdf3083195323e0e8616a13b1fcb067434770e5f6c51b26a74',	'[\"*\"]',	'2026-07-29 12:11:54',	NULL,	'2026-07-29 11:49:24',	'2026-07-29 12:11:54'),
(67,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'9de29e48bfea6ffc2283e766861c799b372404ab93946d4c444e83c9865d2cdd',	'[\"*\"]',	'2026-07-29 12:03:04',	NULL,	'2026-07-29 11:50:24',	'2026-07-29 12:03:04'),
(68,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'b8a1368d2e5716812cdf3c2e04b33ed5d07d00247e351fcdb2bc6108b1566355',	'[\"*\"]',	'2026-07-29 12:03:35',	NULL,	'2026-07-29 12:03:09',	'2026-07-29 12:03:35'),
(69,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'e88c2b736b64dc78e460402f2631a2c1489fb7b8a9debcd37a5fdf56845cc84e',	'[\"*\"]',	'2026-07-29 12:41:23',	NULL,	'2026-07-29 12:03:45',	'2026-07-29 12:41:23'),
(70,	'App\\Models\\User',	'28e21626-e4d1-445e-b630-4df6abed4646',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'37f1d8b5ef58cf5a36abfe07a6a128537877db8d811c235db2eb6ff6cc6582d5',	'[\"*\"]',	'2026-07-29 13:41:50',	NULL,	'2026-07-29 12:47:43',	'2026-07-29 13:41:50'),
(71,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'086518ebbd0cb287c1dec9542af2aa87639cb4f33817321f72c74b7215c9a151',	'[\"*\"]',	'2026-07-29 12:57:07',	NULL,	'2026-07-29 12:51:44',	'2026-07-29 12:57:07'),
(72,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'48370e75e7580accc509f6512f6822dcf10fe7351cedcbd7fb04a734b2a9a6c6',	'[\"*\"]',	'2026-07-29 14:09:19',	NULL,	'2026-07-29 13:16:20',	'2026-07-29 14:09:19'),
(73,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'feb1ad6f5d43b634558ffbfa38db644273f15d5700e2161630f5bf33e951c9e9',	'[\"*\"]',	'2026-07-29 13:29:53',	NULL,	'2026-07-29 13:28:56',	'2026-07-29 13:29:53'),
(74,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'161f7938781101af83fe629ea11ddc92e1bfc1e2e68822ab26174cd1ddd0c98f',	'[\"*\"]',	'2026-07-29 13:32:24',	NULL,	'2026-07-29 13:30:46',	'2026-07-29 13:32:24'),
(75,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'e01307b5a79b6e2f363c1b03038c78efc25cf31302594d044e0584c9d47f94cf',	'[\"*\"]',	'2026-07-29 13:32:59',	NULL,	'2026-07-29 13:32:36',	'2026-07-29 13:32:59'),
(76,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'481753df8723e505b6e0d3fecfee39eaed686fe5fe5442ee30f91af30b29c6b2',	'[\"*\"]',	'2026-07-29 13:34:20',	NULL,	'2026-07-29 13:33:17',	'2026-07-29 13:34:20'),
(77,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'19919ce9c0478e22e18e86dc6160347465d675b7a8ac792ecaa09ccdea91850a',	'[\"*\"]',	'2026-07-29 14:10:18',	NULL,	'2026-07-29 14:09:28',	'2026-07-29 14:10:18'),
(78,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'000129b50f0756bdb28eee18c0cfa08a91df8bdaa38aee8fc2d20313186aa82d',	'[\"*\"]',	'2026-07-29 14:13:56',	NULL,	'2026-07-29 14:10:27',	'2026-07-29 14:13:56'),
(79,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'16b68f28d63702d864d56520b6bb5d6d80c85d31fa01a99ebbb947056b0a423b',	'[\"*\"]',	'2026-07-29 16:52:45',	NULL,	'2026-07-29 14:14:35',	'2026-07-29 16:52:45'),
(80,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'c884644856fcece10301f08b3d4ae702f0fc4911305851d7e2e9788f8e7ad10d',	'[\"*\"]',	'2026-07-29 14:26:47',	NULL,	'2026-07-29 14:21:30',	'2026-07-29 14:26:47'),
(81,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'5740989288c129c6966cb5448cf40a2a4114693e9115ab6d49ac0f2eb4a253d0',	'[\"*\"]',	'2026-07-29 14:27:34',	NULL,	'2026-07-29 14:27:25',	'2026-07-29 14:27:34'),
(82,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'c5c10976c7b1333ce0971cf82fea16da6c9cd5cfebdd3cb0e019bdd529204342',	'[\"*\"]',	'2026-07-29 17:19:09',	NULL,	'2026-07-29 14:27:31',	'2026-07-29 17:19:09'),
(83,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'479844d5fe5d31b593c56db72087527a8aef0d9ebec525205bff3bfd750adbdb',	'[\"*\"]',	'2026-07-29 14:43:27',	NULL,	'2026-07-29 14:43:25',	'2026-07-29 14:43:27'),
(84,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'21f4316713d500c0bb2c59d8b40316f124885bd9c310f557e5b42b4ef0c9ce3a',	'[\"*\"]',	'2026-07-29 16:27:55',	NULL,	'2026-07-29 16:27:50',	'2026-07-29 16:27:55'),
(85,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'd8fe2cd6019c80963794f584367d52c0da83c6f61b4b47bd0637d86a328d9935',	'[\"*\"]',	'2026-07-29 16:34:21',	NULL,	'2026-07-29 16:34:15',	'2026-07-29 16:34:21'),
(86,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'748e308b0e8e6541c6157e0cac6bc5c98d48aff0bbcfe00281d96702cdfccea9',	'[\"*\"]',	'2026-07-29 16:45:29',	NULL,	'2026-07-29 16:36:29',	'2026-07-29 16:45:29'),
(87,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd77f576ecf45c707b0989c66908a5f3622e09f6b383f7a1472d19d61a3e44a23',	'[\"*\"]',	'2026-07-29 16:47:48',	NULL,	'2026-07-29 16:47:47',	'2026-07-29 16:47:48'),
(88,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'408406019065b6d87a0c069b34ed949b9273ea256fa4110c68dbc8e45e08a4b2',	'[\"*\"]',	NULL,	NULL,	'2026-07-29 16:47:48',	'2026-07-29 16:47:48'),
(89,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'697d75476bfa9cd690d98a0fd0eff12c53ddb5b9695127d4e4c0dacc0407d865',	'[\"*\"]',	'2026-07-29 16:52:41',	NULL,	'2026-07-29 16:48:54',	'2026-07-29 16:52:41'),
(90,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'b95ca2fbea0facb9087233fb739c2e2d5e6ff050c8dc7d0b6f30e77737c4098c',	'[\"*\"]',	'2026-07-29 16:50:53',	NULL,	'2026-07-29 16:49:28',	'2026-07-29 16:50:53'),
(91,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'028f0a3bfe2530e131bb68216897f1769fea54229483654341a4ce545595132d',	'[\"*\"]',	'2026-07-29 17:17:46',	NULL,	'2026-07-29 16:53:14',	'2026-07-29 17:17:46'),
(92,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'17fb2d4bdb7a6d849b277c59363a2ab91d80cef47a5b662f92e8028985bb87db',	'[\"*\"]',	'2026-07-30 10:23:20',	NULL,	'2026-07-29 16:53:54',	'2026-07-30 10:23:20'),
(93,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'eae80d80608e85ce4624f98629ea62ed1db783500da41fa32bea594ad6126fb9',	'[\"*\"]',	'2026-07-29 17:38:08',	NULL,	'2026-07-29 17:17:53',	'2026-07-29 17:38:08'),
(94,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'5ca01bd1c7710ac2592ff79f766bf36e9a93b6f2ce6cbc63c72d7e4a4ffa61c0',	'[\"*\"]',	'2026-07-29 18:08:52',	NULL,	'2026-07-29 17:40:41',	'2026-07-29 18:08:52'),
(95,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd7875cad56b0c6010e88fa4ea00ddefbbf9439f5a7cb990f2c4bb6793158785d',	'[\"*\"]',	'2026-07-29 19:48:28',	NULL,	'2026-07-29 19:48:27',	'2026-07-29 19:48:28'),
(96,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'86477bbed7f5730a7b7271e1eb4d10ca4b25804ce7dacb85f5aabc0b34c5da14',	'[\"*\"]',	'2026-07-29 20:04:24',	NULL,	'2026-07-29 20:04:23',	'2026-07-29 20:04:24'),
(97,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'08667a0c7de454ff342a1fa07ecb56506e01d6ee14bf2e3320ff4974d0fab7aa',	'[\"*\"]',	'2026-07-30 06:14:02',	NULL,	'2026-07-30 06:14:01',	'2026-07-30 06:14:02'),
(98,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'0a8d401652bb57603f79c51e1891e9d50b69c46d0b885cddfc04cdaf6081638a',	'[\"*\"]',	'2026-07-30 08:10:22',	NULL,	'2026-07-30 08:10:21',	'2026-07-30 08:10:22'),
(99,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'9ed7fc441f1007ff46afc297cc0388f6aef2af6ae82b43e4eb90f88dde8878b0',	'[\"*\"]',	'2026-07-30 08:55:38',	NULL,	'2026-07-30 08:43:06',	'2026-07-30 08:55:38'),
(100,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'1a233df8a5500766d5002955f4ab9942b019f132e133024bfb93d492d59462c9',	'[\"*\"]',	'2026-07-30 09:03:34',	NULL,	'2026-07-30 08:56:33',	'2026-07-30 09:03:34'),
(101,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'8f3280b40d318923c05abf41f93c26a86780fa0326c7cb04dbc2c1027076ab2e',	'[\"*\"]',	'2026-07-30 21:09:16',	NULL,	'2026-07-30 09:00:22',	'2026-07-30 21:09:16'),
(102,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'bdd7d8f25705bc8771a6df0c3d21043ac8557c251ca55cc7f55ebff144098ec8',	'[\"*\"]',	'2026-07-30 09:34:39',	NULL,	'2026-07-30 09:03:41',	'2026-07-30 09:34:39'),
(103,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd2bfa34d9df839bc20063014dbd5bf308f5fc3e4159f7606e8cb47e87a136ddf',	'[\"*\"]',	'2026-07-30 09:25:28',	NULL,	'2026-07-30 09:25:26',	'2026-07-30 09:25:28'),
(104,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'bedc841145392923ea99cfbd24a851a794d0d6e0dd48d2a52ff516792df9dced',	'[\"*\"]',	'2026-07-30 09:28:18',	NULL,	'2026-07-30 09:28:17',	'2026-07-30 09:28:18'),
(105,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'fb97b012fd8da1635a61abaf273be5e83cd93aa845c0a0587750e2d88fbe9ce8',	'[\"*\"]',	'2026-07-30 09:29:15',	NULL,	'2026-07-30 09:29:14',	'2026-07-30 09:29:15'),
(106,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'dd9b2a12c331131ca8d277d3b1e7a3c97adab9badce71bf7a072aca9eb0be01e',	'[\"*\"]',	'2026-07-30 09:35:49',	NULL,	'2026-07-30 09:35:10',	'2026-07-30 09:35:49'),
(107,	'App\\Models\\User',	'0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'85a3161f10e7e25464d66042db93c2b19ff2fad1506f452ab0eb575523927803',	'[\"*\"]',	'2026-07-30 09:38:02',	NULL,	'2026-07-30 09:36:03',	'2026-07-30 09:38:02'),
(108,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'2cdd591f3dd7422019f1c5c64f7151fbeeab2b9a5e1fd4fd0cb4b6be1b5c3945',	'[\"*\"]',	'2026-07-30 09:55:48',	NULL,	'2026-07-30 09:38:12',	'2026-07-30 09:55:48'),
(109,	'App\\Models\\User',	'0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd3f16d3501604ce53bb5dc233d50dca350891ebff31c83c9e04689e0594b6040',	'[\"*\"]',	'2026-07-30 09:55:54',	NULL,	'2026-07-30 09:55:53',	'2026-07-30 09:55:54'),
(110,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'4ee96a942d06fb1b2915d1eaab94ae694ae7324ec7b3e3b4de13dc307c21fc23',	'[\"*\"]',	'2026-07-30 09:56:55',	NULL,	'2026-07-30 09:56:04',	'2026-07-30 09:56:55'),
(111,	'App\\Models\\User',	'0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'77617d3f3308d1fa25d8618e1a8c4eb6737ae8d5c4771f496172b6017295c938',	'[\"*\"]',	'2026-07-30 09:57:28',	NULL,	'2026-07-30 09:57:15',	'2026-07-30 09:57:28'),
(112,	'App\\Models\\User',	'0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'ac65d8cf6e23fa232b84029499e357b345f39e2d3084bc4e5e2c534a9996334d',	'[\"*\"]',	'2026-07-30 12:18:08',	NULL,	'2026-07-30 09:57:41',	'2026-07-30 12:18:08'),
(113,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'64831ffa9fcddd95354d8f5c25eee22c7da45f5b2af0ebd497f7f2cd24317023',	'[\"*\"]',	'2026-07-30 10:19:58',	NULL,	'2026-07-30 10:19:57',	'2026-07-30 10:19:58'),
(114,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'b4eba34d6318417641fb9220050bdefe5371fc4cad97a202af07efd0d23785e0',	'[\"*\"]',	'2026-07-30 16:16:42',	NULL,	'2026-07-30 10:23:32',	'2026-07-30 16:16:42'),
(115,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'82d115e73cea2d2d3d18f87cac8cefe4a5d123787cc789f7c169bbbdf2934ac8',	'[\"*\"]',	'2026-07-30 14:11:54',	NULL,	'2026-07-30 12:18:23',	'2026-07-30 14:11:54'),
(116,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'292146fbf97a9fac54821ee218c5bb9d777967924707ccfb9802d83406c452a9',	'[\"*\"]',	'2026-07-30 13:07:21',	NULL,	'2026-07-30 13:07:18',	'2026-07-30 13:07:21'),
(117,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'77bbca1334d204044b5fa5f836a94f1ce9d7fb154c8d69283e08e337c4f83e68',	'[\"*\"]',	'2026-07-30 13:08:31',	NULL,	'2026-07-30 13:08:11',	'2026-07-30 13:08:31'),
(118,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'ad2633e406f246c474cb16ded078d91dc687393830e2dcfc5e8d8829dd7a8604',	'[\"*\"]',	'2026-07-30 13:10:04',	NULL,	'2026-07-30 13:10:02',	'2026-07-30 13:10:04'),
(119,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'51c007ef2b0c0d781835ddc97e26116aa917c01e5fca7943edc3884936b77f84',	'[\"*\"]',	'2026-07-30 14:22:10',	NULL,	'2026-07-30 14:12:12',	'2026-07-30 14:22:10'),
(120,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'1c4b80c90396a8460228aa3834d424a32194225c85961a408d0c9cdae392b45c',	'[\"*\"]',	'2026-07-30 16:03:40',	NULL,	'2026-07-30 16:03:39',	'2026-07-30 16:03:40'),
(121,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'2b42a274db579e3b60f1709820a1415c2e2c9f74c3dab2062d28d32cab3f7df5',	'[\"*\"]',	'2026-07-31 06:46:51',	NULL,	'2026-07-30 16:17:23',	'2026-07-31 06:46:51'),
(122,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'389392fd27134acad02f426e98fa39a0dc277bcd14a4a50b93a9b34ae93dbf54',	'[\"*\"]',	'2026-07-30 20:05:00',	NULL,	'2026-07-30 20:04:59',	'2026-07-30 20:05:00'),
(123,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'26143f0e44183b97ae3a19a0da6647565f09f6878440a3f1268409fc13850dc2',	'[\"*\"]',	'2026-07-30 21:10:03',	NULL,	'2026-07-30 21:10:02',	'2026-07-30 21:10:03'),
(124,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'b101316c0494f5a2d39dee58a0a567d4b3e050301f7c0a6d5152ec364ac020f7',	'[\"*\"]',	'2026-07-31 06:13:21',	NULL,	'2026-07-31 06:13:20',	'2026-07-31 06:13:21'),
(125,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'd487ba8de85aac74973e3859a5f5143dbc9c83983d0a1d926cb7ed3e34baf3d0',	'[\"*\"]',	'2026-07-31 06:14:28',	NULL,	'2026-07-31 06:14:12',	'2026-07-31 06:14:28'),
(126,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'17e14e9068fa3bc7d2ef0b343dbb75f01c743bdfb64bcbf81df246f304a803cf',	'[\"*\"]',	'2026-07-31 06:15:47',	NULL,	'2026-07-31 06:15:46',	'2026-07-31 06:15:47'),
(127,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'6aef38cd4584cb159b5abae40649e057ffb76c997d2e3fc33f9b51e11ce8686f',	'[\"*\"]',	'2026-07-31 06:47:15',	NULL,	'2026-07-31 06:47:15',	'2026-07-31 06:47:15'),
(128,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'ad5c67e80bfbe04c6a3e2bc57ac1768e1310886a13eabb9a77343ba3bb4defaf',	'[\"*\"]',	'2026-07-31 06:59:14',	NULL,	'2026-07-31 06:47:20',	'2026-07-31 06:59:14'),
(129,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'ef8ad3695c8ad67c8084f078f196d33e4c46d52bdfd92f8ae1692f047da7eb26',	'[\"*\"]',	'2026-07-31 06:59:57',	NULL,	'2026-07-31 06:59:36',	'2026-07-31 06:59:57'),
(130,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'6f753ccea8dba347ea45fbb9c3702610f697b36bdaab5ca63d8cdd42de1b7982',	'[\"*\"]',	'2026-07-31 07:06:45',	NULL,	'2026-07-31 07:00:06',	'2026-07-31 07:06:45'),
(131,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'48ca6beda8c41a8c6bc6304058bd34ab0bf1c3665988dfa783ae7bbcf2ba1c56',	'[\"*\"]',	'2026-07-31 07:07:29',	NULL,	'2026-07-31 07:06:58',	'2026-07-31 07:07:29'),
(132,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'e72280f5833c404f772584298ae5114fdf9678d4d21759fd04a82f3695644ccb',	'[\"*\"]',	'2026-07-31 07:47:04',	NULL,	'2026-07-31 07:07:42',	'2026-07-31 07:47:04'),
(133,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'bd9c895b7504ae2238cd77f860514df4656628c1e8636f5326789eef67c2e970',	'[\"*\"]',	'2026-07-31 07:47:22',	NULL,	'2026-07-31 07:47:16',	'2026-07-31 07:47:22'),
(134,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'9c6dc50ef026885ade10de9d7e4984683dee3d18c8bf2e5b74f6dcc7af321178',	'[\"*\"]',	'2026-07-31 08:06:47',	NULL,	'2026-07-31 07:47:33',	'2026-07-31 08:06:47'),
(135,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'16969a464db0959e0c99eb8432005cd55cd56329cd109e091b9c273fef08d497',	'[\"*\"]',	'2026-07-31 08:11:22',	NULL,	'2026-07-31 08:08:05',	'2026-07-31 08:11:22'),
(136,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'c2d013f062f695e8d223ef6eeec97e77e980878da53907268ee511b7409f12d7',	'[\"*\"]',	'2026-07-31 08:23:24',	NULL,	'2026-07-31 08:17:17',	'2026-07-31 08:23:24'),
(137,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'e321125992f44e9baefc3b8225fa97da3a3046bd30cbeec372beab04ef6e8917',	'[\"*\"]',	'2026-07-31 08:23:29',	NULL,	'2026-07-31 08:23:29',	'2026-07-31 08:23:29'),
(138,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'5329599a880071727797413180124aa4f176105efe3c2fbc84f97df545ec49ff',	'[\"*\"]',	'2026-07-31 08:25:01',	NULL,	'2026-07-31 08:23:35',	'2026-07-31 08:25:01'),
(139,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'4fe7eaf8b638d7c567b8d3a5f3b2e2174cd2aed86041b740cda8dada639e6d1b',	'[\"*\"]',	'2026-07-31 08:25:09',	NULL,	'2026-07-31 08:25:09',	'2026-07-31 08:25:09'),
(140,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'c403bfaa6c79ab995a54eb8b5c986235bab4ce6ea4b0b9c3ecb817e7b96be1aa',	'[\"*\"]',	'2026-07-31 08:28:04',	NULL,	'2026-07-31 08:25:46',	'2026-07-31 08:28:04'),
(141,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'f2e89dbba741fe233fcba6858456819c3c60c7b17bad0d39f9788557ac69cc32',	'[\"*\"]',	'2026-07-31 08:28:13',	NULL,	'2026-07-31 08:28:12',	'2026-07-31 08:28:13'),
(142,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'87f86df7c53ac319ff04e944b5252a4a70fd44b1d640d1c0e902400b61b352b9',	'[\"*\"]',	'2026-07-31 08:43:05',	NULL,	'2026-07-31 08:29:10',	'2026-07-31 08:43:05'),
(143,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'a1fd699ebc3fc6c3145c1af7001a444694ad31ef2fd74e7e632834033e8248d3',	'[\"*\"]',	'2026-07-31 08:52:53',	NULL,	'2026-07-31 08:43:34',	'2026-07-31 08:52:53'),
(144,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'6633169961b1e32f973ac6ec2d3f4c3475605b677a779143713ba72da4abbdc0',	'[\"*\"]',	'2026-07-31 09:04:20',	NULL,	'2026-07-31 08:53:03',	'2026-07-31 09:04:20'),
(145,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'429593931c790fe44e05c80d129e95dea7ba7321b35cdd4ece7a4613668ec271',	'[\"*\"]',	'2026-07-31 09:05:43',	NULL,	'2026-07-31 09:04:40',	'2026-07-31 09:05:43'),
(146,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'b5366a96367c1d3b61dcb2cd03c1d1fb816bce521af2c0916b859938c4b543a5',	'[\"*\"]',	'2026-07-31 09:07:26',	NULL,	'2026-07-31 09:05:53',	'2026-07-31 09:07:26'),
(147,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'5f98efc4020530ebfd5f9b4cbe52594d1d576416f087e1298de2bb17b059eadd',	'[\"*\"]',	'2026-07-31 09:08:04',	NULL,	'2026-07-31 09:07:30',	'2026-07-31 09:08:04'),
(148,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'bd55ef167529ca0360cb7d0ea04f5bb31cce1213af2f6ba27b74de1f661741db',	'[\"*\"]',	'2026-07-31 09:19:21',	NULL,	'2026-07-31 09:12:39',	'2026-07-31 09:19:21'),
(149,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'7bf4af0af6e2370740a63add2917986e5aa1e885037988bcb104eacfa244d274',	'[\"*\"]',	'2026-07-31 09:34:39',	NULL,	'2026-07-31 09:19:28',	'2026-07-31 09:34:39'),
(150,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'9e15780b4261a9fabe8978a7dbc54698116e4e783a7d9f0f27149807844a960b',	'[\"*\"]',	'2026-07-31 09:59:18',	NULL,	'2026-07-31 09:34:43',	'2026-07-31 09:59:18'),
(151,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'9a113c2d144e28446ab5c20e6fbf33b87ce8587069648af98170788628bccc26',	'[\"*\"]',	'2026-07-31 10:08:40',	NULL,	'2026-07-31 09:59:25',	'2026-07-31 10:08:40'),
(152,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'15d0aaa82361bd1f1377ca8b0017dd0df63573f0371268c90b0ef9c544ec8ecb',	'[\"*\"]',	'2026-07-31 10:08:57',	NULL,	'2026-07-31 10:08:47',	'2026-07-31 10:08:57'),
(153,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'ca60df815609c53478c91930286555f804b024f8f34e0eb7e7fa07da1038c651',	'[\"*\"]',	'2026-07-31 15:25:08',	NULL,	'2026-07-31 13:18:21',	'2026-07-31 15:25:08'),
(154,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'e4334f57367194b5818e1e825e51056f4d7ada29de0bf26d79c10eb0ed432ff4',	'[\"*\"]',	'2026-07-31 14:52:05',	NULL,	'2026-07-31 14:52:04',	'2026-07-31 14:52:05'),
(155,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'94e72691c3afbbe2b782384db274c415cd018bce49800c48e6fa1ba2f07c7c66',	'[\"*\"]',	'2026-07-31 14:55:10',	NULL,	'2026-07-31 14:54:37',	'2026-07-31 14:55:10'),
(156,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'643677791438a4a53b70bcb8320a032f7d4f64f8c05e7f58482503d3a131ace5',	'[\"*\"]',	'2026-07-31 16:18:22',	NULL,	'2026-07-31 15:02:17',	'2026-07-31 16:18:22'),
(157,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'a515e64c092103da21992e472cbcd1c3560b58cb799424f515e738f6427f4869',	'[\"*\"]',	'2026-07-31 16:18:45',	NULL,	'2026-07-31 15:25:26',	'2026-07-31 16:18:45'),
(158,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'a754081656fc9567808e8447c2ab141977bc96b099afe6c5c509d5daddfc42ca',	'[\"*\"]',	'2026-07-31 16:37:47',	NULL,	'2026-07-31 16:18:54',	'2026-07-31 16:37:47'),
(159,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'cddd45c0c654c8c75c76b0f1e0c654111838f2ca0c09c0406084cdeeb8f3802c',	'[\"*\"]',	'2026-07-31 16:40:41',	NULL,	'2026-07-31 16:32:09',	'2026-07-31 16:40:41'),
(160,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'e470cefe51b55b2d2205db47036138d7b00e1171eca752a292c80345ad3b7a6f',	'[\"*\"]',	'2026-07-31 16:50:19',	NULL,	'2026-07-31 16:38:11',	'2026-07-31 16:50:19'),
(161,	'App\\Models\\User',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'37b25fa092e114cd410743dd487cdb65fab881cf8c33e8bceb9fcf4a0933fbc8',	'[\"*\"]',	'2026-07-31 16:46:13',	NULL,	'2026-07-31 16:42:55',	'2026-07-31 16:46:13'),
(162,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'01b0ab39432062ad4ac69d524c57213a5776890401e94e016638ea11cdaa1c08',	'[\"*\"]',	'2026-07-31 16:55:48',	NULL,	'2026-07-31 16:50:27',	'2026-07-31 16:55:48'),
(163,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'4e6727aaa0e209068e2722a3bc85c7e2f72f26afc1980af2727cbb9dfb97ef3a',	'[\"*\"]',	'2026-07-31 16:55:51',	NULL,	'2026-07-31 16:55:51',	'2026-07-31 16:55:51'),
(164,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'c08cf20e8938da3c8fed815738cf60101853d3c5622054c5857cd87f4e36246d',	'[\"*\"]',	'2026-07-31 16:56:35',	NULL,	'2026-07-31 16:55:56',	'2026-07-31 16:56:35'),
(165,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'010be42b200b073d5418dc76955d6876171d9306dd7423885fc9af07fca64f2e',	'[\"*\"]',	'2026-07-31 17:00:05',	NULL,	'2026-07-31 16:56:45',	'2026-07-31 17:00:05'),
(166,	'App\\Models\\User',	'0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'1c00caf5c821f626e8b418b13ad558fffa5436a927f4b32a99f1516f23f598e3',	'[\"*\"]',	'2026-07-31 16:59:53',	NULL,	'2026-07-31 16:58:38',	'2026-07-31 16:59:53'),
(167,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'6ec28dfe08046c92657e169a73c5aa299e8681175bf57ef19b2ecedda9839111',	'[\"*\"]',	'2026-08-01 07:42:52',	NULL,	'2026-07-31 17:00:21',	'2026-08-01 07:42:52'),
(168,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'9742ef6f738944536c18ebdf3215ae8a969a1200a88dc299a50e3b1fa2c13063',	'[\"*\"]',	'2026-08-01 07:47:29',	NULL,	'2026-08-01 07:43:04',	'2026-08-01 07:47:29'),
(169,	'App\\Models\\User',	'3eab292c-d7eb-4505-835d-b06def6b256d',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'f29f274a4480deeb3a5862d97769afbb7ea4efbe4fde3338bc90a9d5fe2220dd',	'[\"*\"]',	'2026-08-01 07:47:31',	NULL,	'2026-08-01 07:45:56',	'2026-08-01 07:47:31'),
(170,	'App\\Models\\User',	'01a92785-b414-451f-a141-ab9a2051b620',	'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',	'6166673bcb627291a163a57c96c54567d00195f2ab30cec3dca51fcec91f0007',	'[\"*\"]',	'2026-08-01 07:48:13',	NULL,	'2026-08-01 07:46:37',	'2026-08-01 07:48:13'),
(171,	'App\\Models\\User',	'644edb07-006c-41eb-b16a-6487adf784e6',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'84280ceadedf9ec9d4ab3660cfd5df4b770af870698c2db9afe050d4cf1a651f',	'[\"*\"]',	'2026-08-01 08:14:53',	NULL,	'2026-08-01 07:47:36',	'2026-08-01 08:14:53'),
(172,	'App\\Models\\User',	'4132bf95-06b4-4705-be84-c1973727e14e',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	'd45dc74d6b128eb37f500281e2bd57dffc01c292f841d061398663c45a6fdc42',	'[\"*\"]',	'2026-08-01 08:15:14',	NULL,	'2026-08-01 08:15:13',	'2026-08-01 08:15:14');

DROP TABLE IF EXISTS `processed_requests`;
CREATE TABLE `processed_requests` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `response_payload` json DEFAULT NULL,
  `status_code` int NOT NULL DEFAULT '200',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `processed_requests_user_id_action_type_index` (`user_id`,`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `production_store_intakes`;
CREATE TABLE `production_store_intakes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `production_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intake_date` date NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `valuation_price` decimal(15,2) DEFAULT NULL,
  `egg_valuation_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `unit_of_measure` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `received_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `production_store_intakes_product_id_foreign` (`product_id`),
  KEY `production_store_intakes_received_by_foreign` (`received_by`),
  KEY `prod_intake_lookup` (`production_store_id`,`product_id`,`intake_date`),
  KEY `prod_intake_batch` (`batch_reference`),
  CONSTRAINT `production_store_intakes_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `production_store_intakes_production_store_id_foreign` FOREIGN KEY (`production_store_id`) REFERENCES `production_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `production_store_intakes_received_by_foreign` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `production_store_intakes` (`id`, `production_store_id`, `intake_date`, `product_id`, `quantity`, `valuation_price`, `egg_valuation_price`, `unit_of_measure`, `batch_reference`, `notes`, `received_by`, `created_at`, `updated_at`) VALUES
('4301e308-856a-4bea-b1ec-1bd7313c5cbd',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	11.00,	20000.00,	700.00,	'trays',	'B002A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:13:15',	'2026-07-31 15:13:15'),
('53dfb067-594d-4a5d-ad53-b12d4cbd0f21',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'c1a4a0eb-121c-47cf-b829-38b829256623',	139.67,	13000.00,	450.00,	'trays',	'B001A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:48:28',	'2026-07-31 15:48:28'),
('55934c07-cdf3-44b6-a244-58c3f99f6b82',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'c1a4a0eb-121c-47cf-b829-38b829256623',	79.70,	13000.00,	450.00,	'trays',	'B001A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:11:16',	'2026-07-31 15:11:16'),
('5b01f651-4381-492e-863a-628e1ef21e62',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'd4f8de9c-ddd4-448b-b428-ceae297d0fb7',	0.07,	10000.00,	300.00,	'trays',	'B003A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:39:25',	'2026-07-31 15:39:25'),
('672a3e36-f585-4d89-b680-134104724ae6',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'0a41740e-7d47-4548-aa6d-ab96d1d0f2b3',	0.17,	0.00,	0.00,	'trays',	'B003A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:39:25',	'2026-07-31 15:39:25'),
('793d7b12-e8e6-4d82-9a4a-187e907c2e46',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	26.00,	15000.00,	500.00,	'trays',	'B003A',	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:40:33',	'2026-07-31 15:40:33'),
('b3ec29ea-c58c-4f71-821b-306d75d6975e',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'd3dc6cc1-7448-47fd-833c-b14337fa0653',	0.50,	10000.00,	300.00,	'trays',	'B001A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:11:16',	'2026-07-31 15:11:16'),
('d76b0af9-7aaa-4315-84cb-fc20de27e520',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	47.33,	15000.00,	500.00,	'trays',	'B003A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:39:25',	'2026-07-31 15:39:25'),
('efb7dd8e-480a-4c3e-8743-07c4ab39142c',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'd4f8de9c-ddd4-448b-b428-ceae297d0fb7',	0.33,	10000.00,	300.00,	'trays',	'B003A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:15:26',	'2026-07-31 15:15:26'),
('f72b9e7e-06f6-45d7-b324-67d86f0e5aed',	'1c93b48a-6b02-47cd-a9b9-5e9ffdc54418',	'2026-08-01',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	87.00,	15000.00,	500.00,	'trays',	'KIB001A',	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:32:18',	'2026-08-01 07:32:18'),
('f7fd57ca-476c-49c9-aff2-067b3ac38d40',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	6.20,	15000.00,	500.00,	'trays',	'B003A',	NULL,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:15:26',	'2026-07-31 15:15:26');

DROP TABLE IF EXISTS `production_store_stock`;
CREATE TABLE `production_store_stock` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `production_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_stock` decimal(15,2) NOT NULL DEFAULT '0.00',
  `stock_taken` decimal(15,2) NOT NULL DEFAULT '0.00',
  `replacements` decimal(15,2) NOT NULL DEFAULT '0.00',
  `damages` decimal(10,2) NOT NULL DEFAULT '0.00',
  `closing_stock` decimal(15,2) NOT NULL DEFAULT '0.00',
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `egg_unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `current_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valuation_price` decimal(15,2) DEFAULT NULL,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `production_store_stock_updated_by_foreign` (`updated_by`),
  KEY `production_store_stock_product_id_foreign` (`product_id`),
  KEY `prod_stock_lookup` (`production_store_id`,`product_id`,`batch_reference`),
  CONSTRAINT `production_store_stock_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `production_store_stock_production_store_id_foreign` FOREIGN KEY (`production_store_id`) REFERENCES `production_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `production_store_stock_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `production_store_stock` (`id`, `production_store_id`, `product_id`, `batch_reference`, `opening_stock`, `stock_taken`, `replacements`, `damages`, `closing_stock`, `unit_price`, `egg_unit_price`, `current_quantity`, `valuation_price`, `last_updated`, `updated_by`, `created_at`, `updated_at`) VALUES
('04b440a8-7b08-4822-b7ce-95bcec62a262',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'd3dc6cc1-7448-47fd-833c-b14337fa0653',	'B001A',	0.50,	0.00,	0.00,	0.00,	0.50,	10000.00,	300.00,	0.50,	10000.00,	'2026-07-31 15:11:16',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:11:16',	'2026-07-31 15:11:16'),
('07874bed-b6a6-49df-ac8c-1a6ff69ea204',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'c1a4a0eb-121c-47cf-b829-38b829256623',	'B001A',	219.37,	55.00,	0.00,	0.00,	164.37,	13000.00,	450.00,	164.37,	13000.00,	'2026-07-31 16:04:59',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:11:16',	'2026-07-31 16:04:59'),
('32dc7f22-ced7-4460-8310-ab99204a2b66',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'B002A',	11.00,	11.00,	0.00,	0.00,	0.00,	20000.00,	700.00,	0.00,	20000.00,	'2026-07-31 16:07:06',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:13:15',	'2026-07-31 16:07:06'),
('4783ee41-b69b-4867-b226-3b6d5504c989',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'd4f8de9c-ddd4-448b-b428-ceae297d0fb7',	'B003A',	0.40,	0.00,	0.00,	0.00,	0.40,	10000.00,	300.00,	0.40,	10000.00,	'2026-07-31 15:39:25',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:15:26',	'2026-07-31 15:39:25'),
('4f725542-43ee-42c5-8ef2-d0ebe9dd8da7',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'0a41740e-7d47-4548-aa6d-ab96d1d0f2b3',	'B003A',	0.17,	0.00,	0.00,	0.00,	0.17,	0.00,	0.00,	0.17,	0.00,	'2026-07-31 15:39:25',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:39:25',	'2026-07-31 15:39:25'),
('93a6d6e4-ef5f-41f0-b0ab-0528dc322fd2',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	79.53,	64.50,	0.00,	0.00,	15.03,	15000.00,	500.00,	15.03,	15000.00,	'2026-07-31 15:54:31',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:15:26',	'2026-07-31 15:54:31'),
('ff0f0290-8cb5-446c-940a-f0895bb5e34a',	'1c93b48a-6b02-47cd-a9b9-5e9ffdc54418',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'KIB001A',	87.00,	87.00,	0.00,	0.00,	0.00,	15000.00,	500.00,	0.00,	15000.00,	'2026-08-01 07:32:47',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:32:18',	'2026-08-01 07:32:47');

DROP TABLE IF EXISTS `production_store_transfers`;
CREATE TABLE `production_store_transfers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_date` date NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_production_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_production_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transferred_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `production_store_transfers_product_id_foreign` (`product_id`),
  KEY `production_store_transfers_to_production_store_id_foreign` (`to_production_store_id`),
  KEY `production_store_transfers_transferred_by_foreign` (`transferred_by`),
  KEY `prod_transfer_lookup` (`from_production_store_id`,`to_production_store_id`,`transfer_date`),
  KEY `prod_transfer_batch` (`batch_reference`),
  CONSTRAINT `production_store_transfers_from_production_store_id_foreign` FOREIGN KEY (`from_production_store_id`) REFERENCES `production_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `production_store_transfers_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `production_store_transfers_to_production_store_id_foreign` FOREIGN KEY (`to_production_store_id`) REFERENCES `production_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `production_store_transfers_transferred_by_foreign` FOREIGN KEY (`transferred_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `production_stores`;
CREATE TABLE `production_stores` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `production_stores_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `production_stores` (`id`, `name`, `code`, `location`, `is_active`, `created_at`, `updated_at`) VALUES
('1c93b48a-6b02-47cd-a9b9-5e9ffdc54418',	'Kibuye Storage Store',	'KIB-STS',	'Kibuye',	1,	'2026-07-29 09:37:57',	'2026-07-29 09:37:57'),
('4d48c202-129d-4626-9942-b63b2eb7c824',	'Akright Production Store',	'AKT-PS',	'Akright',	1,	'2026-07-29 09:38:43',	'2026-07-29 09:38:43'),
('7543d164-9351-4fd6-aa51-015265f205ff',	'Mubende Production Store',	'MBD-PS',	'Mubende',	1,	'2026-07-29 09:39:08',	'2026-07-29 09:39:08');

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('eggs','poultry','by_products') COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_of_measure` enum('trays','kg','units') COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_unit_price` decimal(15,2) NOT NULL,
  `production_unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `production_egg_unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `sales_unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `sales_egg_unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`id`, `name`, `code`, `category`, `unit_of_measure`, `default_unit_price`, `production_unit_price`, `production_egg_unit_price`, `sales_unit_price`, `sales_egg_unit_price`, `is_active`, `created_at`, `updated_at`) VALUES
('08de4a33-23bd-40ff-9d43-6b01ad954de1',	'Cream Eggs - Damage 3rd Class',	'EGG-CRM-D3',	'eggs',	'trays',	0.00,	7500.00,	250.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07'),
('0a41740e-7d47-4548-aa6d-ab96d1d0f2b3',	'White Eggs - Damage 3rd Class',	'EGG-WHT-D3',	'eggs',	'trays',	0.00,	7500.00,	250.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07'),
('1cbec570-dabc-4070-90d7-ab17cba61d6a',	'White Eggs - Plain Trays',	'EGG-WHT-TRYS',	'eggs',	'trays',	12000.00,	0.00,	0.00,	15000.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-31 16:41:52'),
('21038ad6-8cfe-11f1-8b3b-920009458eca',	'Cream Eggs - Plain Trays',	'EGG-CRM-TRYS',	'eggs',	'trays',	14000.00,	0.00,	0.00,	20000.00,	0.00,	1,	'2026-07-31 16:37:32',	'2026-07-31 16:41:52'),
('241b255c-6b2c-4c62-8276-96994f3b59c6',	'White Eggs - 6-Pack',	'EGG-WHT-06P',	'eggs',	'units',	3800.00,	3800.00,	0.00,	4000.00,	0.00,	1,	'2026-07-26 21:35:42',	'2026-07-31 16:41:52'),
('31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'White Eggs - Single Pack',	'EGG-WHT-SGL',	'eggs',	'trays',	15000.00,	15000.00,	500.00,	15000.00,	500.00,	1,	'2026-07-26 21:35:42',	'2026-07-26 21:35:42'),
('3f6e8a7f-a244-4e24-ae1e-c34c2dc91309',	'Brown Eggs - Plain Trays',	'EGG-BRN-TRYS',	'eggs',	'trays',	14000.00,	14000.00,	466.67,	12000.00,	466.67,	1,	'2026-07-26 21:35:42',	'2026-07-31 16:41:52'),
('434aa311-6d56-4dc3-91ab-1e4ba305d67b',	'Cream Eggs - 15-Pack',	'EGG-CRM-15P',	'eggs',	'units',	8500.00,	8500.00,	0.00,	12500.00,	0.00,	1,	'2026-07-26 21:35:42',	'2026-07-31 16:41:53'),
('486bb7ff-fc22-4a05-81c2-9bd3d4589dee',	'Brown Eggs - 15-Pack',	'EGG-BRN-15P',	'eggs',	'units',	8500.00,	8500.00,	0.00,	0.00,	0.00,	1,	'2026-07-26 21:35:42',	'2026-07-31 16:41:53'),
('4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'Cream Eggs (Trays)',	'EGG-CRM',	'eggs',	'trays',	13000.00,	20000.00,	700.00,	20000.00,	0.00,	1,	'2026-07-28 15:21:49',	'2026-07-31 16:41:51'),
('54fd5fb9-2c25-4ba7-ba24-3f818ba48de4',	'Damaged Egg Trays',	'EGG-DMG-TRYS',	'eggs',	'trays',	7000.00,	7000.00,	233.33,	7000.00,	233.33,	1,	'2026-07-26 21:35:42',	'2026-07-26 21:35:42'),
('5c5d2565-7d7c-468e-8305-ae9fcac29d97',	'White Eggs - Double Pack',	'EGG-WHT-DBL',	'eggs',	'units',	24000.00,	0.00,	0.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-26 21:35:46'),
('5ee0ba9c-aa14-4489-a586-4de0d338a080',	'Dressed Chicken (Unit)',	'POU-DRS',	'poultry',	'units',	25000.00,	20000.00,	0.00,	0.00,	0.00,	1,	'2026-07-28 15:21:49',	'2026-07-29 09:27:07'),
('5fcea32a-ebe9-46fd-b02b-ff4da8d41436',	'White Eggs - Damage 2nd Class',	'EGG-WHT-D2',	'eggs',	'trays',	3000.00,	10000.00,	300.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07'),
('6402c8c2-9d22-484b-a8d3-ebd8af8117cc',	'Loose Damaged Eggs',	'EGG-DMG-LOOSE',	'eggs',	'units',	300.00,	300.00,	0.00,	300.00,	0.00,	1,	'2026-07-26 21:35:42',	'2026-07-26 21:35:42'),
('8640a61b-e555-4368-891c-36d4830ecc10',	'Cream Eggs - Damage 2nd Class',	'EGG-CRM-D2',	'eggs',	'trays',	3000.00,	10000.00,	300.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07'),
('898cf7be-9542-4066-a9b5-ab3595350fb7',	'White Eggs (Trays)',	'EGG-WHT',	'eggs',	'trays',	12000.00,	15000.00,	500.00,	15000.00,	0.00,	1,	'2026-07-28 15:21:49',	'2026-07-31 16:41:52'),
('a9b57701-e97c-4eec-9ad4-b5630a386fae',	'White Eggs - Triple Pack',	'EGG-WHT-TPL',	'eggs',	'units',	36000.00,	0.00,	0.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-26 21:35:46'),
('aac026fe-d6c1-4147-b256-8484ef0c84bb',	'Live Chicken (Unit)',	'POU-LVE',	'poultry',	'units',	22000.00,	20000.00,	0.00,	0.00,	0.00,	1,	'2026-07-28 15:21:49',	'2026-07-29 09:27:07'),
('ae3c3e52-431c-41ee-9d39-309ba8c1e96d',	'White Eggs - Family Pack',	'EGG-WHT-FAM',	'eggs',	'units',	60000.00,	0.00,	0.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-26 21:35:46'),
('b255a790-ee06-4304-ba1b-9567c2f1c1a1',	'White Eggs - Shell Eggs',	'EGG-WHT-SHL',	'eggs',	'trays',	2000.00,	200.00,	200.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:30:06'),
('b6ffd939-1eb8-4799-b5f0-f2b41c4574c4',	'Chicken Manure (Kg)',	'BY-MNR',	'by_products',	'kg',	1500.00,	12000.00,	0.00,	0.00,	0.00,	1,	'2026-07-28 15:21:49',	'2026-07-29 09:27:07'),
('be8c0b55-faed-47cc-bb1e-bd68ff1875f7',	'Brown Eggs - Damage 2nd Class',	'EGG-BRN-D2',	'eggs',	'trays',	3000.00,	10000.00,	300.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07'),
('c1a4a0eb-121c-47cf-b829-38b829256623',	'Brown Eggs (Trays)',	'EGG-BRN',	'eggs',	'trays',	13500.00,	13000.00,	450.00,	12000.00,	0.00,	1,	'2026-07-28 15:21:49',	'2026-07-31 16:41:51'),
('cd825d13-8810-4b1b-bbb0-7ee0bb2ad0ab',	'Cream Eggs - 6-Pack',	'EGG-CRM-06P',	'eggs',	'units',	3800.00,	3800.00,	0.00,	5000.00,	0.00,	1,	'2026-07-26 21:35:42',	'2026-07-31 16:41:52'),
('d2b56378-3c08-4857-952e-dcee847ecf16',	'Cream Eggs - Single Pack',	'EGG-CRM-SGL',	'eggs',	'trays',	15000.00,	15000.00,	500.00,	15000.00,	500.00,	1,	'2026-07-26 21:35:42',	'2026-07-26 21:35:42'),
('d3dc6cc1-7448-47fd-833c-b14337fa0653',	'Brown Eggs - Damage 1st Class',	'EGG-BRN-D1',	'eggs',	'trays',	5000.00,	10000.00,	300.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07'),
('d4f8de9c-ddd4-448b-b428-ceae297d0fb7',	'White Eggs - Damage 1st Class',	'EGG-WHT-D1',	'eggs',	'trays',	5000.00,	10000.00,	300.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07'),
('d5016683-807b-46e7-a792-d6834f0c3ae1',	'Brown Eggs - Single Pack',	'EGG-BRN-SGL',	'eggs',	'trays',	15000.00,	15000.00,	500.00,	0.00,	500.00,	1,	'2026-07-26 21:35:42',	'2026-07-31 16:41:53'),
('d5d18e28-2f83-4048-b185-50045c2e8a53',	'Cream Eggs - Shell Eggs',	'EGG-CRM-SHL',	'eggs',	'trays',	2000.00,	200.00,	200.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:30:06'),
('dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'White Eggs - 15-Pack',	'EGG-WHT-15P',	'eggs',	'units',	8500.00,	8500.00,	0.00,	10500.00,	0.00,	1,	'2026-07-26 21:35:42',	'2026-07-31 16:41:52'),
('e489af94-59e4-4c20-836c-a8e9358709cf',	'Brown Eggs - Shell Eggs',	'EGG-BRN-SHL',	'eggs',	'trays',	2000.00,	200.00,	200.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:30:06'),
('f4a57d1a-5193-4435-8321-e69882a114fb',	'Brown Eggs - 6-Pack',	'EGG-BRN-06P',	'eggs',	'units',	3800.00,	3800.00,	0.00,	0.00,	0.00,	1,	'2026-07-26 21:35:42',	'2026-07-31 16:41:52'),
('f53534e2-952b-43a2-898a-4c15b3511500',	'Brown Eggs - Damage 3rd Class',	'EGG-BRN-D3',	'eggs',	'trays',	0.00,	7500.00,	250.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07'),
('fa088eb2-e38a-48b2-84db-29779de21d4c',	'Cream Eggs - Damage 1st Class',	'EGG-CRM-D1',	'eggs',	'trays',	5000.00,	10000.00,	300.00,	0.00,	0.00,	1,	'2026-07-26 21:35:46',	'2026-07-29 09:27:07');

DROP TABLE IF EXISTS `push_subscriptions`;
CREATE TABLE `push_subscriptions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `p256dh_key` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_token` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `push_subscriptions_user_id_is_active_index` (`user_id`,`is_active`),
  CONSTRAINT `push_subscriptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `return_vouchers`;
CREATE TABLE `return_vouchers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `voucher_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `return_date` date NOT NULL,
  `date_replaced` date DEFAULT NULL,
  `reason_code` enum('broken_cracked','rotten_spoiled','wrong_product','near_expiry','packaging_damage','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `replacement_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unit_price` decimal(15,2) NOT NULL,
  `monetary_value` decimal(15,2) NOT NULL,
  `return_type` enum('credit','physical_replacement') COLLATE utf8mb4_unicode_ci NOT NULL,
  `replacement_sales_store_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `replacement_batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `acknowledged_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_credit_posted` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_vouchers_voucher_number_unique` (`voucher_number`),
  KEY `return_vouchers_delivery_id_foreign` (`delivery_id`),
  KEY `return_vouchers_order_id_foreign` (`order_id`),
  KEY `return_vouchers_customer_id_foreign` (`customer_id`),
  KEY `return_vouchers_product_id_foreign` (`product_id`),
  KEY `return_vouchers_created_by_foreign` (`created_by`),
  KEY `return_vouchers_return_date_index` (`return_date`),
  KEY `return_vouchers_replacement_sales_store_id_foreign` (`replacement_sales_store_id`),
  CONSTRAINT `return_vouchers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `return_vouchers_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `return_vouchers_delivery_id_foreign` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`),
  CONSTRAINT `return_vouchers_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `return_vouchers_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `return_vouchers_replacement_sales_store_id_foreign` FOREIGN KEY (`replacement_sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `sales_store_conversions`;
CREATE TABLE `sales_store_conversions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversion_date` date NOT NULL,
  `sales_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_quantity` decimal(10,2) NOT NULL,
  `to_quantity` decimal(10,2) NOT NULL,
  `converted_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `sales_store_conversions_from_product_id_foreign` (`from_product_id`),
  KEY `sales_store_conversions_to_product_id_foreign` (`to_product_id`),
  KEY `sales_store_conversions_converted_by_foreign` (`converted_by`),
  KEY `sales_store_conversions_approved_by_foreign` (`approved_by`),
  KEY `sales_store_conversions_rejected_by_foreign` (`rejected_by`),
  KEY `sales_conversion_lookup` (`sales_store_id`,`status`,`created_at`),
  KEY `sales_conversion_batch` (`batch_reference`),
  CONSTRAINT `sales_store_conversions_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_store_conversions_converted_by_foreign` FOREIGN KEY (`converted_by`) REFERENCES `users` (`id`),
  CONSTRAINT `sales_store_conversions_from_product_id_foreign` FOREIGN KEY (`from_product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `sales_store_conversions_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_store_conversions_sales_store_id_foreign` FOREIGN KEY (`sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_store_conversions_to_product_id_foreign` FOREIGN KEY (`to_product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sales_store_conversions` (`id`, `conversion_date`, `sales_store_id`, `from_product_id`, `to_product_id`, `batch_reference`, `from_quantity`, `to_quantity`, `converted_by`, `notes`, `created_at`, `updated_at`, `status`, `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejection_reason`) VALUES
('018ebe2d-6e98-43c7-b266-d9f72c1c4ba6',	'2026-08-01',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'KIB001A',	35.00,	35.00,	'644edb07-006c-41eb-b16a-6487adf784e6',	'Conversion by operator: HQ Admin User',	'2026-08-01 07:34:48',	'2026-08-01 07:34:48',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:34:48',	NULL,	NULL,	NULL),
('25880db1-1d7a-4a04-94cf-8fa63d30e8b9',	'2026-08-01',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'241b255c-6b2c-4c62-8276-96994f3b59c6',	'KIB001A',	7.20,	36.00,	'644edb07-006c-41eb-b16a-6487adf784e6',	'Conversion by operator: HQ Admin User',	'2026-08-01 07:36:49',	'2026-08-01 07:36:49',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:36:49',	NULL,	NULL,	NULL),
('3743c9ee-41d9-4b91-b825-19a446d9be2e',	'2026-07-31',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'c1a4a0eb-121c-47cf-b829-38b829256623',	'3f6e8a7f-a244-4e24-ae1e-c34c2dc91309',	'B001A',	55.00,	55.00,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Production to sales',	'2026-07-31 16:12:55',	'2026-07-31 16:13:44',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:13:44',	NULL,	NULL,	NULL),
('461cb95b-80e2-4511-af9e-16211fa063a9',	'2026-07-31',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'B003A',	26.00,	26.00,	'644edb07-006c-41eb-b16a-6487adf784e6',	'Conversion by operator: HQ Admin User',	'2026-07-31 15:46:03',	'2026-07-31 15:46:03',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:46:03',	NULL,	NULL,	NULL),
('9e6bd185-5983-4097-a3c9-c3438553035f',	'2026-07-31',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'21038ad6-8cfe-11f1-8b3b-920009458eca',	NULL,	11.00,	11.00,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Converted',	'2026-07-31 16:40:41',	'2026-07-31 16:42:05',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:42:05',	NULL,	NULL,	NULL),
('a2765783-d4c0-46ec-a224-19815d217225',	'2026-08-01',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'KIB001A',	40.00,	80.00,	'644edb07-006c-41eb-b16a-6487adf784e6',	'Conversion by operator: HQ Admin User',	'2026-08-01 07:35:54',	'2026-08-01 07:35:54',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:35:54',	NULL,	NULL,	NULL),
('bdb77634-a713-4dff-8b16-566259d96513',	'2026-07-31',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'B003A',	3.50,	7.00,	'644edb07-006c-41eb-b16a-6487adf784e6',	'Conversion by operator: HQ Admin User',	'2026-07-31 15:46:33',	'2026-07-31 15:46:33',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:46:33',	NULL,	NULL,	NULL),
('e22b7213-2613-4321-8eee-938277bfa537',	'2026-07-31',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'1cbec570-dabc-4070-90d7-ab17cba61d6a',	'B003A',	35.00,	35.00,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Converted',	'2026-07-31 15:58:07',	'2026-07-31 15:58:26',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:58:26',	NULL,	NULL,	NULL);

DROP TABLE IF EXISTS `sales_store_movements`;
CREATE TABLE `sales_store_movements` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sales_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `movement_date` date NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `movement_type` enum('transfer_in','dispatch_out','return_in','adjustment','wastage') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `reference_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_store_movements_product_id_foreign` (`product_id`),
  KEY `sales_store_movements_created_by_foreign` (`created_by`),
  KEY `sales_movement_lookup` (`sales_store_id`,`movement_date`),
  KEY `sales_movement_batch` (`batch_reference`),
  KEY `idx_sales_movement_store_date` (`sales_store_id`,`movement_date`),
  CONSTRAINT `sales_store_movements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `sales_store_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `sales_store_movements_sales_store_id_foreign` FOREIGN KEY (`sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sales_store_movements` (`id`, `sales_store_id`, `movement_date`, `product_id`, `batch_reference`, `movement_type`, `quantity`, `reference_id`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
('010fe10a-b1e6-45ea-9b8d-dddcf0bb917a',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'1cbec570-dabc-4070-90d7-ab17cba61d6a',	'B003A',	'dispatch_out',	20.00,	'14443073-633e-4fac-a410-ddaddb79cc6c',	'Sold for Order: LHO-2026-0002',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:55',	'2026-07-31 16:43:55'),
('1e1a3782-eb2b-4f22-8353-44b1aec7a088',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'c1a4a0eb-121c-47cf-b829-38b829256623',	'B001A',	'dispatch_out',	55.00,	'3743c9ee-41d9-4b91-b825-19a446d9be2e',	'Converted 55.00 bulk trays into packaged units (Batch: B001A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:13:44',	'2026-07-31 16:13:44'),
('253d0865-d731-4172-a7e3-e5f3fca026e9',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	'transfer_in',	26.00,	'daa1d8a5-fa61-4769-b92b-2963ff1c4741',	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:41:02',	'2026-07-31 15:41:02'),
('3484a9b2-cefd-4a60-b62f-1780f0ca54a1',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'B003A',	'transfer_in',	7.00,	'bdb77634-a713-4dff-8b16-566259d96513',	'Obtained from bulk conversion (Batch: B003A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:46:33',	'2026-07-31 15:46:33'),
('35dc6486-a591-4e7f-9cf4-4693b6c9a591',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'KIB001A',	'transfer_in',	80.00,	'a2765783-d4c0-46ec-a224-19815d217225',	'Obtained from bulk conversion (Batch: KIB001A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:35:54',	'2026-08-01 07:35:54'),
('3ea6e760-fe47-4612-96f7-b98ce9a6a327',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'241b255c-6b2c-4c62-8276-96994f3b59c6',	'KIB001A',	'transfer_in',	36.00,	'25880db1-1d7a-4a04-94cf-8fa63d30e8b9',	'Obtained from bulk conversion (Batch: KIB001A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:36:49',	'2026-08-01 07:36:49'),
('42bbc32f-b571-4543-a7d2-40486dac5ed3',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	'transfer_in',	3.50,	'7db8893e-5f82-42fd-8087-c48720b56ea1',	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:44:56',	'2026-07-31 15:44:56'),
('4668d924-933c-425e-b4f6-587706200399',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'KIB001A',	'transfer_in',	35.00,	'018ebe2d-6e98-43c7-b266-d9f72c1c4ba6',	'Obtained from bulk conversion (Batch: KIB001A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:34:48',	'2026-08-01 07:34:48'),
('4759b2b7-8420-43fa-a80e-ad1ad8b54387',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'1cbec570-dabc-4070-90d7-ab17cba61d6a',	'B003A',	'dispatch_out',	15.00,	'cf3d35d5-c824-4d40-83b1-ad79c9f97705',	'Sold for Order: LHO-2026-0001',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:59',	'2026-07-31 16:43:59'),
('4dd77109-80e9-42d0-8f5a-4f5c596d87eb',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'1cbec570-dabc-4070-90d7-ab17cba61d6a',	'B003A',	'transfer_in',	35.00,	'e22b7213-2613-4321-8eee-938277bfa537',	'Obtained from bulk conversion (Batch: B003A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:58:26',	'2026-07-31 15:58:26'),
('5b792389-a328-4c9b-80bb-f47ffb89ee17',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'3f6e8a7f-a244-4e24-ae1e-c34c2dc91309',	'B001A',	'dispatch_out',	55.00,	'3105c8f5-c56e-42c2-8bb8-b9587371d9f2',	'Sold for Order: LHO-2026-0003',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:49',	'2026-07-31 16:43:49'),
('5fda5010-ea25-4515-8211-2ce964b444a0',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'B002A',	'dispatch_out',	11.00,	'9e6bd185-5983-4097-a3c9-c3438553035f',	'Converted 11.00 bulk trays into packaged units (FIFO Batch: B002A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:42:05',	'2026-07-31 16:42:05'),
('7c697e15-e9fd-47b9-a040-c97349da9a30',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'KIB001A',	'transfer_in',	87.00,	'2014573d-4e62-49e4-ba5f-53f701d217f2',	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:32:47',	'2026-08-01 07:32:47'),
('822dac99-79ad-4256-aec3-7be9d9b57209',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	'transfer_in',	35.00,	'fd4609da-7142-4c58-80f6-c81b4519031f',	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:54:31',	'2026-07-31 15:54:31'),
('98448b04-7625-403d-8501-c7ddbdece145',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'KIB001A',	'dispatch_out',	35.00,	'018ebe2d-6e98-43c7-b266-d9f72c1c4ba6',	'Converted 35 bulk trays into packaged units (Batch: KIB001A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:34:48',	'2026-08-01 07:34:48'),
('9c066b53-d31a-4ce7-8c51-3ef7ed109cd3',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	'dispatch_out',	26.00,	'461cb95b-80e2-4511-af9e-16211fa063a9',	'Converted 26 bulk trays into packaged units (Batch: B003A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:46:03',	'2026-07-31 15:46:03'),
('abf5baf1-35b1-4cde-a872-c94810f5007d',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'B003A',	'transfer_in',	26.00,	'461cb95b-80e2-4511-af9e-16211fa063a9',	'Obtained from bulk conversion (Batch: B003A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:46:03',	'2026-07-31 15:46:03'),
('ac95ea71-eb8a-4476-bc12-27fd978c0409',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'c1a4a0eb-121c-47cf-b829-38b829256623',	'B001A',	'transfer_in',	55.00,	'6d666933-d3f0-4372-9928-c65426a76d65',	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:04:59',	'2026-07-31 16:04:59'),
('b1763b57-5dfe-4919-a9f7-e880efb3f40d',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'21038ad6-8cfe-11f1-8b3b-920009458eca',	'B002A',	'transfer_in',	11.00,	'9e6bd185-5983-4097-a3c9-c3438553035f',	'Obtained from bulk conversion (FIFO Batch: B002A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:42:05',	'2026-07-31 16:42:05'),
('b533b384-b82d-4095-87b4-c49e1a786576',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'KIB001A',	'dispatch_out',	40.00,	'a2765783-d4c0-46ec-a224-19815d217225',	'Converted 40 bulk trays into packaged units (Batch: KIB001A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:35:54',	'2026-08-01 07:35:54'),
('de5d1037-698f-40d6-945e-1cfc064b51db',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'KIB001A',	'dispatch_out',	7.20,	'25880db1-1d7a-4a04-94cf-8fa63d30e8b9',	'Converted 7.2 bulk trays into packaged units (Batch: KIB001A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:36:49',	'2026-08-01 07:36:49'),
('df7af220-5f57-4316-8bba-33b940bba890',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	'dispatch_out',	3.50,	'bdb77634-a713-4dff-8b16-566259d96513',	'Converted 3.5 bulk trays into packaged units (Batch: B003A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:46:33',	'2026-07-31 15:46:33'),
('e2042138-6690-4e38-b318-3767b9ffd04b',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'B002A',	'transfer_in',	11.00,	'00566259-cf18-4deb-8574-a12fe78d2597',	NULL,	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:07:06',	'2026-07-31 16:07:06'),
('e224e1c6-ad63-4ef4-aee3-1d6d44c89f62',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'B002A',	'dispatch_out',	11.00,	'bd1d6892-e2af-4a4c-8af4-9b832b5ce4a9',	'Sold for Order: LHO-2026-0004',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:43:34',	'2026-07-31 16:43:34'),
('e91c9f97-a5a2-468d-8bba-ba1977c16214',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'3f6e8a7f-a244-4e24-ae1e-c34c2dc91309',	'B001A',	'transfer_in',	55.00,	'3743c9ee-41d9-4b91-b825-19a446d9be2e',	'Obtained from bulk conversion (Batch: B001A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:13:44',	'2026-07-31 16:13:44'),
('fc3b6e3c-00ee-43c7-974b-ea285c5ea08a',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	'dispatch_out',	35.00,	'e22b7213-2613-4321-8eee-938277bfa537',	'Converted 35.00 bulk trays into packaged units (Batch: B003A)',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:58:26',	'2026-07-31 15:58:26');

DROP TABLE IF EXISTS `sales_store_stock`;
CREATE TABLE `sales_store_stock` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sales_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_stock` decimal(15,2) NOT NULL DEFAULT '0.00',
  `transferred_in` decimal(15,2) NOT NULL DEFAULT '0.00',
  `conversions_in` decimal(15,2) NOT NULL DEFAULT '0.00',
  `conversions_out` decimal(15,2) NOT NULL DEFAULT '0.00',
  `transferred_out` decimal(15,2) NOT NULL DEFAULT '0.00',
  `sold_quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `replacements` decimal(15,2) NOT NULL DEFAULT '0.00',
  `damages` decimal(10,2) NOT NULL DEFAULT '0.00',
  `closing_stock` decimal(15,2) NOT NULL DEFAULT '0.00',
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `egg_unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `current_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_stock_unique_store_product_batch` (`sales_store_id`,`product_id`,`batch_reference`),
  KEY `sales_store_stock_updated_by_foreign` (`updated_by`),
  KEY `sales_store_stock_product_id_foreign` (`product_id`),
  KEY `sales_stock_lookup` (`sales_store_id`,`product_id`,`batch_reference`),
  KEY `idx_sales_stock_lookup` (`sales_store_id`,`product_id`,`batch_reference`),
  CONSTRAINT `sales_store_stock_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `sales_store_stock_sales_store_id_foreign` FOREIGN KEY (`sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_store_stock_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sales_store_stock` (`id`, `sales_store_id`, `product_id`, `batch_reference`, `opening_stock`, `transferred_in`, `conversions_in`, `conversions_out`, `transferred_out`, `sold_quantity`, `replacements`, `damages`, `closing_stock`, `unit_price`, `egg_unit_price`, `current_quantity`, `last_updated`, `updated_by`, `created_at`, `updated_at`) VALUES
('21ca6fdd-0bfd-405f-947e-707ca0b3edf3',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'1cbec570-dabc-4070-90d7-ab17cba61d6a',	'B003A',	35.00,	0.00,	35.00,	0.00,	0.00,	35.00,	0.00,	0.00,	0.00,	15000.00,	0.00,	0.00,	'2026-07-31 16:43:59',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 15:58:26',	'2026-07-31 16:43:59'),
('255a0e2a-7aa7-41c7-ad3e-2a2c26c7f21b',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'KIB001A',	35.00,	0.00,	35.00,	0.00,	0.00,	0.00,	0.00,	0.00,	35.00,	15000.00,	0.00,	35.00,	'2026-08-01 07:34:48',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:34:48',	'2026-08-01 07:34:48'),
('257f7003-9e05-4e18-890f-d84f96c80ff5',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'B003A',	7.00,	0.00,	7.00,	0.00,	0.00,	0.00,	0.00,	0.00,	7.00,	8500.00,	0.00,	7.00,	'2026-07-31 15:46:33',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:46:33',	'2026-07-31 15:46:33'),
('321a2317-d217-4c31-9a7d-e40d822bb234',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	0.00,	64.50,	0.00,	64.50,	0.00,	0.00,	0.00,	0.00,	0.00,	0.00,	0.00,	0.00,	'2026-07-31 15:58:26',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:41:02',	'2026-07-31 15:58:26'),
('3f801c20-cc18-4893-b8df-1a28a3462740',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'3f6e8a7f-a244-4e24-ae1e-c34c2dc91309',	'B001A',	55.00,	0.00,	55.00,	0.00,	0.00,	55.00,	0.00,	0.00,	0.00,	12000.00,	0.00,	0.00,	'2026-07-31 16:43:49',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:13:44',	'2026-07-31 16:43:49'),
('4dc5fd24-e2b9-47ea-99ae-13ec02b008da',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'21038ad6-8cfe-11f1-8b3b-920009458eca',	'B002A',	11.00,	0.00,	11.00,	0.00,	0.00,	0.00,	0.00,	0.00,	11.00,	20000.00,	0.00,	11.00,	'2026-07-31 16:42:05',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:42:05',	'2026-07-31 16:42:05'),
('94959235-8cfa-11f1-8b3b-920009458eca',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'B002A',	0.00,	0.00,	0.00,	11.00,	0.00,	11.00,	0.00,	0.00,	-22.00,	20000.00,	0.00,	-22.00,	'2026-07-31 16:43:34',	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'2026-07-31 16:12:08',	'2026-07-31 16:43:34'),
('95f0817b-fead-415c-b185-d9570511dca0',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'31e7b83d-3112-42e8-a6b1-5f6a391ce8b3',	'B003A',	26.00,	0.00,	26.00,	0.00,	0.00,	0.00,	0.00,	0.00,	26.00,	15000.00,	0.00,	26.00,	'2026-07-31 15:46:03',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:46:03',	'2026-07-31 15:46:03'),
('c16ff019-2bc3-4e96-b0c3-5c404e295fb2',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'dc2e6976-688b-4c8b-8f05-132d0a9097e8',	'KIB001A',	80.00,	0.00,	80.00,	0.00,	0.00,	0.00,	0.00,	0.00,	80.00,	10500.00,	0.00,	80.00,	'2026-08-01 07:35:54',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:35:54',	'2026-08-01 07:35:54'),
('c2001607-98a1-4d88-b7fc-9524282e2170',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'241b255c-6b2c-4c62-8276-96994f3b59c6',	'KIB001A',	36.00,	0.00,	36.00,	0.00,	0.00,	0.00,	0.00,	0.00,	36.00,	4000.00,	0.00,	36.00,	'2026-08-01 07:36:49',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:36:49',	'2026-08-01 07:36:49'),
('ca8ef3a2-5502-4487-a1e4-1aed4feaacae',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'KIB001A',	0.00,	87.00,	0.00,	82.20,	0.00,	0.00,	0.00,	0.00,	4.80,	15000.00,	0.00,	4.80,	'2026-08-01 07:36:49',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:32:47',	'2026-08-01 07:36:49'),
('d399ef37-efd0-4915-92fa-95dfd088ceb0',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'c1a4a0eb-121c-47cf-b829-38b829256623',	'B001A',	0.00,	55.00,	0.00,	55.00,	0.00,	0.00,	0.00,	0.00,	0.00,	0.00,	0.00,	0.00,	'2026-07-31 16:13:44',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:04:59',	'2026-07-31 16:13:44');

DROP TABLE IF EXISTS `sales_store_transfers`;
CREATE TABLE `sales_store_transfers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_date` date NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_sales_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_sales_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `transferred_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_store_transfers_product_id_foreign` (`product_id`),
  KEY `sales_store_transfers_to_sales_store_id_foreign` (`to_sales_store_id`),
  KEY `sales_store_transfers_transferred_by_foreign` (`transferred_by`),
  KEY `sales_transfer_lookup` (`from_sales_store_id`,`to_sales_store_id`,`transfer_date`),
  KEY `sales_transfer_batch` (`batch_reference`),
  CONSTRAINT `sales_store_transfers_from_sales_store_id_foreign` FOREIGN KEY (`from_sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_store_transfers_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `sales_store_transfers_to_sales_store_id_foreign` FOREIGN KEY (`to_sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_store_transfers_transferred_by_foreign` FOREIGN KEY (`transferred_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `sales_stores`;
CREATE TABLE `sales_stores` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_stores_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sales_stores` (`id`, `name`, `code`, `location`, `is_active`, `created_at`, `updated_at`) VALUES
('11a20239-53cd-48e4-9f8f-233170a46eb0',	'Akright Sales Store',	'AKT-SS',	'Akright',	1,	'2026-07-29 09:12:04',	'2026-07-29 09:12:04'),
('c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'Kibuye Sales Store',	'KIB-SS',	'Kibuye',	1,	'2026-07-29 09:12:42',	'2026-07-29 09:12:42');

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('1PQPpvvG275SzKHO20oAhdkzlV9UcFc76ZHFN0V5',	NULL,	'115.248.8.65',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUVZmUGhNTjlSTE5GNm5hcVBYaXlDRmtwNHFTUjQ5ek9XT1ZuRE1OYyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjAwOiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwPyUyRiUzQyUzRmVjaG8lMjhtZDUlMjglMjJoaSUyMiUyOSUyOSUzQiUzRiUzRSUyMCUyRnRtcCUyRmluZGV4MS5waHA9JmNvbmZpZy1jcmVhdGUlMjAlMkY9Jmxhbmc9Li4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRnVzciUyRmxvY2FsJTJGbGliJTJGcGhwJTJGcGVhcmNtZCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',	1785373512),
('3pLDTftNzAblKTPsoSGGurPyHN7UcOWfI8NuBRbn',	NULL,	'115.248.8.65',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoidDhYU3ZjbzM1UjcybzFvQXJjSGFTMmlCcHFIYVVwYW9ndUxMR2k4WCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6ODk6Imh0dHA6Ly8xNzguMTA0Ljg1LjE2MC9pbmRleC5waHA/bGFuZz0uLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGdG1wJTJGaW5kZXgxIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',	1785373514),
('4bedsYPP7aO25GVHUABpoEvlEgbD14drURTv5fUy',	NULL,	'180.184.29.15',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUFpva2ViREhmYWJ2SWJpSWFkMWI3dUJyRzRET3pxcUNDVVJLZjF2ViI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjAwOiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwPyUyRiUzQyUzRmVjaG8lMjhtZDUlMjglMjJoaSUyMiUyOSUyOSUzQiUzRiUzRSUyMCUyRnRtcCUyRmluZGV4MS5waHA9JmNvbmZpZy1jcmVhdGUlMjAlMkY9Jmxhbmc9Li4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRnVzciUyRmxvY2FsJTJGbGliJTJGcGhwJTJGcGVhcmNtZCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',	1785501707),
('9NFsNw1ZB1abLpfsYGpe0CB3qY14cufTa7HDXss0',	NULL,	'117.164.191.217',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSWlVVFNlOTBFUFRyeEFTWUZLWVI5NWFPV2JTbmhSd09mQTdsY3I0SSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjAwOiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwPyUyRiUzQyUzRmVjaG8lMjhtZDUlMjglMjJoaSUyMiUyOSUyOSUzQiUzRiUzRSUyMCUyRnRtcCUyRmluZGV4MS5waHA9JmNvbmZpZy1jcmVhdGUlMjAlMkY9Jmxhbmc9Li4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRnVzciUyRmxvY2FsJTJGbGliJTJGcGhwJTJGcGVhcmNtZCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',	1785467345),
('e9KOIlsg4ljpadfUxVFA7WjLoLDZXs5CFyW3nAa0',	NULL,	'117.164.191.217',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWDRCcW1HejBDcXdyeUZXNzA1RTZvTkI2VXNCa00xY0g0aFlPMEwzciI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6ODk6Imh0dHA6Ly8xNzguMTA0Ljg1LjE2MC9pbmRleC5waHA/bGFuZz0uLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGdG1wJTJGaW5kZXgxIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',	1785467349),
('fSJDVZrIHUlN7bYaX8PsmRAkG33qEqLDDRHEDpQF',	NULL,	'180.184.29.15',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaDlwY2RjQ3RGUUkxTHUyWWptQTBuWFp6WVBpQnZBcUJ0WXZRdFh6MiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MTQ3OiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwP2Z1bmN0aW9uPWNhbGxfdXNlcl9mdW5jX2FycmF5JnM9JTJGaW5kZXglMkYlNUN0aGluayU1Q2FwcCUyRmludm9rZWZ1bmN0aW9uJnZhcnMlNUIwJTVEPW1kNSZ2YXJzJTVCMSU1RCU1QjAlNUQ9SGVsbG8iO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',	1785501697),
('i5GZ4qGGWFoymcdt7G2Yjug8sjPLKluZvNoOeAR3',	NULL,	'115.248.8.65',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiMWJSQ3lQS2w5bjY3cDl3akRJYlQwWTM5T05xZm9XN3ZjdlhZU1ZJayI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MTQ3OiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwP2Z1bmN0aW9uPWNhbGxfdXNlcl9mdW5jX2FycmF5JnM9JTJGaW5kZXglMkYlNUN0aGluayU1Q2FwcCUyRmludm9rZWZ1bmN0aW9uJnZhcnMlNUIwJTVEPW1kNSZ2YXJzJTVCMSU1RCU1QjAlNUQ9SGVsbG8iO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',	1785373510),
('MIC5MDE2vVU5Og87OT49VsT8HI3PGEvqcy6WEGca',	NULL,	'193.141.65.199',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiU2pscWFLdjVwYlZEdUFhRUlOaWxrU01DUkl2SEU5aHhvcDNRNEJSMyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MTQ3OiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwP2Z1bmN0aW9uPWNhbGxfdXNlcl9mdW5jX2FycmF5JnM9JTJGaW5kZXglMkYlNUN0aGluayU1Q2FwcCUyRmludm9rZWZ1bmN0aW9uJnZhcnMlNUIwJTVEPW1kNSZ2YXJzJTVCMSU1RCU1QjAlNUQ9SGVsbG8iO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',	1785322808),
('O895MFFbaVgDBFQZJAirPFJnehnQqmKR7jMyU2j5',	NULL,	'180.184.29.15',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiR292b1pYdU5NaFdoUktobzVtVnd0eWZrVUhLUGgyS1Yxb2JxOGI3QiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6ODk6Imh0dHA6Ly8xNzguMTA0Ljg1LjE2MC9pbmRleC5waHA/bGFuZz0uLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGdG1wJTJGaW5kZXgxIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',	1785501709),
('qCDvr4uv6Y9KLUFy1UKBqDCg90ndylMSCUqm1m0K',	NULL,	'31.132.90.3',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoieU1hZGtHcGJTeVZOSkRQV2FMcElBYUVJRHc2RTNQVUV3dUhKbTVKUiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6ODk6Imh0dHA6Ly8xNzguMTA0Ljg1LjE2MC9pbmRleC5waHA/bGFuZz0uLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGdG1wJTJGaW5kZXgxIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',	1785508318),
('r5uV6vYMfFJznWteqwinxeHvsvcNGeSS4Ho3BwaO',	NULL,	'117.164.191.217',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSzQ3cmZtSFl2MTNTRGZZejEwY1FQVDNQS2FtMXp1SExkYUpDRWNLMCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MTQ3OiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwP2Z1bmN0aW9uPWNhbGxfdXNlcl9mdW5jX2FycmF5JnM9JTJGaW5kZXglMkYlNUN0aGluayU1Q2FwcCUyRmludm9rZWZ1bmN0aW9uJnZhcnMlNUIwJTVEPW1kNSZ2YXJzJTVCMSU1RCU1QjAlNUQ9SGVsbG8iO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',	1785467337),
('ScC7seAtYRigXIeyZSqS0sNjylIt7HJlZGc1pK2L',	NULL,	'193.141.65.199',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiYkxuQ3RTUXozcWxFaGNBN281RHpsd0RzNU54TlZtUjhkRnVuMHNmRCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjAwOiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwPyUyRiUzQyUzRmVjaG8lMjhtZDUlMjglMjJoaSUyMiUyOSUyOSUzQiUzRiUzRSUyMCUyRnRtcCUyRmluZGV4MS5waHA9JmNvbmZpZy1jcmVhdGUlMjAlMkY9Jmxhbmc9Li4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRnVzciUyRmxvY2FsJTJGbGliJTJGcGhwJTJGcGVhcmNtZCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',	1785322811),
('y766BgAQoaLQZigHKTonLvB03QcjvkXVZSdFtbDt',	NULL,	'31.132.90.3',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoia2wxY2dqMTkzMEFtNTNwRWpmWGZwR1YwbWhiYlp2VzlZcFQ5bnE1VyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjAwOiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwPyUyRiUzQyUzRmVjaG8lMjhtZDUlMjglMjJoaSUyMiUyOSUyOSUzQiUzRiUzRSUyMCUyRnRtcCUyRmluZGV4MS5waHA9JmNvbmZpZy1jcmVhdGUlMjAlMkY9Jmxhbmc9Li4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRnVzciUyRmxvY2FsJTJGbGliJTJGcGhwJTJGcGVhcmNtZCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',	1785508318),
('z81NSPFwLqZxE4jRHbn7etUws0OvvlyN4WIjzf9M',	NULL,	'193.141.65.199',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiYldLVkhBNGhPUGtHQlU5dllIOFFPTHRqVkFMZ1g4b0xOZkxDSllHYyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6ODk6Imh0dHA6Ly8xNzguMTA0Ljg1LjE2MC9pbmRleC5waHA/bGFuZz0uLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGLi4lMkYuLiUyRi4uJTJGdG1wJTJGaW5kZXgxIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',	1785322814),
('ZxApU4BqLX65FLDcuBEhJ4Aj0LBzy2VEqhg4FWLF',	NULL,	'31.132.90.3',	'libredtail-http',	'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaXNEWVBJeUFIV2MyNnB1NWNIdVR4Zjl5MEJTTGVLZjRKbXpGWVpjTCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MTQ3OiJodHRwOi8vMTc4LjEwNC44NS4xNjAvaW5kZXgucGhwP2Z1bmN0aW9uPWNhbGxfdXNlcl9mdW5jX2FycmF5JnM9JTJGaW5kZXglMkYlNUN0aGluayU1Q2FwcCUyRmludm9rZWZ1bmN0aW9uJnZhcnMlNUIwJTVEPW1kNSZ2YXJzJTVCMSU1RCU1QjAlNUQ9SGVsbG8iO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',	1785508318);

DROP TABLE IF EXISTS `sms_logs`;
CREATE TABLE `sms_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway_response` text COLLATE utf8mb4_unicode_ci,
  `status` enum('sent','failed','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `order_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sms_logs_order_id_foreign` (`order_id`),
  KEY `sms_logs_customer_id_foreign` (`customer_id`),
  KEY `sms_logs_driver_id_foreign` (`driver_id`),
  CONSTRAINT `sms_logs_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `sms_logs_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `sms_logs_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `store_adjustments`;
CREATE TABLE `store_adjustments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_type` enum('production','sales') COLLATE utf8mb4_unicode_ci NOT NULL,
  `production_store_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sales_store_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adjustment_date` date NOT NULL,
  `quantity_change` decimal(10,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `store_adjustments_product_id_foreign` (`product_id`),
  KEY `store_adjustments_created_by_foreign` (`created_by`),
  KEY `store_adjustments_production_store_id_foreign` (`production_store_id`),
  KEY `store_adjustments_sales_store_id_foreign` (`sales_store_id`),
  KEY `store_adjustments_approved_by_foreign` (`approved_by`),
  KEY `store_adj_lookup` (`store_type`,`status`,`created_at`),
  KEY `store_adj_batch` (`batch_reference`),
  CONSTRAINT `store_adjustments_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `store_adjustments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `store_adjustments_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `store_adjustments_production_store_id_foreign` FOREIGN KEY (`production_store_id`) REFERENCES `production_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_adjustments_sales_store_id_foreign` FOREIGN KEY (`sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `store_transfers`;
CREATE TABLE `store_transfers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `production_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sales_store_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_date` date NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(15,2) DEFAULT NULL,
  `transferred_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `store_transfers_product_id_foreign` (`product_id`),
  KEY `store_transfers_transferred_by_foreign` (`transferred_by`),
  KEY `store_transfers_sales_store_id_foreign` (`sales_store_id`),
  KEY `store_transfers_approved_by_foreign` (`approved_by`),
  KEY `store_transfers_rejected_by_foreign` (`rejected_by`),
  KEY `store_transfer_lookup` (`production_store_id`,`sales_store_id`,`status`,`transfer_date`),
  KEY `store_transfer_batch` (`batch_reference`),
  CONSTRAINT `store_transfers_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `store_transfers_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `store_transfers_production_store_id_foreign` FOREIGN KEY (`production_store_id`) REFERENCES `production_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_transfers_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `store_transfers_sales_store_id_foreign` FOREIGN KEY (`sales_store_id`) REFERENCES `sales_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_transfers_transferred_by_foreign` FOREIGN KEY (`transferred_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `store_transfers` (`id`, `production_store_id`, `sales_store_id`, `transfer_date`, `product_id`, `batch_reference`, `quantity`, `unit_price`, `transferred_by`, `notes`, `created_at`, `updated_at`, `status`, `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejection_reason`) VALUES
('00566259-cf18-4deb-8574-a12fe78d2597',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'4b8bc092-1d4f-41e2-b41e-fe1974477a5a',	'B002A',	11.00,	20000.00,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Transfer',	'2026-07-31 16:06:53',	'2026-07-31 16:07:06',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:07:06',	NULL,	NULL,	NULL),
('2014573d-4e62-49e4-ba5f-53f701d217f2',	'1c93b48a-6b02-47cd-a9b9-5e9ffdc54418',	'c724c5bc-0513-4ea5-8805-d0ea05dac44b',	'2026-08-01',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'KIB001A',	87.00,	15000.00,	'644edb07-006c-41eb-b16a-6487adf784e6',	'Transfer to Sales Store',	'2026-08-01 07:32:47',	'2026-08-01 07:32:47',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-08-01 07:32:47',	NULL,	NULL,	NULL),
('6d666933-d3f0-4372-9928-c65426a76d65',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'c1a4a0eb-121c-47cf-b829-38b829256623',	'B001A',	55.00,	13000.00,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Transfer',	'2026-07-31 16:04:52',	'2026-07-31 16:04:59',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 16:04:59',	NULL,	NULL,	NULL),
('7db8893e-5f82-42fd-8087-c48720b56ea1',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	3.50,	15000.00,	'644edb07-006c-41eb-b16a-6487adf784e6',	'Transfer to Sales Store',	'2026-07-31 15:44:56',	'2026-07-31 15:44:56',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:44:56',	NULL,	NULL,	NULL),
('daa1d8a5-fa61-4769-b92b-2963ff1c4741',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	26.00,	15000.00,	'644edb07-006c-41eb-b16a-6487adf784e6',	'Transfer to Sales Store',	'2026-07-31 15:41:02',	'2026-07-31 15:41:02',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:41:02',	NULL,	NULL,	NULL),
('fd4609da-7142-4c58-80f6-c81b4519031f',	'4d48c202-129d-4626-9942-b63b2eb7c824',	'11a20239-53cd-48e4-9f8f-233170a46eb0',	'2026-07-31',	'898cf7be-9542-4066-a9b5-ab3595350fb7',	'B003A',	35.00,	15000.00,	'364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Transfer from production to sales',	'2026-07-31 15:53:52',	'2026-07-31 15:54:31',	'approved',	'644edb07-006c-41eb-b16a-6487adf784e6',	'2026-07-31 15:54:31',	NULL,	NULL,	NULL);

DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_unique` (`key`),
  KEY `system_settings_updated_by_foreign` (`updated_by`),
  CONSTRAINT `system_settings_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `user_notification_preferences`;
CREATE TABLE `user_notification_preferences` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel_transfers` tinyint(1) NOT NULL DEFAULT '1',
  `channel_damages` tinyint(1) NOT NULL DEFAULT '1',
  `channel_stock_alerts` tinyint(1) NOT NULL DEFAULT '1',
  `channel_deliveries` tinyint(1) NOT NULL DEFAULT '1',
  `channel_payments` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_notification_preferences_user_id_unique` (`user_id`),
  CONSTRAINT `user_notification_preferences_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_notification_preferences` (`id`, `user_id`, `channel_transfers`, `channel_damages`, `channel_stock_alerts`, `channel_deliveries`, `channel_payments`, `created_at`, `updated_at`) VALUES
('73f07406-dc30-46d9-9562-9586a10fc363',	'28e21626-e4d1-445e-b630-4df6abed4646',	1,	1,	1,	1,	1,	'2026-07-27 06:29:07',	'2026-07-27 06:29:07'),
('819a6cc9-02d6-4248-9796-d664b9134e80',	'644edb07-006c-41eb-b16a-6487adf784e6',	1,	1,	1,	1,	1,	'2026-07-26 23:04:04',	'2026-07-26 23:04:04');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `phone`, `status`, `remember_token`, `created_at`, `updated_at`) VALUES
('01a92785-b414-451f-a141-ab9a2051b620',	'Mugabi Stephen',	'mugabi@gmail.com',	NULL,	'$2y$12$w.0m47KLnJ9bztbmpmLqv.VwScYK.IDJh/Bwh4rMh2zIhbyo3gpQW',	'driver',	'0785218499',	'active',	NULL,	'2026-07-29 09:59:34',	'2026-07-29 10:01:40'),
('0be533ba-bb2f-4919-a94f-a7b97fa16f51',	'Johnson',	'johnson@lokoharvest.com',	NULL,	'$2y$12$4L2oHOPEnP4BHCJJOq5XYOf/ZcQTeeRAh18pC9e6w7gFayPBInuLO',	'driver',	'982738494',	'active',	NULL,	'2026-07-30 09:34:35',	'2026-07-30 09:34:35'),
('28e21626-e4d1-445e-b630-4df6abed4646',	'Ann',	'ann@gmail.com',	NULL,	'$2y$12$wgMJ08eglpfIUjB4XHb76ekMwA.o90Adhh48a1641ypnsCbgysLyC',	'admin',	'0712345678',	'active',	NULL,	'2026-07-27 04:30:03',	'2026-07-27 04:30:38'),
('364ca8b3-a321-4e89-9acb-3ed7a36f5ea4',	'Johnson Naamanya',	'naamanyajohnson41@gmail.com',	NULL,	'$2y$12$3RQobfFe5MZSN5xeWxVpbONGbI1RFMFhKjjMfEMAjU4Qzl05.SVVu',	'order_manager',	'0783590362',	'active',	NULL,	'2026-07-27 09:23:18',	'2026-07-27 09:23:33'),
('3eab292c-d7eb-4505-835d-b06def6b256d',	'Emilio Lumbuye',	'emiliolumbuye23@gmail.com',	NULL,	'$2y$12$Hnc0/p9QSTng5rksEwrGhuOy.1vMlX9EZ5Pmijn2tN1P5KXv1XsG2',	'driver',	'0777699438',	'active',	NULL,	'2026-07-29 10:29:20',	'2026-07-29 10:30:42'),
('4132bf95-06b4-4705-be84-c1973727e14e',	'Order Manager User',	'ordermanager@loko.com',	NULL,	'$2y$12$B1n560gtltJhTEya2WZO5OpHYIa22Fv2.3lDl/djoQRmFP9CjUrIC',	'order_manager',	'+256700000002',	'active',	NULL,	'2026-07-26 21:35:48',	'2026-07-26 21:35:48'),
('644edb07-006c-41eb-b16a-6487adf784e6',	'HQ Admin User',	'admin@loko.com',	NULL,	'$2y$12$1jqzdNGgP1uV/5GDNZoasuw6FjPdRkHv4ioljvVkGHKvATt/1pVg6',	'admin',	'+256700000001',	'active',	NULL,	'2026-07-26 21:35:48',	'2026-07-26 21:35:48'),
('d8fa00bd-a12d-43c6-8ed6-3236baf6a867',	'Driver User',	'driver@loko.com',	NULL,	'$2y$12$uR6oMKv2aYAxCsohwKIiO.Q8Jwm4sg5KP/h9mwProdnCFMpP2Umfq',	'driver',	'+256700000003',	'active',	NULL,	'2026-07-26 21:35:48',	'2026-07-26 21:35:48');

DROP TABLE IF EXISTS `vehicle_logs`;
CREATE TABLE `vehicle_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `initial_fuel` double NOT NULL DEFAULT '0',
  `added_fuel` double NOT NULL DEFAULT '0',
  `fuel_price_per_liter` double NOT NULL DEFAULT '0',
  `total_spent` double NOT NULL DEFAULT '0',
  `evidence_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `logged_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicle_logs_vehicle_id_foreign` (`vehicle_id`),
  KEY `vehicle_logs_driver_id_foreign` (`driver_id`),
  CONSTRAINT `vehicle_logs_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vehicle_logs_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `make` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_crates_capacity` int NOT NULL DEFAULT '300',
  `fuel_level` int NOT NULL DEFAULT '100',
  `initial_fuel` int NOT NULL DEFAULT '100',
  `consumption_per_km` double DEFAULT NULL,
  `added_fuel_per_shift` double NOT NULL DEFAULT '0',
  `fuel_tank_capacity` double DEFAULT NULL,
  `status` enum('active','maintenance','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicles_registration_number_unique` (`registration_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicles` (`id`, `registration_number`, `make`, `model`, `max_crates_capacity`, `fuel_level`, `initial_fuel`, `consumption_per_km`, `added_fuel_per_shift`, `fuel_tank_capacity`, `status`, `image_path`, `created_at`, `updated_at`) VALUES
('85f49057-1aba-40ba-a171-d8ef80a1dd1e',	'UAT907Y',	'Toyota',	'Probox',	300,	50,	0,	0.06,	0,	50,	'active',	'vehicles/gdLyvRdTGcmwg2eS1fhe77o1Z4U170BLcoXrADWc.jpg',	'2026-07-29 08:19:51',	'2026-07-29 10:16:06'),
('a19f468e-dc1f-4c97-a9ce-9733ef2fa613',	'UAT944Y',	'Toyota',	'Dyna',	1500,	100,	100,	NULL,	0,	NULL,	'active',	'vehicles/pbTLBMZnke1ueYBdz3C8OE5t9McyqR0dPCBNmKbY.jpg',	'2026-07-30 08:45:01',	'2026-07-30 08:45:01'),
('d2fac59e-59a3-4bb5-a742-90489809f579',	'UMA162KT',	'Spiro',	'M2',	40,	50,	50,	NULL,	0,	NULL,	'active',	'vehicles/ZKHDe0VZAJRB8UxgRCpD9mIhNwFkvbC27e4ZQ4nN.png',	'2026-07-29 10:27:08',	'2026-07-29 10:27:08');

-- 2026-08-01 08:46:23
