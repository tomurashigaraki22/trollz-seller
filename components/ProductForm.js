'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { apiClient } from '@/lib/api';
import { getCategoryFields, resolveFieldOptions, buildSpecsText } from '@/lib/categoryFields';
import {
  Image01Icon,
  Cancel01Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';

function parseImageUrls(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return [value].filter(Boolean);
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Section({ title, description, children }) {
  return (
    <div className="ts-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-base)' }}>
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--danger-text)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ChipToggle({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== option) : [...value, option])}
            className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: active ? 'var(--primary)' : 'var(--bg-elevated)',
              color: active ? '#fff' : 'var(--text-base)',
              boxShadow: active ? 'none' : '0 0 0 1px var(--border)',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function DynamicField({ field, subcategory, value, onChange }) {
  const options = resolveFieldOptions(field, subcategory);

  if (field.type === 'multiselect') {
    return (
      <Field label={field.label}>
        <ChipToggle options={options} value={value ?? []} onChange={onChange} />
      </Field>
    );
  }

  if (field.type === 'select') {
    return (
      <Field label={field.label}>
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="ts-input">
          <option value="">Select {field.label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (field.type === 'date') {
    return (
      <Field label={field.label}>
        <input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="ts-input" />
      </Field>
    );
  }

  return (
    <Field label={field.label}>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="ts-input"
      />
    </Field>
  );
}

export default function ProductForm({ product, categories }) {
  const router = useRouter();
  const isEdit = Boolean(product?.id);
  const topCategories = categories.filter((category) => !category.parent_id);

  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(product?.price ?? '');
  const [stock, setStock] = useState(product?.stock ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? '');
  const [status, setStatus] = useState(product?.status ?? 'active');
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageUrls, setImageUrls] = useState(parseImageUrls(product?.image_url));
  const [attributeValues, setAttributeValues] = useState(() => {
    let otherAttributes = {};
    try {
      otherAttributes = product?.attributes ? JSON.parse(product.attributes) : {};
    } catch {
      otherAttributes = {};
    }
    return {
      ...otherAttributes,
      colors: parseJsonArray(product?.color_options),
      sizes: parseJsonArray(product?.size_options),
    };
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentCategory = topCategories.find((c) => c.category === category);
  const childCategories = categories.filter(
    (c) => currentCategory && Number(c.parent_id) === Number(currentCategory.id)
  );
  const categoryFields = category ? getCategoryFields(category) : [];

  function setAttribute(key, value) {
    setAttributeValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory);
    setSubcategory('');
  }

  async function handleImageSelect(event) {
    const files = event.target.files;
    if (!files?.length) return;

    setError('');
    setUploading(true);
    try {
      const results = await apiClient.uploadProductImages(files);
      const urls = results.map((res) => res.url || res.data?.url || '').filter(Boolean);
      if (urls.length === 0) throw new Error('Upload did not return a URL');
      setImageUrls((prev) => [...prev, ...urls].slice(0, 8));
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function removeImage(url) {
    setImageUrls((prev) => prev.filter((item) => item !== url));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !price) {
      setError('Name and price are required.');
      return;
    }
    if (!category) {
      setError('Select a category.');
      return;
    }

    const specsText = buildSpecsText(categoryFields, attributeValues);
    const fullDescription = specsText
      ? `${description.trim()}${description.trim() ? '\n\n' : ''}Specifications:\n${specsText}`
      : description;

    const otherAttributes = Object.fromEntries(
      Object.entries(attributeValues).filter(([key]) => key !== 'colors' && key !== 'sizes')
    );

    const payload = {
      name: name.trim(),
      price,
      stock,
      category,
      subcategory,
      status,
      description: fullDescription,
      image_url: JSON.stringify(imageUrls),
      color_options: JSON.stringify(attributeValues.colors ?? []),
      size_options: JSON.stringify(attributeValues.sizes ?? []),
      size_type: category === 'Fashion' ? 'clothing' : attributeValues.sizes?.length ? 'custom' : 'none',
      attributes: JSON.stringify(otherAttributes),
    };

    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await apiClient.updateProduct(product.id, payload);
      } else {
        await apiClient.createProduct(payload);
      }
      router.push('/dashboard/products');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Section title="Basic Information" description="What are you selling, and for how much?">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Product Name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Classic Cotton T-Shirt"
                className="ts-input"
              />
            </Field>
          </div>
          <Field label="Price (₦)" required>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5000"
              className="ts-input"
            />
          </Field>
          <Field label="Stock Quantity">
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="100"
              className="ts-input"
            />
          </Field>
          <Field label="Category" required>
            <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className="ts-input">
              <option value="">Select category</option>
              {topCategories.map((c) => (
                <option key={c.id} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory">
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="ts-input"
              disabled={!category || childCategories.length === 0}
            >
              <option value="">{childCategories.length ? 'Select subcategory' : 'No subcategory'}</option>
              {childCategories.map((c) => (
                <option key={c.id} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="ts-input">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </Field>
        </div>
      </Section>

      {category && (
        <Section
          title={`${category} Details`}
          description="These show up on the product page and help buyers filter and compare."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryFields.map((field) => (
              <div key={field.key} className={field.type === 'multiselect' ? 'sm:col-span-2' : ''}>
                <DynamicField
                  field={field}
                  subcategory={subcategory}
                  value={attributeValues[field.key]}
                  onChange={(value) => setAttribute(field.key, value)}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your product — what makes it worth buying?"
          rows={4}
          className="ts-input resize-none"
        />
      </Section>

      <Section title="Product Images" description="Up to 8 photos. The first one is used as the cover image.">
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl py-8 text-sm"
          style={{ boxShadow: '0 0 0 1px var(--border)', color: 'var(--text-secondary)' }}
        >
          <Icon icon={Image01Icon} size={22} style={{ color: 'var(--text-muted)' }} />
          {uploading ? 'Uploading...' : 'Click to upload photos'}
          <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
        </label>
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {imageUrls.map((url, index) => (
              <div key={url} className="relative overflow-hidden rounded-xl" style={{ boxShadow: '0 0 0 1px var(--border)' }}>
                <img src={url} alt="Product preview" className="h-24 w-full object-cover" />
                {index === 0 && (
                  <span
                    className="absolute left-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <Icon icon={Cancel01Icon} size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {error && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}
        >
          <Icon icon={AlertCircleIcon} size={16} />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/products')}
          className="ts-btn-secondary flex-1"
        >
          Cancel
        </button>
        <button type="submit" disabled={saving} className="ts-btn-primary flex-1">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
        </button>
      </div>
    </form>
  );
}
