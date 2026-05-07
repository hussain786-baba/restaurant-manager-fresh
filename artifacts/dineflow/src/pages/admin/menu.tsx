import { useState } from "react";
import {
  useListCategories,
  useListMenuItems,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  getListCategoriesQueryKey,
  getListMenuItemsQueryKey,
} from "@workspace/api-client-react";
import type {
  Category,
  MenuItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Award, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MenuTile } from "@/components/MenuTile";
import { VegDot } from "@/components/Brand";
import { money } from "@/lib/format";

export default function AdminMenuPage() {
  const cats = useListCategories();
  const items = useListMenuItems();
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [editCat, setEditCat] = useState<Category | "new" | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | "new" | null>(null);

  const visibleItems =
    items.data?.filter((i) =>
      activeCat ? i.categoryId === activeCat : true,
    ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="gold-stamp">Menu</span>
          <h1 className="font-display text-4xl mt-2">The carte</h1>
          <p className="text-ink-3 text-sm mt-1">
            Compose, price, and curate every dish.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditItem("new")}
          className="btn-gold rounded-full px-5 py-2.5 text-sm inline-flex items-center gap-2"
        >
          <Plus size={14} /> New dish
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="paper-card p-3 h-fit">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Categories
            </div>
            <button
              type="button"
              onClick={() => setEditCat("new")}
              className="text-ink-3 hover:text-ink"
              title="New category"
            >
              <Plus size={14} />
            </button>
          </div>
          <ul className="mt-2 space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => setActiveCat(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                  activeCat === null
                    ? "bg-ink text-paper"
                    : "hover:bg-paper-2 text-ink-2"
                }`}
              >
                <span>All dishes</span>
                <span className="text-[11px] opacity-70">
                  {items.data?.length ?? 0}
                </span>
              </button>
            </li>
            {cats.data?.map((c) => {
              const count =
                items.data?.filter((i) => i.categoryId === c.id).length ?? 0;
              return (
                <li key={c.id} className="group flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveCat(c.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                      activeCat === c.id
                        ? "bg-ink text-paper"
                        : "hover:bg-paper-2 text-ink-2"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[11px] opacity-70">{count}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCat(c);
                    }}
                    className="opacity-0 group-hover:opacity-100 px-2 text-ink-4 hover:text-ink transition-opacity"
                  >
                    <Pencil size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div>
          {items.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-32" />
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="paper-card p-12 text-center">
              <div className="font-display text-2xl">No dishes here yet</div>
              <p className="text-ink-3 text-sm mt-2">
                Add the first dish to this section.
              </p>
              <button
                type="button"
                onClick={() => setEditItem("new")}
                className="btn-gold rounded-full px-5 py-2 text-sm mt-5"
              >
                Add dish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleItems.map((it) => (
                <article
                  key={it.id}
                  className="paper-card p-4 flex gap-3 hover:border-gold transition-colors group"
                >
                  <MenuTile glyph={it.imageEmoji} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <VegDot isVeg={it.isVeg} />
                      {it.isBestseller && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-gold-3 font-semibold">
                          <Award size={10} /> Bestseller
                        </span>
                      )}
                      {!it.isAvailable && (
                        <span className="text-[10px] uppercase tracking-wider text-crimson font-semibold">
                          86'd
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-sm mt-1 truncate">
                      {it.name}
                    </div>
                    <div className="text-[11px] text-ink-3 line-clamp-2 mt-0.5">
                      {it.description}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-mono text-sm font-semibold">
                        {money(it.price)}
                      </span>
                      <span className="text-[11px] text-ink-4 inline-flex items-center gap-1">
                        <Clock size={10} /> {it.prepTimeMinutes}m
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditItem(it)}
                    className="self-start text-ink-4 hover:text-ink"
                  >
                    <Pencil size={14} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoryDialog
        editing={editCat}
        onClose={() => setEditCat(null)}
      />
      <ItemDialog
        editing={editItem}
        categories={cats.data ?? []}
        onClose={() => setEditItem(null)}
      />
    </div>
  );
}

function CategoryDialog({
  editing,
  onClose,
}: {
  editing: Category | "new" | null;
  onClose: () => void;
}) {
  const isNew = editing === "new";
  const c = isNew ? null : editing;
  const [name, setName] = useState(c?.name ?? "");
  const [description, setDescription] = useState(c?.description ?? "");
  const [sortOrder, setSortOrder] = useState(c?.sortOrder ?? 0);
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();
  const qc = useQueryClient();

  // Reset state when editing changes
  useStateFromEditing(editing, () => {
    setName(c?.name ?? "");
    setDescription(c?.description ?? "");
    setSortOrder(c?.sortOrder ?? 0);
  });

  async function save() {
    try {
      if (isNew) {
        await create.mutateAsync({
          data: { name, description, sortOrder },
        });
        toast.success("Category created.");
      } else if (c) {
        await update.mutateAsync({
          id: c.id,
          data: { name, description, sortOrder },
        });
        toast.success("Category updated.");
      }
      qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      onClose();
    } catch {
      toast.error("Could not save.");
    }
  }

  async function remove() {
    if (!c) return;
    if (!confirm(`Delete category "${c.name}" and all its dishes?`)) return;
    try {
      await del.mutateAsync({ id: c.id });
      qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
      toast.success("Category deleted.");
      onClose();
    } catch {
      toast.error("Could not delete.");
    }
  }

  return (
    <Dialog open={editing !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isNew ? "New category" : `Edit ${c?.name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name">
            <input
              className="input-paper"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Description">
            <input
              className="input-paper"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              className="input-paper"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            />
          </Field>
        </div>
        <DialogFooter className="flex sm:justify-between gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={remove}
              className="text-crimson text-sm hover:underline inline-flex items-center gap-1"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm hover:bg-paper-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="btn-gold rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {isNew ? "Create" : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({
  editing,
  categories,
  onClose,
}: {
  editing: MenuItem | "new" | null;
  categories: Category[];
  onClose: () => void;
}) {
  const isNew = editing === "new";
  const m = isNew ? null : editing;
  const [name, setName] = useState(m?.name ?? "");
  const [description, setDescription] = useState(m?.description ?? "");
  const [price, setPrice] = useState(m?.price ?? 0);
  const [categoryId, setCategoryId] = useState(
    m?.categoryId ?? categories[0]?.id ?? 0,
  );
  const [imageEmoji, setImageEmoji] = useState(m?.imageEmoji ?? "🍽");
  const [isVeg, setIsVeg] = useState(m?.isVeg ?? true);
  const [isAvailable, setIsAvailable] = useState(m?.isAvailable ?? true);
  const [isBestseller, setIsBestseller] = useState(m?.isBestseller ?? false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    m?.prepTimeMinutes ?? 15,
  );
  const [includesText, setIncludesText] = useState(
    (m?.includes ?? []).join("\n"),
  );

  const create = useCreateMenuItem();
  const update = useUpdateMenuItem();
  const del = useDeleteMenuItem();
  const qc = useQueryClient();

  useStateFromEditing(editing, () => {
    setName(m?.name ?? "");
    setDescription(m?.description ?? "");
    setPrice(m?.price ?? 0);
    setCategoryId(m?.categoryId ?? categories[0]?.id ?? 0);
    setImageEmoji(m?.imageEmoji ?? "🍽");
    setIsVeg(m?.isVeg ?? true);
    setIsAvailable(m?.isAvailable ?? true);
    setIsBestseller(m?.isBestseller ?? false);
    setPrepTimeMinutes(m?.prepTimeMinutes ?? 15);
    setIncludesText((m?.includes ?? []).join("\n"));
  });

  async function save() {
    const includes = includesText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const payload = {
      name,
      description,
      price: Number(price),
      categoryId,
      imageEmoji,
      isVeg,
      isAvailable,
      isBestseller,
      prepTimeMinutes: Number(prepTimeMinutes),
      includes,
    };
    try {
      if (isNew) {
        await create.mutateAsync({ data: payload });
        toast.success("Dish added.");
      } else if (m) {
        await update.mutateAsync({ id: m.id, data: payload });
        toast.success("Dish updated.");
      }
      qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
      onClose();
    } catch {
      toast.error("Could not save dish.");
    }
  }

  async function remove() {
    if (!m) return;
    if (!confirm(`Delete "${m.name}"?`)) return;
    try {
      await del.mutateAsync({ id: m.id });
      qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
      toast.success("Dish removed.");
      onClose();
    } catch {
      toast.error("Could not delete.");
    }
  }

  return (
    <Dialog open={editing !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isNew ? "New dish" : `Edit ${m?.name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[80px_1fr] gap-3 items-end">
            <Field label="Icon">
              <input
                className="input-paper text-center text-2xl"
                value={imageEmoji ?? ""}
                onChange={(e) => setImageEmoji(e.target.value)}
                maxLength={4}
              />
            </Field>
            <Field label="Name">
              <input
                className="input-paper"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className="input-paper min-h-[60px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price (₹)">
              <input
                type="number"
                className="input-paper"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Prep min">
              <input
                type="number"
                className="input-paper"
                value={prepTimeMinutes}
                onChange={(e) =>
                  setPrepTimeMinutes(Number(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Category">
              <select
                className="input-paper"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Comes with (one per line)">
            <textarea
              className="input-paper min-h-[60px] resize-none text-sm"
              value={includesText}
              onChange={(e) => setIncludesText(e.target.value)}
              placeholder="Mint chutney&#10;Pickled radish"
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Toggle label="Vegetarian" value={isVeg} onChange={setIsVeg} />
            <Toggle
              label="Available"
              value={isAvailable}
              onChange={setIsAvailable}
            />
            <Toggle
              label="Bestseller"
              value={isBestseller}
              onChange={setIsBestseller}
            />
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={remove}
              className="text-crimson text-sm hover:underline inline-flex items-center gap-1"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm hover:bg-paper-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="btn-gold rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {isNew ? "Add dish" : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
        value
          ? "bg-ink text-paper border-ink"
          : "bg-white border-line text-ink-3"
      }`}
    >
      {label}
    </button>
  );
}

import { useEffect } from "react";

function useStateFromEditing<T>(editing: T, fn: () => void) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);
}
