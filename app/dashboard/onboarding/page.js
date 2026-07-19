'use client';

import { useEffect, useState } from 'react';
import { getSellerEmail, getSellerName, getSellerStore } from '@/lib/auth';
import { submitOnboardingAction, getMyApplicationAction } from '@/app/actions/onboarding';

const BUSINESS_TYPES = [
  'Individual Seller',
  'Registered Business',
  'Manufacturer',
  'Distributor',
  'Wholesaler',
];
const PROCESSING_TIMES = ['Same Day', '24 Hours', '48 Hours', '3-5 Days'];
const DELIVERY_COVERAGE = ['Within State', 'Nationwide', 'International'];

const STATUS_STYLES = {
  pending: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', ring: 'var(--warning-border)' },
  approved: { bg: 'var(--success-bg)', text: 'var(--success-text)', ring: 'var(--success-border)' },
  rejected: { bg: 'var(--danger-bg)', text: 'var(--danger-text)', ring: 'var(--danger-border)' },
};

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-base)' }}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{
            boxShadow: `0 0 0 1px ${value === option ? 'var(--primary)' : 'var(--border)'}`,
            color: value === option ? 'var(--primary-dark)' : 'var(--text-base)',
          }}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={(event) => onChange(event.target.value)}
            className="accent-[var(--primary)]"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="ts-card p-6 space-y-4">
      <h2 className="text-base font-bold" style={{ color: 'var(--text-base)' }}>{title}</h2>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const [checking, setChecking] = useState(true);
  const [application, setApplication] = useState(null);
  const [businessType, setBusinessType] = useState('Individual Seller');
  const [processingTime, setProcessingTime] = useState('24 Hours');
  const [deliveryCoverage, setDeliveryCoverage] = useState('Nationwide');
  const [sellsAuthentic, setSellsAuthentic] = useState('yes');
  const [canMaintainStock, setCanMaintainStock] = useState('yes');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const email = getSellerEmail();

  useEffect(() => {
    getMyApplicationAction(email)
      .then(setApplication)
      .finally(() => setChecking(false));
  }, [email]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!agreed) {
      setError('You must accept the Seller Agreement to continue.');
      return;
    }
    setError('');
    setSubmitting(true);

    const formData = new FormData(event.target);
    formData.set('businessType', businessType);
    formData.set('processingTime', processingTime);
    formData.set('deliveryCoverage', deliveryCoverage);
    formData.set('sellsAuthentic', sellsAuthentic);
    formData.set('canMaintainStock', canMaintainStock);

    const result = await submitOnboardingAction(formData);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (checking) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>;
  }

  if (done || application) {
    const status = application?.verification_status ?? 'pending';
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
    return (
      <div className="ts-card p-8 max-w-2xl">
        <h1 className="text-xl font-black" style={{ color: 'var(--text-base)' }}>
          Seller Verification
        </h1>
        <div
          className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold capitalize"
          style={{ background: style.bg, color: style.text, boxShadow: `0 0 0 1px ${style.ring}` }}
        >
          {status}
        </div>
        <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {status === 'approved' &&
            'Your seller account has been verified. You have full access to sell on Trollz Store.'}
          {status === 'pending' &&
            "Your application has been submitted and is awaiting review by the Trollz Store team. We'll notify you once it's been verified."}
          {status === 'rejected' &&
            (application?.remarks ||
              'Your application was not approved. Please contact the Trollz admin team for details.')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-base)' }}>
          Seller Onboarding & Verification
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Complete this form so the Trollz Store team can verify your seller account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="1. Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input name="fullName" required defaultValue={getSellerName() || ''} className="ts-input" />
            </Field>
            <Field label="Date of Birth">
              <input name="dateOfBirth" type="date" className="ts-input" />
            </Field>
            <Field label="Phone Number">
              <input name="phone" type="tel" required className="ts-input" />
            </Field>
            <Field label="Email Address">
              <input name="email" type="email" required defaultValue={email || ''} className="ts-input" />
            </Field>
            <Field label="Residential Address" hint="Street address">
              <input name="residentialAddress" required className="ts-input" />
            </Field>
            <Field label="State">
              <input name="state" required className="ts-input" />
            </Field>
            <Field label="Country">
              <input name="country" required defaultValue="Nigeria" className="ts-input" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="2. Business Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Name">
              <input name="businessName" required defaultValue={getSellerStore() || ''} className="ts-input" />
            </Field>
            <Field label="CAC Registration Number (if applicable)">
              <input name="cacNumber" className="ts-input" />
            </Field>
            <Field label="Years in Business">
              <input name="yearsInBusiness" className="ts-input" />
            </Field>
            <Field label="Website (if available)">
              <input name="website" type="url" className="ts-input" />
            </Field>
            <Field label="Instagram / Facebook / TikTok / X Handle(s)">
              <input name="socialHandles" className="ts-input" />
            </Field>
          </div>
          <Field label="Business Type">
            <RadioGroup
              name="businessTypeDisplay"
              options={BUSINESS_TYPES}
              value={businessType}
              onChange={setBusinessType}
            />
          </Field>
        </SectionCard>

        <SectionCard title="3. Product Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primary Product Category">
              <input name="primaryCategory" required className="ts-input" />
            </Field>
            <Field label="Other Categories">
              <input name="otherCategories" className="ts-input" />
            </Field>
            <Field label="Estimated Number of Products">
              <input name="estimatedProducts" className="ts-input" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Avg Price Range (₦ min)">
                <input name="priceRangeMin" type="number" min="0" className="ts-input" />
              </Field>
              <Field label="Avg Price Range (₦ max)">
                <input name="priceRangeMax" type="number" min="0" className="ts-input" />
              </Field>
            </div>
          </div>
          <Field label="Do you sell only authentic products?">
            <RadioGroup
              name="sellsAuthenticDisplay"
              options={['yes', 'no']}
              value={sellsAuthentic}
              onChange={setSellsAuthentic}
            />
          </Field>
          <Field label="Can you consistently maintain product stock?">
            <RadioGroup
              name="canMaintainStockDisplay"
              options={['yes', 'no']}
              value={canMaintainStock}
              onChange={setCanMaintainStock}
            />
          </Field>
        </SectionCard>

        <SectionCard title="4. Order Fulfilment">
          <Field label="Average processing time">
            <RadioGroup
              name="processingTimeDisplay"
              options={PROCESSING_TIMES}
              value={processingTime}
              onChange={setProcessingTime}
            />
          </Field>
          <Field label="Delivery coverage">
            <RadioGroup
              name="deliveryCoverageDisplay"
              options={DELIVERY_COVERAGE}
              value={deliveryCoverage}
              onChange={setDeliveryCoverage}
            />
          </Field>
          <Field label="Preferred logistics partner(s)">
            <input name="logisticsPartners" className="ts-input" />
          </Field>
        </SectionCard>

        <SectionCard title="5. Payment Information">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Account Name">
              <input name="bankAccountName" required className="ts-input" />
            </Field>
            <Field label="Bank Name">
              <input name="bankName" required className="ts-input" />
            </Field>
            <Field label="Account Number">
              <input name="bankAccountNumber" required className="ts-input" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="6. Identity Verification">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Government-issued ID" hint="National ID, Driver's License, Passport, or Voter's Card">
              <input name="idDocument" type="file" accept="image/*,application/pdf" className="ts-input" />
            </Field>
            <Field label="Selfie holding the ID">
              <input name="selfieWithId" type="file" accept="image/*" className="ts-input" />
            </Field>
            <Field label="CAC Certificate (for registered businesses)">
              <input name="cacCertificate" type="file" accept="image/*,application/pdf" className="ts-input" />
            </Field>
            <Field label="Proof of Business Address (if available)">
              <input name="proofOfAddress" type="file" accept="image/*,application/pdf" className="ts-input" />
            </Field>
            <Field label="Product Photos">
              <input name="productPhotos" type="file" accept="image/*" multiple className="ts-input" />
            </Field>
            <Field label="Business Logo (Optional)">
              <input name="businessLogo" type="file" accept="image/*" className="ts-input" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="7. Emergency Contact">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Full Name">
              <input name="emergencyContactName" required className="ts-input" />
            </Field>
            <Field label="Relationship">
              <input name="emergencyContactRelationship" required className="ts-input" />
            </Field>
            <Field label="Phone Number">
              <input name="emergencyContactPhone" type="tel" required className="ts-input" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="8. Seller Agreement">
          <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            By signing this form, I confirm that all information provided is true and accurate; I
            will only sell authentic, legal, and accurately described products; I will fulfill
            customer orders promptly and maintain professional communication; I understand Trollz
            Store may suspend or remove my seller account for fraud, counterfeit sales, misleading
            listings, or repeated failure to fulfill orders; and I agree to comply with Trollz
            Store&apos;s Seller Terms &amp; Conditions, Marketplace Policies, and Seller Agreement.
          </p>
          <Field label="Type your full name as your signature">
            <input name="signatureName" required className="ts-input" />
          </Field>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-base)' }}>
            <input
              type="checkbox"
              name="agreementAccepted"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            I have read and agree to the{" "}
            <a
              href="https://trollzstore.com.ng/seller-agreement"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--primary)" }}
              className="underline"
            >
              Seller Agreement
            </a>{" "}
            and Marketplace Policies.
          </label>
        </SectionCard>

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="ts-btn-primary ts-btn-lg w-full">
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
