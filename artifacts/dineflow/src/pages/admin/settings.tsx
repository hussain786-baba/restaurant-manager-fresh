import { useState } from "react";
import { toast } from "sonner";
import { Building2, Phone, Mail, MapPin, Percent } from "lucide-react";

export default function AdminSettingsPage() {
  const [restaurantName, setRestaurantName] = useState("DineFlow Bistro");
  const [tagline, setTagline] = useState(
    "Modern Indian, slow indulgence",
  );
  const [phone, setPhone] = useState("+91 98765 43210");
  const [email, setEmail] = useState("hello@dineflow.test");
  const [address, setAddress] = useState(
    "12, Ballygunge Place, Kolkata 700019",
  );
  const [gst, setGst] = useState(5);
  const [currency, setCurrency] = useState("INR");
  const [serviceCharge, setServiceCharge] = useState(0);

  function save(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Settings saved (locally). Connect to backend to persist.");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="gold-stamp">Brand & rules</span>
        <h1 className="font-display text-4xl mt-2">Settings</h1>
        <p className="text-ink-3 text-sm mt-1">
          Restaurant identity and house rules.
        </p>
      </div>

      <form onSubmit={save} className="space-y-5">
        <div className="paper-card p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-3">
            <Building2 size={13} /> Identity
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Restaurant name">
              <input
                className="input-paper"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </Field>
            <Field label="Tagline">
              <input
                className="input-paper"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="paper-card p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-3">
            <Phone size={13} /> Contact
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Phone">
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
                />
                <input
                  className="input-paper pl-9"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
                />
                <input
                  className="input-paper pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
                  />
                  <input
                    className="input-paper pl-9"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>

        <div className="paper-card p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-3">
            <Percent size={13} /> Tax & money
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Field label="GST %">
              <input
                type="number"
                className="input-paper"
                value={gst}
                onChange={(e) => setGst(Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Service charge %">
              <input
                type="number"
                className="input-paper"
                value={serviceCharge}
                onChange={(e) =>
                  setServiceCharge(Number(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Currency">
              <select
                className="input-paper"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}
