'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ProductForm from '@/components/ProductForm';
import { apiClient } from '@/lib/api';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

export default function NewProductPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getCategories()
      .then((res) => setCategories(Array.isArray(res) ? res : (res.data ?? res.categories ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Icon icon={ArrowLeft01Icon} size={14} />
          Back to products
        </Link>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-base)' }}>
          Add Product
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Pick a category first — the details you can add change to match what you're selling.
        </p>
      </div>

      {loading ? (
        <div className="max-w-3xl space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ts-skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <ProductForm product={null} categories={categories} />
      )}
    </div>
  );
}
