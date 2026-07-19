"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { query } from "@/lib/db";
import { createApplication, getApplicationByEmail } from "@/lib/sellerApplications";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "seller-applications");
const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function extensionFor(mimeType) {
  return (
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
    }[mimeType] ?? "bin"
  );
}

async function saveFile(file) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WEBP or PDF files are accepted.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Each file must be smaller than 8MB.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extensionFor(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/seller-applications/${filename}`;
}

export async function getMyApplicationAction(email) {
  if (!email) return null;
  return getApplicationByEmail(email);
}

export async function submitOnboardingAction(formData) {
  try {
    const email = formData.get("email");

    const existing = await getApplicationByEmail(email);
    if (existing) {
      return { ok: false, error: "You've already submitted an onboarding application." };
    }

    const [idDocumentUrl, selfieWithIdUrl, cacCertificateUrl, proofOfAddressUrl, businessLogoUrl] =
      await Promise.all([
        saveFile(formData.get("idDocument")),
        saveFile(formData.get("selfieWithId")),
        saveFile(formData.get("cacCertificate")),
        saveFile(formData.get("proofOfAddress")),
        saveFile(formData.get("businessLogo")),
      ]);

    const productPhotoFiles = formData.getAll("productPhotos");
    const productPhotosUrls = (await Promise.all(productPhotoFiles.map(saveFile))).filter(Boolean);

    const sellerRows = await query(
      "SELECT id FROM users WHERE email = ? AND role = 'Seller' LIMIT 1",
      [email.trim()]
    );

    await createApplication({
      sellerUserId: sellerRows[0]?.id ?? null,
      fullName: formData.get("fullName"),
      dateOfBirth: formData.get("dateOfBirth"),
      phone: formData.get("phone"),
      email,
      residentialAddress: formData.get("residentialAddress"),
      state: formData.get("state"),
      country: formData.get("country"),
      businessName: formData.get("businessName"),
      businessType: formData.get("businessType"),
      cacNumber: formData.get("cacNumber"),
      yearsInBusiness: formData.get("yearsInBusiness"),
      website: formData.get("website"),
      socialHandles: formData.get("socialHandles"),
      primaryCategory: formData.get("primaryCategory"),
      otherCategories: formData.get("otherCategories"),
      estimatedProducts: formData.get("estimatedProducts"),
      priceRangeMin: formData.get("priceRangeMin") || null,
      priceRangeMax: formData.get("priceRangeMax") || null,
      sellsAuthentic: formData.get("sellsAuthentic") === "yes",
      canMaintainStock: formData.get("canMaintainStock") === "yes",
      processingTime: formData.get("processingTime"),
      deliveryCoverage: formData.get("deliveryCoverage"),
      logisticsPartners: formData.get("logisticsPartners"),
      bankAccountName: formData.get("bankAccountName"),
      bankName: formData.get("bankName"),
      bankAccountNumber: formData.get("bankAccountNumber"),
      emergencyContactName: formData.get("emergencyContactName"),
      emergencyContactRelationship: formData.get("emergencyContactRelationship"),
      emergencyContactPhone: formData.get("emergencyContactPhone"),
      idDocumentUrl,
      selfieWithIdUrl,
      cacCertificateUrl,
      proofOfAddressUrl,
      productPhotosUrls,
      businessLogoUrl,
      agreementAccepted: formData.get("agreementAccepted") === "on",
      signatureName: formData.get("signatureName"),
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "Could not submit your application." };
  }
}
