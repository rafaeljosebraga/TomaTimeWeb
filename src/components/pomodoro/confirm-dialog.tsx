import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmActionType = "resetCycles" | "endSession" | "discardResumedSession";

export interface ConfirmAction {
  type: ConfirmActionType;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
}

interface ConfirmDialogProps {
  action: ConfirmAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  action,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isOpen = action !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <div className={`flex items-center gap-2 ${action?.isDestructive ? "text-destructive" : "text-primary"}`}>
            <AlertTriangle className="size-5 shrink-0" />
            <DialogTitle>{action?.title ?? "Confirmar Ação"}</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            {action?.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={action?.isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {action?.confirmLabel ?? "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
