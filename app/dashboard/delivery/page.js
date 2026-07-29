"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import Icon from "@/components/Icon";
import { Location01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

export default function SellerDeliveryPage() {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    pickup_zone_id: "",
    pickup_address: "",
    handling_time_days: 1,
    same_day_pickup: false,
    dropoff_supported: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getDeliverySettings()
      .then((res) => {
        if (cancelled) return;
        const settings = res.data?.settings ?? {};
        setZones(res.data?.zones ?? []);
        setForm({
          pickup_zone_id: settings.pickup_zone_id ?? "",
          pickup_address: settings.pickup_address ?? "",
          handling_time_days: settings.handling_time_days ?? 1,
          same_day_pickup: Boolean(settings.same_day_pickup),
          dropoff_supported: Boolean(settings.dropoff_supported),
        });
      })
      .catch((error) => setMessage(error.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await apiClient.updateDeliverySettings(form);
      setMessage("Delivery settings saved.");
    } catch (error) {
      setMessage(error.message || "Could not save delivery settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-base)" }}>
          Delivery
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Tell Trollz where pickups happen and how quickly your store can prepare orders.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Icon icon={Location01Icon} size={18} style={{ color: "var(--primary)" }} />
          <h2 className="font-bold" style={{ color: "var(--text-base)" }}>Pickup settings</h2>
        </div>

        {loading ? (
          <p className="mt-5 text-sm" style={{ color: "var(--text-muted)" }}>Loading settings...</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              Pickup zone
              <select
                value={form.pickup_zone_id}
                onChange={(event) => update("pickup_zone_id", event.target.value)}
                className="ts-input mt-1.5"
              >
                <option value="">Select pickup zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              Handling time
              <select
                value={form.handling_time_days}
                onChange={(event) => update("handling_time_days", Number(event.target.value))}
                className="ts-input mt-1.5"
              >
                <option value={0}>Same day</option>
                <option value={1}>1 day</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
              </select>
            </label>

            <label className="block text-xs font-semibold sm:col-span-2" style={{ color: "var(--text-secondary)" }}>
              Pickup address
              <textarea
                value={form.pickup_address}
                onChange={(event) => update("pickup_address", event.target.value)}
                rows={4}
                className="ts-input mt-1.5 resize-none"
                placeholder="Street, area, city"
              />
            </label>

            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-base)" }}>
              <input
                type="checkbox"
                checked={form.same_day_pickup}
                onChange={(event) => update("same_day_pickup", event.target.checked)}
                className="accent-brand-500"
              />
              Same-day pickup available
            </label>

            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-base)" }}>
              <input
                type="checkbox"
                checked={form.dropoff_supported}
                onChange={(event) => update("dropoff_supported", event.target.checked)}
                className="accent-brand-500"
              />
              I can drop off at Trollz collection point
            </label>
          </div>
        )}

        {message && (
          <p className="mt-4 flex items-center gap-2 text-sm" style={{ color: message.includes("saved") ? "var(--success)" : "var(--danger-text)" }}>
            {message.includes("saved") && <Icon icon={CheckmarkCircle02Icon} size={16} />}
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || saving}
          className="ts-btn ts-btn-primary mt-6"
        >
          {saving ? "Saving..." : "Save delivery settings"}
        </button>
      </form>
    </div>
  );
}
