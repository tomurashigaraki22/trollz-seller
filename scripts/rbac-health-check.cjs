const mysql = require("mysql2/promise");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the RBAC health check.`);
  return value;
}

async function main() {
  const connection = await mysql.createConnection({
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: process.env.DB_NAME || "trollzv3",
  });
  try {
    const [tables] = await connection.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name IN ('admin_roles','permissions','admin_role_permissions','admin_memberships','admin_sessions','admin_audit_logs')`
    );
    const [superAdmins] = await connection.query(
      `SELECT COUNT(DISTINCT m.user_id) AS count FROM admin_memberships m
       JOIN admin_roles r ON r.id = m.role_id AND r.code = 'super_admin'
       WHERE m.status = 'active'`
    );
    const [audit] = await connection.query("SELECT COUNT(*) AS count FROM admin_audit_logs WHERE created_at >= UTC_TIMESTAMP() - INTERVAL 24 HOUR");
    const [expired] = await connection.query("SELECT COUNT(*) AS count FROM admin_sessions WHERE expires_at <= UTC_TIMESTAMP() AND revoked_at IS NULL");
    const report = {
      checkedAt: new Date().toISOString(),
      requiredTables: tables.map((row) => row.TABLE_NAME || row.table_name),
      activeSuperAdmins: Number(superAdmins[0]?.count || 0),
      auditEventsLast24Hours: Number(audit[0]?.count || 0),
      expiredUnrevokedSessions: Number(expired[0]?.count || 0),
      healthy: tables.length === 6 && Number(superAdmins[0]?.count || 0) > 0,
    };
    console.log(process.argv.includes('--json') ? JSON.stringify(report, null, 2) : `RBAC health: ${report.healthy ? 'OK' : 'FAILED'}\nActive super admins: ${report.activeSuperAdmins}\nAudit events (24h): ${report.auditEventsLast24Hours}\nExpired unrevoked sessions: ${report.expiredUnrevokedSessions}`);
    if (!report.healthy) process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
