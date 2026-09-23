"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

const emptyDraft = { name: "", slug: "", description: "", is_active: true };
function slugify(value: string) {
  const map: Record<string, string> = { а:"a", б:"b", в:"v", г:"h", ґ:"g", д:"d", е:"e", є:"ye", ж:"zh", з:"z", и:"y", і:"i", ї:"yi", й:"y", к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r", с:"s", т:"t", у:"u", ф:"f", х:"kh", ц:"ts", ч:"ch", ш:"sh", щ:"shch", ю:"yu", я:"ya", ь:"" };
  return value.toLocaleLowerCase("uk").split("").map((c) => map[c] ?? c).join("").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminCategoriesManager({ initialCategories }: { initialCategories: AdminCategoryRow[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [slugEdited, setSlugEdited] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  const clearPreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setFilePreview(null);
  };
  const selectFile = (selected: File | null) => {
    clearPreview();
    setFile(selected);
    if (selected) {
      previewUrl.current = URL.createObjectURL(selected);
      setFilePreview(previewUrl.current);
    }
  };

  const beginCreate = () => { setEditing("new"); setDraft(emptyDraft); selectFile(null); setRemoveImage(false); setSlugEdited(false); setMessage(null); };
  const beginEdit = (item: AdminCategoryRow) => { setEditing(item.id); setDraft({ name: item.name, slug: item.slug, description: item.description, is_active: item.isActive }); selectFile(null); setRemoveImage(false); setSlugEdited(true); setMessage(null); };
  const save = async () => {
    setBusy(true); setMessage(null);
    try {
      const existing = categories.find((item) => item.id === editing);
      const payload = { ...draft, sort_order: existing?.sortOrder ?? categories.length };
      const response = await fetch(editing === "new" ? "/api/admin/categories" : `/api/admin/categories/${editing}`, { method: editing === "new" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result: { id?: string; error?: string } = await response.json();
      if (!response.ok || !result.id) { setMessage(result.error ?? "Не вдалося зберегти категорію."); return; }
      const id = result.id;
      let imageUrl = existing?.imageUrl ?? null;
      if (file) {
        const form = new FormData(); form.set("file", file);
        const upload = await fetch(`/api/admin/categories/${id}/image`, { method: "POST", body: form });
        const uploaded: { imageUrl?: string; error?: string } = await upload.json();
        if (!upload.ok || !uploaded.imageUrl) { setMessage(uploaded.error ?? "Категорію збережено, але зображення не завантажено."); return; }
        imageUrl = uploaded.imageUrl;
      } else if (removeImage && existing?.imageUrl) {
        const removed = await fetch(`/api/admin/categories/${id}/image`, { method: "DELETE" });
        if (!removed.ok) { setMessage("Категорію збережено, але зображення не видалено."); return; }
        imageUrl = null;
      }
      setCategories((items) => {
        const row: AdminCategoryRow = { id, name: draft.name, slug: draft.slug, description: draft.description, isActive: draft.is_active, imageUrl, sortOrder: payload.sort_order };
        return editing === "new" ? [...items, row] : items.map((item) => item.id === id ? row : item);
      });
      setEditing(null); selectFile(null); setRemoveImage(false);
    } catch { setMessage("Не вдалося з’єднатися із сервером."); }
    finally { setBusy(false); }
  };

  const toggleActive = async (item: AdminCategoryRow) => {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/admin/categories/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: item.name, slug: item.slug, description: item.description, sort_order: item.sortOrder, is_active: !item.isActive }) });
      const result: { error?: string } = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Не вдалося змінити статус."); return; }
      setCategories((rows) => rows.map((row) => row.id === item.id ? { ...row, isActive: !row.isActive } : row));
    } catch { setMessage("Не вдалося з’єднатися із сервером."); }
    finally { setBusy(false); }
  };

  const remove = async (item: AdminCategoryRow) => {
    if (!window.confirm(`Видалити категорію «${item.name}»?`)) return;
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/admin/categories/${item.id}`, { method: "DELETE" });
      const result: { error?: string } = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Не вдалося видалити категорію."); return; }
      setCategories((rows) => rows.filter((row) => row.id !== item.id));
    } catch { setMessage("Не вдалося з’єднатися із сервером."); }
    finally { setBusy(false); }
  };

  const move = async (index: number, delta: number) => {
    const destination = index + delta;
    if (destination < 0 || destination >= categories.length) return;
    const reordered = [...categories]; [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: reordered.map((item) => item.id) }) });
      const result: { error?: string } = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Не вдалося змінити порядок."); return; }
      setCategories(reordered.map((item, sortOrder) => ({ ...item, sortOrder })));
    } catch { setMessage("Не вдалося з’єднатися із сервером."); }
    finally { setBusy(false); }
  };

  return <section className="mt-8">
    {message && <p className="mb-4 rounded-md border border-danger/30 bg-surface p-3 text-sm text-danger" role="alert">{message}</p>}
    <div className="mb-4 flex justify-end"><Button onClick={beginCreate}>Додати категорію</Button></div>
    {editing && <div className="mb-6 rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <h2 className="text-lg font-medium">{editing === "new" ? "Нова категорія" : "Редагувати категорію"}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">Назва<input value={draft.name} onChange={(e) => { const name = e.target.value; setDraft((d) => ({ ...d, name, ...(!slugEdited ? { slug: slugify(name) } : {}) })); }} maxLength={120} className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-sm outline-none focus:border-focus" /></label>
        <label className="grid gap-1.5 text-sm">Посилання<input value={draft.slug} onChange={(e) => { setSlugEdited(true); setDraft((d) => ({ ...d, slug: slugify(e.target.value) })); }} maxLength={160} className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-sm outline-none focus:border-focus" /></label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">Опис<textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} maxLength={2000} rows={3} className="min-h-28 resize-y rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-3 text-sm outline-none focus:border-focus" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))} />Активна в каталозі</label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><ImagePlus size={18} />{file?.name ?? "Завантажити фото (до 10 МБ)"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => { selectFile(e.target.files?.[0] ?? null); setRemoveImage(false); }} /></label>
      </div>
      <p className="mt-3 text-xs text-muted">Це фото показуватиметься на картці категорії в каталозі.</p>
      {(filePreview || (!removeImage && editing !== "new" && categories.find((item) => item.id === editing)?.imageUrl)) && <div className="relative mt-3 aspect-[2/1] max-w-sm overflow-hidden rounded-md border border-border bg-surface-muted"><Image src={filePreview ?? categories.find((item) => item.id === editing)?.imageUrl ?? ""} alt={`Фото категорії ${draft.name || ""}`} fill unoptimized={Boolean(filePreview)} sizes="(max-width: 640px) 100vw, 384px" className="object-cover" /></div>}
      {editing !== "new" && categories.find((item) => item.id === editing)?.imageUrl && <button type="button" className="mt-3 text-sm text-danger underline" onClick={() => { setRemoveImage(true); setFile(null); }}>Видалити поточне фото</button>}
      <div className="mt-5 flex gap-3"><Button disabled={busy} onClick={() => void save()}>{busy ? "Збереження…" : "Зберегти"}</Button><Button variant="secondary" disabled={busy} onClick={() => { setEditing(null); selectFile(null); }}>Скасувати</Button></div>
    </div>}
    {categories.length === 0 ? <p className="rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center text-sm text-muted">Категорій поки немає.</p> : <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">{categories.map((item, index) => <li key={item.id} className="flex flex-wrap items-center gap-4 p-4">
      <div className="size-16 shrink-0 rounded-md bg-surface-muted bg-cover bg-center" role={item.imageUrl ? "img" : undefined} aria-label={item.imageUrl ? item.name : undefined} style={item.imageUrl ? { backgroundImage: `url("${item.imageUrl}")` } : undefined} />
      <div className="min-w-40 flex-1"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted">/{item.slug} · {item.isActive ? "Активна" : "Вимкнена"}</p></div>
      <div className="flex items-center gap-1"><button type="button" aria-label={`Підняти ${item.name}`} disabled={busy || index === 0} onClick={() => void move(index, -1)} className="grid size-9 place-items-center rounded-full hover:bg-surface-muted disabled:opacity-30"><ArrowUp size={16} /></button><button type="button" aria-label={`Опустити ${item.name}`} disabled={busy || index === categories.length - 1} onClick={() => void move(index, 1)} className="grid size-9 place-items-center rounded-full hover:bg-surface-muted disabled:opacity-30"><ArrowDown size={16} /></button></div>
      <button type="button" onClick={() => beginEdit(item)} aria-label={`Редагувати ${item.name}`} className="grid size-9 place-items-center rounded-full hover:bg-surface-muted"><Pencil size={16} /></button>
      <button type="button" onClick={() => void toggleActive(item)} disabled={busy} className="text-xs underline disabled:opacity-50">{item.isActive ? "Вимкнути" : "Увімкнути"}</button>
      <button type="button" onClick={() => void remove(item)} disabled={busy} aria-label={`Видалити ${item.name}`} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger disabled:opacity-50"><Trash2 size={16} /></button>
    </li>)}</ul>}
  </section>;
}
