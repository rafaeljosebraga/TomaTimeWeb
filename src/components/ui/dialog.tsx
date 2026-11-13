import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DialogDragCloseContext = React.createContext<(() => void) | null>(null);
const DialogOpenContext = React.createContext(true);

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const closeDialog = React.useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  return (
    <DialogOpenContext.Provider value={open}>
      <DialogDragCloseContext.Provider value={closeDialog}>
        <DialogPrimitive.Root
          open={open}
          onOpenChange={handleOpenChange}
          {...props}
        />
      </DialogDragCloseContext.Provider>
    </DialogOpenContext.Provider>
  );
}
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs dialog-overlay-animate",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
    handleCloseOnDrag?: boolean;
    mobilePresentation?: "sheet" | "modal";
  }
>(({ className, children, showClose = false, handleCloseOnDrag = true, mobilePresentation = "sheet", style, ...props }, ref) => {
  const closeDialog = React.useContext(DialogDragCloseContext);
  const isDialogOpen = React.useContext(DialogOpenContext);
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [hasDragged, setHasDragged] = React.useState(false);
  const [sheetMotionState, setSheetMotionState] = React.useState<
    "entering" | "open" | "closing"
  >(isDialogOpen ? "entering" : "closing");
  const dragStartYRef = React.useRef<number | null>(null);
  const dragOffsetYRef = React.useRef(0);
  const didDragRef = React.useRef(false);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const mouseCleanupRef = React.useRef<(() => void) | null>(null);
  const resetDidDragTimeoutRef = React.useRef<number | null>(null);
  const fallbackResetTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (mobilePresentation !== "sheet") return;

    if (!isDialogOpen) {
      setSheetMotionState("closing");
      return;
    }

    setSheetMotionState("entering");
    const frameId = window.requestAnimationFrame(() => {
      setSheetMotionState("open");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isDialogOpen, mobilePresentation]);

  React.useEffect(() => {
    return () => {
      mouseCleanupRef.current?.();
      if (resetDidDragTimeoutRef.current !== null) {
        window.clearTimeout(resetDidDragTimeoutRef.current);
      }
      if (fallbackResetTimeoutRef.current !== null) {
        window.clearTimeout(fallbackResetTimeoutRef.current);
      }
    };
  }, []);

  const updateDragOffset = (offset: number) => {
    dragOffsetYRef.current = offset;
    setDragOffsetY(offset);
  };

  const requestClose = () => {
    if (closeDialog) {
      closeDialog();
    } else {
      closeButtonRef.current?.click();
    }
  };

  const finishDrag = () => {
    setIsDragging(false);
    dragStartYRef.current = null;
    if (resetDidDragTimeoutRef.current !== null) {
      window.clearTimeout(resetDidDragTimeoutRef.current);
    }
    resetDidDragTimeoutRef.current = window.setTimeout(() => {
      didDragRef.current = false;
      resetDidDragTimeoutRef.current = null;
    }, 50);

    if (dragOffsetYRef.current > 80) {
      triggerClose();
    } else {
      updateDragOffset(0);
    }
  };

  const triggerClose = () => {
    if (mobilePresentation === "sheet") {
      setSheetMotionState("closing");
      setTimeout(() => {
        updateDragOffset(0);
        setHasDragged(false);
        requestClose();
      }, 250);
    } else {
      updateDragOffset(0);
      requestClose();
    }
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        style={{
          ...style,
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : style?.transform,
          transition: isDragging
            ? "none"
            : hasDragged
              ? "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)"
              : style?.transition,
        }}
        className={cn(
          "fixed z-50 flex flex-col border border-border bg-background shadow-2xl dialog-content-animate will-change-transform overflow-hidden",
          hasDragged && "dialog-dragged",
          mobilePresentation === "sheet"
            ? "inset-x-0 bottom-0 w-full max-h-[90dvh] rounded-t-3xl border-b-0"
            : "left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl",
          // Desktop: modal centralizado
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:max-h-[85vh] sm:rounded-2xl sm:border",
          className
        )}
        data-mobile-presentation={mobilePresentation}
        data-sheet-motion={mobilePresentation === "sheet" ? sheetMotionState : undefined}
        {...props}
      >
        <DialogPrimitive.Close
          ref={closeButtonRef}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
        {/* Alça visual no topo do bottom sheet mobile: toque fecha, arrastar para baixo fecha */}
        {handleCloseOnDrag && (
          <button
            type="button"
            aria-label="Puxador: arraste para baixo ou toque para fechar"
            title="Fechar"
            onClick={() => {
              if (didDragRef.current) {
                didDragRef.current = false;
                return;
              }
              triggerClose();
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              dragStartYRef.current = touch.clientY;
              didDragRef.current = false;
              setIsDragging(true);
            }}
            onTouchMove={(e) => {
              if (dragStartYRef.current === null) return;
              const touch = e.touches[0];
              if (!touch) return;
              const deltaY = touch.clientY - dragStartYRef.current;
              if (deltaY > 0) {
                if (deltaY > 5) didDragRef.current = true;
                setHasDragged(true);
                updateDragOffset(deltaY);
              } else if (dragOffsetYRef.current > 0) {
                updateDragOffset(0);
              }
            }}
            onTouchEnd={finishDrag}
            onTouchCancel={finishDrag}
            onMouseDown={(e) => {
              dragStartYRef.current = e.clientY;
              didDragRef.current = false;
              setIsDragging(true);

              const handleMouseMove = (moveEvent: MouseEvent) => {
                if (dragStartYRef.current === null) return;
                const deltaY = moveEvent.clientY - dragStartYRef.current;
                if (deltaY > 0) {
                  if (deltaY > 5) didDragRef.current = true;
                  setHasDragged(true);
                  updateDragOffset(deltaY);
                } else if (dragOffsetYRef.current > 0) {
                  updateDragOffset(0);
                }
              };

              const handleMouseUp = () => {
                cleanup();
                finishDrag();
              };

              const cleanup = () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
                mouseCleanupRef.current = null;
              };

              mouseCleanupRef.current?.();
              mouseCleanupRef.current = cleanup;
              window.addEventListener("mousemove", handleMouseMove);
              window.addEventListener("mouseup", handleMouseUp);
            }}
            className="sm:hidden shrink-0 flex h-7 w-full items-center justify-center cursor-pointer touch-none select-none group border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30 transition-all group-hover:bg-muted-foreground/60 group-hover:w-14" />
          </button>
        )}
        {/* Área de conteúdo scrollável */}
        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 pb-6 sm:p-6 sm:gap-5 custom-scrollbar">
          {children}
        </div>
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
            <X className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2",
        className
      )}
      {...props}
    />
  );
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
