import { query } from "@/lib/db";

export const SELLER_AGREEMENT_VERSION = "2026-09-28";

let agreementSchemaReady = false;

async function ensureAgreementAuditColumns() {
  if (agreementSchemaReady) return;
  const columns = [
    ["agreement_version", "VARCHAR(32) NULL"],
    ["agreement_accepted_at", "DATETIME NULL"],
    ["agreement_ip_hash", "CHAR(64) NULL"],
    ["agreement_user_agent", "VARCHAR(255) NULL"],
  ];
  for (const [name, definition] of columns) {
    const rows = await query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'seller_applications' AND column_name = ? LIMIT 1",
      [name]
    );
    if (!rows.length) await query(`ALTER TABLE seller_applications ADD COLUMN ${name} ${definition}`);
  }
  agreementSchemaReady = true;
}

export async function getApplicationByEmail(email) {
  await ensureAgreementAuditColumns();
  const rows = await query(
    "SELECT * FROM seller_applications WHERE email = ? ORDER BY id DESC LIMIT 1",
    [email.trim()]
  );
  return rows[0] ?? null;
}

export async function createApplication(data) {
  await ensureAgreementAuditColumns();
  const result = await query(
    `INSERT INTO seller_applications (
      seller_user_id, full_name, date_of_birth, phone, email, residential_address, state, country,
      business_name, business_type, cac_number, years_in_business, website, social_handles,
      primary_category, other_categories, estimated_products, price_range_min, price_range_max,
      sells_authentic, can_maintain_stock, processing_time, delivery_coverage, logistics_partners,
      bank_account_name, bank_name, bank_account_number,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
      id_document_url, selfie_with_id_url, cac_certificate_url, proof_of_address_url,
      product_photos_urls, business_logo_url, agreement_accepted, signature_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.sellerUserId ?? null,
      data.fullName,
      data.dateOfBirth || null,
      data.phone,
      data.email.trim(),
      data.residentialAddress,
      data.state,
      data.country,
      data.businessName,
      data.businessType,
      data.cacNumber || null,
      data.yearsInBusiness || null,
      data.website || null,
      data.socialHandles || null,
      data.primaryCategory,
      data.otherCategories || null,
      data.estimatedProducts || null,
      data.priceRangeMin || null,
      data.priceRangeMax || null,
      data.sellsAuthentic ? 1 : 0,
      data.canMaintainStock ? 1 : 0,
      data.processingTime || null,
      data.deliveryCoverage || null,
      data.logisticsPartners || null,
      data.bankAccountName || null,
      data.bankName || null,
      data.bankAccountNumber || null,
      data.emergencyContactName || null,
      data.emergencyContactRelationship || null,
      data.emergencyContactPhone || null,
      data.idDocumentUrl || null,
      data.selfieWithIdUrl || null,
      data.cacCertificateUrl || null,
      data.proofOfAddressUrl || null,
      data.productPhotosUrls ? JSON.stringify(data.productPhotosUrls) : null,
      data.businessLogoUrl || null,
      data.agreementAccepted ? 1 : 0,
      data.signatureName?.trim() || null,
    ]
  );
  if (data.agreementAccepted) {
    await query(
      `UPDATE seller_applications
       SET agreement_version = ?, agreement_accepted_at = ?, agreement_ip_hash = ?, agreement_user_agent = ?
       WHERE id = ?`,
      [
        data.agreementVersion || SELLER_AGREEMENT_VERSION,
        data.agreementAcceptedAt || new Date(),
        data.agreementIpHash || null,
        data.agreementUserAgent || null,
        result.insertId,
      ]
    );
  }
  return result.insertId;
}
