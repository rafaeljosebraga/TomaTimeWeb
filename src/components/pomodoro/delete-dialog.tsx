import * as DialogPrimitive from "@radix-ui/react-dialog";
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

type PendingDelete = {
  type: "preset" | "task";
  id: string;
  name: string;
};

interface DeleteDialogProps {
  pendingDelete: PendingDelete | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDialog({
  pendingDelete,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  const isOpen = pendingDelete !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="gap-2.5">
          <div className="flex items-center gap-2.5 text-red-500 dark:text-red-400">
            <div className="flex size-9 items-center justify-center rounded-full bg-red-500/15 dark:bg-red-500/20 text-red-500 dark:text-red-400">
              <AlertTriangle className="size-5 shrink-0" />
            </div>
            <DialogTitle className="text-lg font-bold">Confirmar Exclusão</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Tem certeza de que deseja excluir permanentemente {pendingDelete?.type === "preset" ? "o preset" : "a tarefa"}{" "}
            <strong className="text-foreground">"{pendingDelete?.name}"</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row-reverse sm:justify-start">
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto h-11 rounded-full font-bold shadow-md"
            onClick={onConfirm}
          >
            Confirmar Exclusão
          </Button>
          <DialogPrimitive.Close asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-11 rounded-full font-medium"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </DialogPrimitive.Close>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
