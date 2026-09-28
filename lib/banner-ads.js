import "server-only";

import { query } from "@/lib/db";

const DEFAULT_PLANS = [
  ["monthly", "Monthly", 30],
  ["quarterly", "Quarterly (3 months)", 90],
  ["yearly", "Yearly", 365],
];

export async function ensureBannerAdTables() {
  await query(
    `CREATE TABLE IF NOT EXISTS seller_banner_ad_plans (
      code VARCHAR(32) PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      duration_days INT NOT NULL,
      price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
  for (const [code, name, durationDays] of DEFAULT_PLANS) {
    await query(
      `INSERT IGNORE INTO seller_banner_ad_plans (code, name, duration_days, price, is_active)
       VALUES (?, ?, ?, 0, 1)`,
      [code, name, durationDays]
    );
  }
  await query(
    `CREATE TABLE IF NOT EXISTS seller_banner_ads (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      seller_id INT NOT NULL,
      plan_code VARCHAR(32) NOT NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      image_url TEXT NOT NULL,
      target_url TEXT NULL,
      tx_ref VARCHAR(160) NOT NULL UNIQUE,
      transaction_id VARCHAR(100) NULL,
      payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      starts_at DATETIME NULL,
      expires_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_seller_banner_ads_seller (seller_id, status),
      KEY idx_seller_banner_ads_live (status, payment_status, starts_at, expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
}

function serialize(rows) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (value instanceof Date) return [key, value.toISOString()];
    if (typeof value === "bigint") return [key, Number(value)];
    if (key === "amount" && value != null) return [key, Number(value)];
    return [key, value];
  })));
}

export async function getAdminBannerAdDashboard() {
  await ensureBannerAdTables();
  const [plans, ads] = await Promise.all([
    query("SELECT code, name, duration_days, price, is_active, updated_at FROM seller_banner_ad_plans ORDER BY duration_days"),
    query(
      `SELECT a.*, u.name AS seller_name, u.email AS seller_email, p.name AS plan_name
       FROM seller_banner_ads a
       LEFT JOIN users u ON u.id = a.seller_id
       LEFT JOIN seller_banner_ad_plans p ON p.code = a.plan_code
       ORDER BY a.created_at DESC, a.id DESC`
    ),
  ]);
  return { plans: serialize(plans), ads: serialize(ads) };
}


export async function getLiveBannerAds(limit = 10) {
  await ensureBannerAdTables();
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const rows = await query(
    `SELECT a.id, a.image_url, a.target_url, a.starts_at, a.expires_at, u.name AS seller_name
     FROM seller_banner_ads a
     LEFT JOIN users u ON u.id = a.seller_id
     WHERE a.status = 'active'
       AND a.payment_status = 'paid'
       AND (a.starts_at IS NULL OR a.starts_at <= NOW())
       AND a.expires_at IS NOT NULL AND a.expires_at > NOW()
     ORDER BY a.starts_at DESC, a.id DESC
     LIMIT ${safeLimit}`
  );
  return serialize(rows);
}
