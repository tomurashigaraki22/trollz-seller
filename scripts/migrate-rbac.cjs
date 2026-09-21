const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to run the RBAC migration.`);
  return value;
}

async function main() {
  const sqlPath = path.join(__dirname, "..", "migrations", "001_rbac.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.replace(/(^|\n)\s*--.*$/gm, "").trim())
    .filter(Boolean);

  const connection = await mysql.createConnection({
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: process.env.DB_NAME || "trollzv3",
  });

  try {
    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log(`RBAC migration applied: ${statements.length} statements.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
