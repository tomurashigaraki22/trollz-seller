const mysql = require("mysql2/promise");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the RBAC dry run.`);
  return value;
}

async function tableExists(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [tableName]
  );
  return Number(rows[0]?.count || 0) > 0;
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
    const requiredTables = ["users", "admin_roles", "permissions", "admin_role_permissions", "admin_memberships", "admin_sessions", "admin_audit_logs"];
    const tableState = Object.fromEntries(await Promise.all(requiredTables.map(async (table) => [table, await tableExists(connection, table)])));
    const report = {
      generatedAt: new Date().toISOString(),
      database: process.env.DB_NAME || "trollzv3",
      tableState,
      legacyUsers: [],
      unresolvedUsers: [],
      legacyAdminTable: null,
      activeRoleCounts: [],
      checks: {},
    };

    if (tableState.users && tableState.admin_memberships) {
      const [rows] = await connection.query(
        `SELECT u.id, u.name, u.email, u.role, u.status,
                COUNT(DISTINCT m.id) AS active_memberships,
                GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS active_roles
         FROM users u
         LEFT JOIN admin_memberships m ON m.user_id = u.id AND m.status = 'active'
         LEFT JOIN admin_roles r ON r.id = m.role_id AND r.is_active = 1
         WHERE u.role = 'Admin'
         GROUP BY u.id, u.name, u.email, u.role, u.status
         ORDER BY u.id`
      );
      report.legacyUsers = rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        activeMemberships: Number(row.active_memberships || 0),
        activeRoles: String(row.active_roles || '').split(',').filter(Boolean),
      }));
      report.unresolvedUsers = report.legacyUsers.filter((user) => user.activeMemberships === 0);
    }

    if (tableState.admin_roles && tableState.admin_memberships) {
      const [rows] = await connection.query(
        `SELECT r.code, COUNT(DISTINCT m.user_id) AS active_members
         FROM admin_roles r
         LEFT JOIN admin_memberships m ON m.role_id = r.id AND m.status = 'active'
         GROUP BY r.id, r.code ORDER BY r.code`
      );
      report.activeRoleCounts = rows.map((row) => ({ code: row.code, activeMembers: Number(row.active_members || 0) }));
    }

    if (await tableExists(connection, "admin")) {
      const [columns] = await connection.query("SHOW COLUMNS FROM admin");
      const emailColumn = columns.find((column) => column.Field.toLowerCase() === 'email')?.Field;
      const [countRows] = await connection.query("SELECT COUNT(*) AS count FROM admin");
      report.legacyAdminTable = { exists: true, count: Number(countRows[0]?.count || 0), columns: columns.map((column) => column.Field), emailColumn: emailColumn || null, unresolvedByEmail: null };
      if (emailColumn) {
        const [legacyRows] = await connection.query(`SELECT \`${emailColumn}\` AS email FROM admin`);
        const knownEmails = new Set(report.legacyUsers.map((user) => String(user.email).toLowerCase()));
        report.legacyAdminTable.unresolvedByEmail = legacyRows
          .map((row) => String(row.email || '').trim().toLowerCase())
          .filter((email) => email && !knownEmails.has(email));
      }
    } else {
      report.legacyAdminTable = { exists: false };
    }

    report.checks.requiredTablesPresent = Object.values(tableState).every(Boolean);
    report.checks.noUnresolvedUsers = report.unresolvedUsers.length === 0;
    report.checks.legacyAdminReviewComplete = !report.legacyAdminTable.exists || report.legacyAdminTable.unresolvedByEmail === null || report.legacyAdminTable.unresolvedByEmail.length === 0;
    report.readyForRollout = Object.values(report.checks).every(Boolean);

    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(`RBAC dry run: ${report.readyForRollout ? 'READY FOR REVIEW' : 'ACTION REQUIRED'}`);
      console.log(`Database: ${report.database}`);
      console.log(`Required tables present: ${report.checks.requiredTablesPresent}`);
      console.log(`Legacy users.role=Admin accounts: ${report.legacyUsers.length}`);
      console.log(`Unresolved admin memberships: ${report.unresolvedUsers.length}`);
      console.log(`Legacy admin table: ${report.legacyAdminTable.exists ? `${report.legacyAdminTable.count} rows` : 'not present'}`);
      if (report.unresolvedUsers.length) console.log(`Unresolved user emails: ${report.unresolvedUsers.map((user) => user.email).join(', ')}`);
      if (report.legacyAdminTable.unresolvedByEmail?.length) console.log(`Unresolved legacy admin emails: ${report.legacyAdminTable.unresolvedByEmail.join(', ')}`);
      console.log('No database writes were performed.');
    }
    if (!report.checks.requiredTablesPresent) process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
