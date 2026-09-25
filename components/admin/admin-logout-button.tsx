"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminAuthApi } from "@/lib/api/admin";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const logout = async () => {
    if (pending) return;
    setPending(true);
    try {
      await adminAuthApi.logout();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error ? (
        <span className="text-xs text-danger" role="alert">
          Не вдалося вийти
        </span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={pending}
        loadingLabel="Вихід"
        onClick={logout}
      >
        {!pending ? <LogOut size={15} aria-hidden="true" /> : null}
        Вийти
      </Button>
    </div>
  );
}
