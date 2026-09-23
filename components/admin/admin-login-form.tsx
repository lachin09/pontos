"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminLoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Не вдалося увійти. Перевірте дані.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Не вдалося з’єднатися із сервером. Спробуйте ще раз.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="mt-6 grid gap-5" onSubmit={submit}>
      <Input
        id="admin-email"
        name="email"
        type="email"
        label="Електронна пошта"
        autoComplete="username"
        required
        maxLength={254}
      />
      <Input
        id="admin-password"
        name="password"
        type="password"
        label="Пароль"
        autoComplete="current-password"
        required
        maxLength={128}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        loading={pending}
        loadingLabel="Перевіряємо доступ"
        className="w-full"
      >
        Увійти
      </Button>
    </form>
  );
}
