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
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="gap-2.5">
          <div className={`flex items-center gap-2.5 ${action?.isDestructive ? "text-red-500 dark:text-red-400" : "text-primary"}`}>
            <div className={`flex size-9 items-center justify-center rounded-full ${action?.isDestructive ? "bg-red-500/15 dark:bg-red-500/20 text-red-500 dark:text-red-400" : "bg-primary/10 text-primary"}`}>
              <AlertTriangle className="size-5 shrink-0" />
            </div>
            <DialogTitle className="text-lg font-bold">{action?.title ?? "Confirmar Ação"}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {action?.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row-reverse sm:justify-start">
          <Button
            type="button"
            variant={action?.isDestructive ? "destructive" : "default"}
            className="w-full sm:w-auto h-11 rounded-full font-bold shadow-md"
            onClick={onConfirm}
          >
            {action?.confirmLabel ?? "Confirmar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto h-11 rounded-full font-medium"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

