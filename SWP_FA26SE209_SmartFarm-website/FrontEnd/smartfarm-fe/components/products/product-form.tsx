"use client";
import { useState } from "react";
import { Package, Upload, SquarePen } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProducts } from "./products-provider";
import {
  categories,
  statuses,
  validateProduct,
  type Product,
  type Batch,
  type ProductDraft,
  type ProductErrors,
  type ProductStatus,
} from "@/lib/products";
import { date } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Product detail view (read-only mode)
// ---------------------------------------------------------------------------
function ProductDetail({
  product,
  batches,
  onEdit,
  onToggleStatus,
}: {
  product: Product;
  batches: Batch[];
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const productBatches = batches.filter((b) => b.productId === product.id);
  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="flex items-start gap-4 rounded-xl border bg-[#F7FAF8] p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <Package className="size-5" strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{product.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Gói {product.weight} g ·{" "}
            {new Intl.NumberFormat("vi-VN").format(product.price)} ₫
          </p>
          <Badge
            variant="outline"
            className={
              "mt-2 px-2.5 py-1 text-[11px] font-medium " +
              (product.status === "Đang bán"
                ? "status-green"
                : product.status === "Hết hàng"
                  ? "status-red"
                  : "border-0 bg-slate-100 text-muted-foreground")
            }
          >
            {product.status}
          </Badge>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            value: product.actualStock + " gói",
            label: "Tồn thực tế",
            color: "",
          },
          {
            value: product.reserved + " gói",
            label: "Đã giữ cho đơn",
            color: "text-blue-600",
          },
          {
            value: product.available + " gói",
            label: "Khả dụng",
            color: "text-primary",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 text-center">
            <p className={"text-lg font-bold tabular-nums " + s.color}>
              {s.value}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Detail fields */}
      <div className="space-y-4">
        {[
          { label: "Mã sản phẩm", value: product.code },
          { label: "Loại hạt giống", value: product.category },
          { label: "Mô tả", value: product.description || "—" },
          {
            label: "Hướng dẫn bảo quản",
            value: product.storageInstruction || "—",
          },
        ].map((f) => (
          <div key={f.label}>
            <p className="text-[11px] font-medium text-muted-foreground">
              {f.label}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Batches */}
      {productBatches.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-semibold tracking-[.14em] text-muted-foreground uppercase">
            Tồn kho theo lô nhập
          </h3>
          {productBatches.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border bg-[#F7FAF8] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-primary">{b.id}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Nhập {date(b.importDate)} · HSD {date(b.expiryDate)}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {b.quantity} gói
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 border-t pt-5">
        <Button variant="outline" onClick={onToggleStatus} className="gap-2">
          {product.status === "Đang bán" ? "Tạm ngừng bán" : "Mở bán lại"}
        </Button>
        <Button onClick={onEdit} className="gap-2">
          <SquarePen className="size-4" />
          Chỉnh sửa
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product form (create / edit)
// ---------------------------------------------------------------------------
function ProductForm({
  draft,
  setDraft,
  errors,
}: {
  draft: ProductDraft;
  setDraft: (d: ProductDraft) => void;
  errors: ProductErrors;
}) {
  return (
    <form id="product-form" noValidate className="space-y-5">
      {/* Image upload placeholder */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Hình ảnh</label>
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-[#F7FAF8] p-6 transition hover:border-primary/50">
          <Upload className="size-6 text-primary" strokeWidth={1.5} />
          <p className="text-sm font-medium text-primary">
            Nhấp để tải ảnh lên
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG tối đa 5 MB
          </p>
        </div>
      </div>

      {/* Product name */}
      <div className="space-y-1.5">
        <label htmlFor="prod-name" className="text-sm font-medium">
          Tên sản phẩm <span className="text-destructive">*</span>
        </label>
        <Input
          id="prod-name"
          aria-invalid={!!errors.name}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="VD: Hạt giống cải xanh"
        />
        {errors.name && (
          <p role="alert" className="text-xs text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      {/* Product code */}
      <div className="space-y-1.5">
        <label htmlFor="prod-code" className="text-sm font-medium">
          Mã sản phẩm <span className="text-destructive">*</span>
        </label>
        <Input
          id="prod-code"
          aria-invalid={!!errors.code}
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value })}
          placeholder="VD: SP-006"
        />
        {errors.code && (
          <p role="alert" className="text-xs text-destructive">
            {errors.code}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Loại hạt giống</label>
        <Select
          value={draft.category || "_"}
          onValueChange={(v) =>
            setDraft({ ...draft, category: v === "_" ? "" : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn loại hạt giống" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">Chọn loại hạt giống</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="prod-desc" className="text-sm font-medium">
          Mô tả
        </label>
        <Textarea
          id="prod-desc"
          rows={3}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Mô tả sản phẩm..."
          className="resize-none"
        />
      </div>

      {/* Weight + Price — 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="prod-weight" className="text-sm font-medium">
            Khối lượng đóng gói (g)
          </label>
          <Input
            id="prod-weight"
            type="number"
            min={1}
            aria-invalid={!!errors.weight}
            value={Number.isNaN(draft.weight) ? "" : draft.weight}
            onChange={(e) =>
              setDraft({
                ...draft,
                weight:
                  e.target.value === "" ? NaN : Number(e.target.value),
              })
            }
            placeholder="100"
          />
          {errors.weight && (
            <p role="alert" className="text-xs text-destructive">
              {errors.weight}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="prod-price" className="text-sm font-medium">
            Giá bán (₫)
          </label>
          <Input
            id="prod-price"
            type="number"
            min={1}
            aria-invalid={!!errors.price}
            value={Number.isNaN(draft.price) ? "" : draft.price}
            onChange={(e) =>
              setDraft({
                ...draft,
                price:
                  e.target.value === "" ? NaN : Number(e.target.value),
              })
            }
            placeholder="25000"
          />
          {errors.price && (
            <p role="alert" className="text-xs text-destructive">
              {errors.price}
            </p>
          )}
        </div>
      </div>

      {/* Storage instruction */}
      <div className="space-y-1.5">
        <label htmlFor="prod-storage" className="text-sm font-medium">
          Hướng dẫn bảo quản
        </label>
        <Textarea
          id="prod-storage"
          rows={2}
          value={draft.storageInstruction}
          onChange={(e) =>
            setDraft({ ...draft, storageInstruction: e.target.value })
          }
          placeholder="VD: Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp..."
          className="resize-none"
        />
      </div>

      {/* Selling status */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Trạng thái bán hàng</label>
        <Select
          value={draft.status}
          onValueChange={(v) =>
            setDraft({ ...draft, status: v as ProductStatus })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {errors.form && (
        <p role="alert" className="text-xs text-destructive">
          {errors.form}
        </p>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main panel (Sheet)
// ---------------------------------------------------------------------------
export function ProductPanel({
  product,
  onClose,
  initialMode,
  returnFocus,
}: {
  product?: Product;
  onClose: () => void;
  initialMode: "create" | "view" | "edit";
  returnFocus: () => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [discard, setDiscard] = useState(false);
  const { products, batches, save, updateStatus } = useProducts();
  const [draft, setDraft] = useState<ProductDraft>(
    product
      ? {
          name: product.name,
          code: product.code,
          category: product.category,
          description: product.description,
          weight: product.weight,
          price: product.price,
          storageInstruction: product.storageInstruction,
          status: product.status,
        }
      : {
          name: "",
          code: "",
          category: "",
          description: "",
          weight: 100,
          price: 25000,
          storageInstruction: "",
          status: "Đang bán",
        },
  );
  const [errors, setErrors] = useState<ProductErrors>({});

  const initial = product
    ? {
        name: product.name,
        code: product.code,
        category: product.category,
        description: product.description,
        weight: product.weight,
        price: product.price,
        storageInstruction: product.storageInstruction,
        status: product.status,
      }
    : null;

  const dirty =
    mode !== "view" &&
    initial !== null &&
    (Object.keys(draft) as (keyof ProductDraft)[]).some(
      (key) => draft[key] !== initial[key],
    );

  // For create mode, check if any field is filled
  const dirtyCreate =
    mode !== "view" &&
    initial === null &&
    (draft.name.trim() !== "" || draft.code.trim() !== "");

  function close() {
    setDiscard(false);
    onClose();
  }

  function requestClose() {
    if (dirty || dirtyCreate) setDiscard(true);
    else close();
  }

  function submit() {
    const result = validateProduct(draft, products, product?.id);
    setErrors(result);
    if (Object.keys(result).length) return;
    const saveResult = save(draft, product?.id);
    setErrors(saveResult);
    if (!Object.keys(saveResult).length) close();
  }

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && requestClose()}>
        <SheetContent
          side="right"
          className="h-dvh gap-0 overflow-hidden! bg-white"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus();
          }}
          onEscapeKeyDown={(event) => {
            if (discard) event.preventDefault();
          }}
        >
          <SheetHeader className="shrink-0 border-b px-6 py-6 pr-12">
            <SheetTitle>
              {mode === "view"
                ? product?.name
                : product
                  ? "Chỉnh sửa sản phẩm"
                  : "Thêm sản phẩm"}
            </SheetTitle>
            {mode !== "view" && (
              <SheetDescription>
                {product
                  ? "Cập nhật thông tin sản phẩm hạt giống."
                  : "Điền thông tin sản phẩm hạt giống mới để thêm vào danh mục."}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {mode === "view" && product ? (
              <ProductDetail
                product={product}
                batches={batches}
                onEdit={() => setMode("edit")}
                onToggleStatus={() => {
                  updateStatus(
                    product.id,
                    product.status === "Đang bán" ? "Tạm ngừng" : "Đang bán",
                  );
                  close();
                }}
              />
            ) : (
              <ProductForm
                draft={draft}
                setDraft={setDraft}
                errors={errors}
              />
            )}
          </div>

          {mode !== "view" && (
            <SheetFooter className="shrink-0 flex-row justify-end border-t px-6 py-4">
              <Button variant="outline" type="button" onClick={requestClose}>
                Hủy
              </Button>
              <Button type="button" onClick={submit}>
                {product ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent className="rounded-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>
              Các thay đổi chưa lưu sẽ bị mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction onClick={close}>
              Bỏ thay đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
