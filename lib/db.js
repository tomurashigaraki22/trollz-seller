import mysql from "mysql2/promise";

// Hardcoded per explicit instruction — same DB the trollz_v3 storefront/
// admin use (this app only touches it for the seller onboarding form).
// Rotate the VPS `admin` password if this repo is ever made public or
// shared beyond the team.
const DB_CONFIG = {
  host: "57.131.33.181",
  port: 3306,
  user: "admin",
  password: "Pityboy@22",
  database: "trollzv3",
};

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

export async function query(sql, params) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}
