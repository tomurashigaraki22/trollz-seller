-- Trollz Seller RBAC foundation.
-- Apply against the shared `trollzv3` database.

CREATE TABLE IF NOT EXISTS admin_roles (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(120) NOT NULL,
  resource VARCHAR(80) NOT NULL,
  action VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code),
  KEY idx_permissions_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_arp_role FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_arp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_memberships (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  seller_id INT NOT NULL DEFAULT 0,
  status ENUM('active', 'suspended', 'revoked') NOT NULL DEFAULT 'active',
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_membership (user_id, role_id, seller_id),
  KEY idx_admin_memberships_user (user_id, status),
  KEY idx_admin_memberships_seller (seller_id, status),
  CONSTRAINT fk_admin_membership_role FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE admin_memberships SET seller_id = 0 WHERE seller_id IS NULL;
ALTER TABLE admin_memberships MODIFY seller_id INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS admin_sessions (
  session_id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  ip_hash CHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id),
  KEY idx_admin_sessions_user (user_id, revoked_at),
  KEY idx_admin_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  bucket_key CHAR(64) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  window_started_at DATETIME NOT NULL,
  locked_until DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (bucket_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  actor_id INT NULL,
  action VARCHAR(120) NOT NULL,
  permission_code VARCHAR(120) NULL,
  resource_type VARCHAR(80) NULL,
  resource_id VARCHAR(80) NULL,
  seller_id INT NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  request_id VARCHAR(80) NULL,
  ip_hash CHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_audit_actor (actor_id, created_at),
  KEY idx_admin_audit_resource (resource_type, resource_id, created_at),
  KEY idx_admin_audit_seller (seller_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_roles (code, name, description, is_system)
VALUES
  ('super_admin', 'Super administrator', 'Full platform access, including RBAC administration.', 1),
  ('operations_admin', 'Operations administrator', 'Seller, order, fulfilment, and support operations.', 1),
  ('catalog_admin', 'Catalog administrator', 'Products, categories, promotions, and homepage content.', 1),
  ('seller_admin', 'Seller administrator', 'Seller accounts, applications, verification, and seller teams.', 1),
  ('support_admin', 'Support administrator', 'Customer support, orders, and contact workflows.', 1),
  ('finance_admin', 'Finance administrator', 'Commercial reporting, delivery pricing, coupons, and referrals.', 1),
  ('analyst', 'Analyst', 'Read-only operational reporting.', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_system = VALUES(is_system);

INSERT INTO permissions (code, resource, action, description)
VALUES
  ('dashboard.read', 'dashboard', 'read', 'View the admin dashboard.'),
  ('analytics.read', 'analytics', 'read', 'View analytics and performance data.'),
  ('reports.export', 'reports', 'export', 'Export approved operational reports.'),
  ('products.read', 'products', 'read', 'View products.'),
  ('products.create', 'products', 'create', 'Create products.'),
  ('products.update', 'products', 'update', 'Update products.'),
  ('products.delete', 'products', 'delete', 'Delete products.'),
  ('categories.manage', 'categories', 'manage', 'Manage product categories.'),
  ('flash_sales.manage', 'flash_sales', 'manage', 'Manage flash sales.'),
  ('homepage.manage', 'homepage', 'manage', 'Manage homepage content.'),
  ('orders.read', 'orders', 'read', 'View orders.'),
  ('orders.update_status', 'orders', 'update_status', 'Update order statuses.'),
  ('delivery.manage', 'delivery', 'manage', 'Manage delivery pricing and settings.'),
  ('sellers.read', 'sellers', 'read', 'View seller accounts.'),
  ('sellers.manage', 'sellers', 'manage', 'Create, suspend, and manage seller accounts.'),
  ('seller_applications.read', 'seller_applications', 'read', 'View seller applications.'),
  ('seller_applications.review', 'seller_applications', 'review', 'Approve, reject, and annotate seller applications.'),
  ('seller_team.manage', 'seller_team', 'manage', 'Manage seller team access.'),
  ('customers.read_limited', 'customers', 'read_limited', 'View limited customer information.'),
  ('support.read', 'support', 'read', 'View support inboxes.'),
  ('support.manage', 'support', 'manage', 'Resolve and manage support cases.'),
  ('messages.manage', 'messages', 'manage', 'Manage contact messages.'),
  ('coupons.manage', 'coupons', 'manage', 'Manage coupons.'),
  ('referrals.manage', 'referrals', 'manage', 'Manage referrals and credits.'),
  ('newsletter.manage', 'newsletter', 'manage', 'Manage newsletter subscribers.'),
  ('email_campaigns.manage', 'email_campaigns', 'manage', 'Create and send email campaigns.'),
  ('admin_users.read', 'admin_users', 'read', 'View admin users.'),
  ('admin_users.manage', 'admin_users', 'manage', 'Invite, suspend, and manage admin users.'),
  ('admin_roles.read', 'admin_roles', 'read', 'View roles and permissions.'),
  ('admin_roles.manage', 'admin_roles', 'manage', 'Manage roles and permission assignments.'),
  ('audit_logs.read', 'audit_logs', 'read', 'View admin audit logs.'),
  ('system_settings.manage', 'system_settings', 'manage', 'Manage security and system settings.')
ON DUPLICATE KEY UPDATE
  resource = VALUES(resource),
  action = VALUES(action),
  description = VALUES(description);

INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r CROSS JOIN permissions p WHERE r.code = 'super_admin';

INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r JOIN permissions p ON p.code IN (
  'dashboard.read', 'analytics.read', 'reports.export', 'sellers.read',
  'seller_applications.read', 'seller_applications.review', 'orders.read',
  'orders.update_status', 'delivery.manage', 'support.read', 'support.manage',
  'messages.manage', 'customers.read_limited'
) WHERE r.code = 'operations_admin';

INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r JOIN permissions p ON p.code IN (
  'dashboard.read', 'analytics.read', 'products.read', 'products.create',
  'products.update', 'products.delete', 'categories.manage', 'flash_sales.manage',
  'homepage.manage'
) WHERE r.code = 'catalog_admin';

INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r JOIN permissions p ON p.code IN (
  'dashboard.read', 'analytics.read', 'sellers.read', 'sellers.manage',
  'seller_applications.read', 'seller_applications.review', 'seller_team.manage'
) WHERE r.code = 'seller_admin';

INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r JOIN permissions p ON p.code IN (
  'dashboard.read', 'analytics.read', 'orders.read', 'orders.update_status',
  'support.read', 'support.manage', 'messages.manage', 'customers.read_limited'
) WHERE r.code = 'support_admin';

INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r JOIN permissions p ON p.code IN (
  'dashboard.read', 'analytics.read', 'reports.export', 'orders.read',
  'delivery.manage', 'coupons.manage', 'referrals.manage'
) WHERE r.code = 'finance_admin';

INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r JOIN permissions p ON p.code IN (
  'dashboard.read', 'analytics.read', 'reports.export', 'products.read',
  'orders.read', 'sellers.read', 'seller_applications.read', 'customers.read_limited'
) WHERE r.code = 'analyst';

-- Compatibility bootstrap: existing users with role Admin receive the full
-- system role until an operator assigns least-privilege roles.
INSERT IGNORE INTO admin_memberships (user_id, role_id, seller_id, status)
SELECT u.id, r.id, 0, 'active'
FROM users u
JOIN admin_roles r ON r.code = 'super_admin'
WHERE u.role = 'Admin';
