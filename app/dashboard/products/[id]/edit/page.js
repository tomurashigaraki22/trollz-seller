'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ProductForm from '@/components/ProductForm';
import { apiClient } from '@/lib/api';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

export default function EditProductPage({ params }) {
  const { id } = use(params);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.getCategories(),
      apiClient.getProducts().then((res) => (Array.isArray(res) ? res : (res.data ?? res.products ?? []))),
    ])
      .then(([categoriesRes, products]) => {
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.data ?? categoriesRes.categories ?? []));
        const match = products.find((p) => String(p.id) === String(id));
        if (!match) {
          setError('This product could not be found.');
        } else {
          setProduct(match);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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
          Edit Product
        </h1>
      </div>

      {loading ? (
        <div className="max-w-3xl space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ts-skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm" style={{ color: 'var(--danger-text)' }}>
          {error}
        </p>
      ) : (
        <ProductForm product={product} categories={categories} />
      )}
    </div>
  );
}
