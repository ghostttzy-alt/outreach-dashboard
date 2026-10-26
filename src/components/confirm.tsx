"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Modal } from "./ui";

type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; danger?: boolean };
const ConfirmContext = createContext<(opts: ConfirmOptions) => Promise<boolean>>(async () => false);

/** `const confirm = useConfirm(); if (await confirm({...})) ...` — every delete goes through this. */
export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onClose={() => close(false)} title={opts?.title ?? ""} size="sm">
        <div className="flex gap-3">
          {opts?.danger !== false && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="size-4 text-red-500" />
            </div>
          )}
          <p className="text-sm text-muted">{opts?.message ?? "This can't be undone."}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant={opts?.danger === false ? "primary" : "danger"} onClick={() => close(true)} autoFocus>
            {opts?.confirmLabel ?? "Delete"}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
