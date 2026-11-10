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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5 shrink-0" />
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Tem certeza de que deseja excluir permanentemente o{" "}
            {pendingDelete?.type === "preset" ? "preset" : "tarefa"}{" "}
            <strong>"{pendingDelete?.name}"</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
