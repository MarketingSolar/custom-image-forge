
-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (username: admin, password: admin123)
INSERT INTO `users` (`id`, `username`, `password`, `is_admin`)
VALUES (UUID(), 'admin', 'admin123', 1);

-- Create client table (for storing client information)
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `company_name` VARCHAR(100) NULL,
  `url` VARCHAR(100) NOT NULL,
  `logo` LONGTEXT NULL,
  `password` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create text_points table (for storing text point data for each client)
CREATE TABLE IF NOT EXISTS `text_points` (
  `id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `x` DECIMAL(10,2) NOT NULL,
  `y` DECIMAL(10,2) NOT NULL,
  `content` TEXT NULL,
  `font_style` VARCHAR(50) NULL DEFAULT 'normal',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `text_points_client_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
