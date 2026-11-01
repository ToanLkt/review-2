"use client";

import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";

import {
  getAuthErrorMessage,
  getDeliveryAcceptanceError,
  publicFarmService,
  rentalCartService,
  rentalService,
  seedService,
  type CustomerFarmArea,
  type RentalCart,
  type SeedVariety,
} from "@/lib/api";
import {
  areDraftSchedulesValid,
  canAdvanceRentalStep,
  canStartRentalAction,
  createTrayDraft,
  deliveryDateFromPlanting,
  exceedsAvailableCapacity,
  hasUnselectedTray,
  isOptionalDateInRange,
  plantingDateFromDelivery,
  remainingDraftCapacity,
  resizeTrayDrafts,
  synchronizeDraftDates,
  toBackendDateOnly,
  type TrayDraft,
} from "@/lib/rental-drafts";
import { formatVnd } from "@/lib/user-format";
import { rememberRentalRiskConsent } from "@/lib/rental-risk-consent";
import { normalizeSeedRiskDescription } from "@/lib/seed-risk";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalDatePicker } from "@/components/ui/local-date-picker";
import { DeliveryAddressPicker } from "@/components/delivery/delivery-address-picker";
import { clearDeliveryAddressDraft, useDeliveryAddressDraft } from "@/lib/delivery-address";
import styles from "./rental-wizard.module.css";

const manrope = Manrope({ subsets: ["latin", "vietnamese"] });

const steps = [
  { title: "Bạn muốn thuê bao nhiêu khay?", shortTitle: "Số lượng" },
  { title: "Chọn giống cho từng khay", shortTitle: "Giống rau" },
  { title: "Chọn lịch gieo trồng", shortTitle: "Lịch trồng" },
  { title: "Địa chỉ và xác nhận", shortTitle: "Giao hàng" },
  { title: "Kiểm tra đơn thuê", shortTitle: "Kiểm tra đơn thuê" },
] as const;

const fieldClass = "mt-2 h-12 w-full rounded-2xl bg-[#f5f3eb] px-4 text-sm text-[#19382b] outline-none ring-1 ring-[#d9dfd7] transition focus:ring-2 focus:ring-[#4f8f68]";
const primaryButtonClass = "inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#19382b] px-5 text-sm font-bold text-white transition hover:bg-[#10291f] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButtonClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e1eadf] px-5 text-sm font-bold text-[#19382b] transition hover:bg-[#d4e1d1] disabled:cursor-not-allowed disabled:opacity-45";

function dateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ActionArrow() {
  return <span className="grid size-8 place-items-center rounded-full bg-[#f3e89a] text-[#19382b]"><ArrowRight size={16} /></span>;
}

function Notice({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" | "danger" }) {
  const tones = {
    neutral: "bg-[#eaf0e8] text-[#365b46]",
    warning: "bg-[#fff6d9] text-[#795f17]",
    danger: "bg-[#fce8e5] text-[#a13c32]",
  };
  return <div role={tone === "danger" ? "alert" : undefined} className={`rounded-2xl px-4 py-3 text-sm leading-6 ${tones[tone]}`}>{children}</div>;
}

export function RentalConfigurator({ compact = false, initialSeedId }: { compact?: boolean; initialSeedId?: string }) {
  const router = useRouter();
  const nextDraftId = useRef(1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestInFlightRef = useRef(false);
  const initialSeedAppliedRef = useRef(false);

  const [step, setStep] = useState(1);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [seeds, setSeeds] = useState<SeedVariety[]>([]);
  const [farmAreas, setFarmAreas] = useState<CustomerFarmArea[]>([]);
  const [drafts, setDrafts] = useState<TrayDraft[]>(() => [createTrayDraft("tray-draft-1")]);
  const [available, setAvailable] = useState<number | null>(null);
  const [cart, setCart] = useState<RentalCart | null>(null);
  const [maxPreOrderDays, setMaxPreOrderDays] = useState<number | null>(null);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [riskDialogSeedId, setRiskDialogSeedId] = useState<number | "all" | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [creatingDirect, setCreatingDirect] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [capacityError, setCapacityError] = useState("");
  const [capacityWarning, setCapacityWarning] = useState("");
  const [seedError, setSeedError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [areaError, setAreaError] = useState("");
  const [stepError, setStepError] = useState("");
  const [actionError, setActionError] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const { value: deliveryAddress, setValue: setDeliveryAddress, preview: deliveryPreview, setPreview: setDeliveryPreview, isAccepted: deliveryAccepted, setIsAccepted: setDeliveryAccepted } = useDeliveryAddressDraft();

  function createDraftId() {
    nextDraftId.current += 1;
    return `tray-draft-${nextDraftId.current}`;
  }

  useEffect(() => {
    let active = true;

    void Promise.allSettled([
      seedService.getSeedVarieties({ page: 1, pageSize: 100 }),
      seedService.getAvailableTrayCount(),
      rentalCartService.getCart(),
      publicFarmService.getFarmAreas(),
      publicFarmService.getInfo(),
    ]).then(([seedResult, countResult, cartResult, trayResult, farmResult]) => {
      if (!active) return;

      if (seedResult.status === "fulfilled") {
        setSeeds(seedResult.value.items);
        const requestedId = Number(initialSeedId);
        if (!initialSeedAppliedRef.current && Number.isInteger(requestedId) && seedResult.value.items.some((seed) => seed.seedVarietyId === requestedId)) {
          setDrafts((current) => current.map((draft, index) => index === 0 ? { ...draft, seedVarietyId: requestedId } : draft));
          initialSeedAppliedRef.current = true;
        }
      } else {
        setSeeds([]);
        setSeedError(getAuthErrorMessage(seedResult.reason, "Không thể tải danh sách giống cây."));
      }

      if (countResult.status === "fulfilled" && cartResult.status === "fulfilled") {
        setAvailable(countResult.value.available);
        setCart(cartResult.value);
      } else {
        setAvailable(null);
        if (cartResult.status === "rejected") setCart(null);
        const reason = countResult.status === "rejected" ? countResult.reason : cartResult.status === "rejected" ? cartResult.reason : null;
        setCapacityError(getAuthErrorMessage(reason, "Không thể tải số khay còn trống. Vui lòng thử lại."));
      }

      if (trayResult.status === "fulfilled") {
        setFarmAreas(trayResult.value);
      } else {
        setFarmAreas([]);
        setAreaError("Không thể tải danh sách khu trồng. Bạn vẫn có thể để SmartFarm sắp xếp giúp.");
      }

      if (farmResult.status === "fulfilled") {
        setMaxPreOrderDays(farmResult.value.maxPreOrderDays);
      } else {
        setMaxPreOrderDays(null);
        setScheduleError("Không thể tải lịch có thể chọn. Vui lòng thử lại trước khi tiếp tục.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [initialSeedId, reloadVersion]);

  useEffect(() => {
    if (!loading) headingRef.current?.focus();
  }, [loading, step]);

  const seedById = useMemo(() => new Map(seeds.map((seed) => [seed.seedVarietyId, seed])), [seeds]);
  const selectedSeeds = useMemo(() => {
    const ids = new Set(drafts.flatMap((draft) => draft.seedVarietyId === null ? [] : [draft.seedVarietyId]));
    return Array.from(ids).flatMap((id) => {
      const seed = seedById.get(id);
      return seed ? [seed] : [];
    });
  }, [drafts, seedById]);
  const selectedRiskSeeds = useMemo(
    () => selectedSeeds.filter((seed) => normalizeSeedRiskDescription(seed.riskDescription)),
    [selectedSeeds],
  );
  const riskDialogSeeds = riskDialogSeedId === "all"
    ? selectedRiskSeeds
    : selectedRiskSeeds.filter((seed) => seed.seedVarietyId === riskDialogSeedId);

  const cartItemCount = cart?.itemCount ?? 0;
  const draftCapacity = remainingDraftCapacity(available, cartItemCount);
  const areaOverCapacity = useMemo(() => farmAreas.some((area) => {
    const inCart = (cart?.items ?? []).filter((item) => item.farmAreaId === area.farmAreaId).reduce((total, item) => total + item.quantity, 0);
    const inDrafts = drafts.filter((draft) => draft.farmAreaId === area.farmAreaId).length;
    return inCart + inDrafts > area.availableTrays;
  }), [cart, drafts, farmAreas]);
  const overCapacity = exceedsAvailableCapacity(available, cartItemCount, drafts.length) || areaOverCapacity;
  const hasMissingSeed = hasUnselectedTray(drafts);
  const hasCapacity = available !== null && available > 0;
  const capacityReady = available !== null && cart !== null && !capacityError;
  const today = new Date();
  const minDate = dateInputValue(today);
  const latest = new Date(today);
  if (maxPreOrderDays !== null) latest.setDate(latest.getDate() + maxPreOrderDays);
  const maxDate = maxPreOrderDays === null ? null : dateInputValue(latest);
  const schedulesValid = areDraftSchedulesValid(drafts, minDate, maxDate);
  const validation = {
    capacityReady,
    hasCapacity,
    overCapacity,
    hasMissingSeed: hasMissingSeed || seeds.length === 0 || Boolean(seedError),
    scheduleReady: maxPreOrderDays !== null && !scheduleError,
    schedulesValid,
    riskAccepted,
  };
  const deliveryReady = Boolean(deliveryAddress.address.trim()
    && deliveryAddress.latitude !== null
    && deliveryAddress.longitude !== null
    && deliveryPreview
    && (!deliveryPreview.requiresAcceptance || deliveryAccepted));
  const canContinue = canAdvanceRentalStep(step, validation) && (step !== 4 || deliveryReady);
  const finalConfigurationValid = [1, 2, 3, 4].every((currentStep) => canAdvanceRentalStep(currentStep, validation)) && deliveryReady;
  const actionPending = adding || creatingDirect;
  const draftSubtotal = drafts.reduce((total, draft) => {
    const seed = draft.seedVarietyId === null ? null : seedById.get(draft.seedVarietyId);
    return total + (seed?.rentalPricePerTray ?? 0) * draft.totalCycles;
  }, 0);

  function updateDraft(clientId: string, update: Partial<TrayDraft>) {
    setDrafts((current) => current.map((draft) => draft.clientId === clientId ? { ...draft, ...update } : draft));
    if ("seedVarietyId" in update) setRiskAccepted(false);
    setStepError("");
    setActionError("");
  }

  function changeSeed(clientId: string, seedVarietyId: number | null) {
    const growthDays = seedVarietyId === null ? null : seedById.get(seedVarietyId)?.growthDays;
    setDrafts((current) => current.map((draft) => {
      if (draft.clientId !== clientId) return draft;
      const next = { ...draft, seedVarietyId };
      return growthDays === null || growthDays === undefined ? next : synchronizeDraftDates(next, growthDays);
    }));
    setRiskAccepted(false);
    setStepError("");
    setActionError("");
  }

  function changePlantingDate(clientId: string, value: string, growthDays: number) {
    updateDraft(clientId, {
      targetPlantingDate: value,
      targetDeliveryDate: value ? deliveryDateFromPlanting(value, growthDays) : "",
      dateSource: value ? "planting" : null,
    });
  }

  function changeDeliveryDate(clientId: string, value: string, growthDays: number) {
    updateDraft(clientId, {
      targetDeliveryDate: value,
      targetPlantingDate: value ? plantingDateFromDelivery(value, growthDays) : "",
      dateSource: value ? "delivery" : null,
    });
  }

  function changeCycles(clientId: string, totalCycles: number, growthDays: number) {
    setDrafts((current) => current.map((draft) => draft.clientId === clientId
      ? synchronizeDraftDates({ ...draft, totalCycles }, growthDays)
      : draft));
    setStepError("");
    setActionError("");
  }

  function changeQuantity(nextQuantity: number) {
    if (actionPending || draftCapacity === null || draftCapacity <= 0) return;
    if (nextQuantity > draftCapacity) {
      setCapacityWarning(`Hiện chỉ còn ${draftCapacity} khay khả dụng để thêm. Vui lòng chọn số lượng phù hợp.`);
      return;
    }
    setDrafts((current) => resizeTrayDrafts(current, Math.max(1, nextQuantity), createDraftId));
    setCapacityWarning("");
    setRiskAccepted(false);
    setStepError("");
  }

  function retryLoading() {
    setLoading(true);
    setCapacityError("");
    setCapacityWarning("");
    setSeedError("");
    setScheduleError("");
    setAreaError("");
    setReloadVersion((value) => value + 1);
  }

  function goNext() {
    setStepError("");
    if (!canContinue) {
      const messages: Record<number, string> = {
        1: capacityError || "Số lượng khay chưa phù hợp với sức chứa hiện tại.",
        2: seedError || "Vui lòng chọn giống cho tất cả khay.",
        3: scheduleError || "Vui lòng kiểm tra ngày gieo và số đợt trồng.",
        4: !riskAccepted ? "Bạn cần xác nhận đã đọc rủi ro gieo trồng trước khi tiếp tục." : "Vui lòng nhập địa chỉ, đặt ghim, kiểm tra phạm vi và xác nhận giao ngoài bán kính nếu được yêu cầu.",
      };
      setStepError(messages[step]);
      return;
    }
    setStep((current) => Math.min(5, current + 1));
  }

  function goBack() {
    if (actionPending) return;
    setStepError("");
    setActionError("");
    setStep((current) => Math.max(1, current - 1));
  }

  async function refreshCapacityAndCart(): Promise<[number, RentalCart]> {
    const [count, currentCart] = await Promise.all([seedService.getAvailableTrayCount(), rentalCartService.getCart()]);
    setAvailable(count.available);
    setCart(currentCart);
    return [count.available, currentCart];
  }

  async function addAllToRentalCart() {
    if (!canStartRentalAction(step, finalConfigurationValid, requestInFlightRef.current) || verificationRequired) return;
    requestInFlightRef.current = true;
    setAdding(true);
    setActionError("");
    setProgress({ completed: 0, total: drafts.length });
    try {
      const [freshAvailable, freshCart] = await refreshCapacityAndCart();
      if (freshCart.itemCount + drafts.length > freshAvailable) {
        setActionError("Số khay trong giỏ và số khay đang chọn vượt quá số khay còn trống. Vui lòng quay lại bước 1.");
        return;
      }
      const requests = drafts.map((draft) => ({
        seedVarietyId: draft.seedVarietyId!,
        farmAreaId: draft.farmAreaId,
        totalCycles: draft.totalCycles,
        targetPlantingDate: toBackendDateOnly(draft.targetPlantingDate),
      }));
      const result = await rentalCartService.addItemsSequentially(requests, { initialCart: freshCart, onProgress: setProgress });
      setCart(result.cart);
      if (result.remainingRequests.length === 0) {
        rememberRentalRiskConsent(riskAccepted);
        router.push("/rentals/cart");
        return;
      }
      setDrafts((current) => current.slice(result.addedCount));
      setActionError(`Đã thêm ${result.addedCount}/${requests.length} khay. Các khay còn lại vẫn được giữ để bạn thử lại.`);
      setVerificationRequired(result.synchronizationFailed);
    } catch (requestError) {
      setActionError(getAuthErrorMessage(requestError, "Không thể cập nhật giỏ hàng. Vui lòng thử lại."));
    } finally {
      setAdding(false);
      setProgress({ completed: 0, total: 0 });
      requestInFlightRef.current = false;
    }
  }

  async function createDirectRental() {
    if (!canStartRentalAction(step, finalConfigurationValid, requestInFlightRef.current) || verificationRequired || drafts.length !== 1) return;
    const draft = drafts[0];
    requestInFlightRef.current = true;
    setCreatingDirect(true);
    setActionError("");
    try {
      const order = await rentalService.createRental({
        seedVarietyId: draft.seedVarietyId!,
        farmAreaId: draft.farmAreaId,
        targetPlantingDate: toBackendDateOnly(draft.targetPlantingDate),
        targetDeliveryDate: toBackendDateOnly(draft.targetDeliveryDate),
        isRiskAccepted: riskAccepted,
        totalCycles: draft.totalCycles,
        shippingAddress: deliveryAddress.address.trim(),
        shippingLatitude: deliveryAddress.latitude!,
        shippingLongitude: deliveryAddress.longitude!,
        isAccepted: deliveryPreview?.requiresAcceptance ? deliveryAccepted : false,
      });
      clearDeliveryAddressDraft();
      router.push(`/payment/${order.orderId}`);
    } catch (requestError) {
      const acceptance = getDeliveryAcceptanceError(requestError);
      if (acceptance) {
        setDeliveryAccepted(false);
        setDeliveryPreview((current) => current ? {
          ...current,
          distanceKm: acceptance.distanceKm ?? current.distanceKm,
          isOutOfRange: true,
          requiresAcceptance: true,
        } : current);
        setActionError("Địa chỉ nằm ngoài phạm vi tiêu chuẩn. Vui lòng xác nhận chấp nhận giao ngoài bán kính rồi thử lại.");
      } else {
        setActionError(getAuthErrorMessage(requestError, "Không thể tạo đơn thuê trực tiếp. Vui lòng thử lại."));
      }
    } finally {
      setCreatingDirect(false);
      requestInFlightRef.current = false;
    }
  }

  function renderStepContent() {
    if (step === 1) {
      return <div className={styles.stepEnter} key="step-1">
        <p className="max-w-2xl text-sm leading-6 text-[#617168]">Chọn số khay phù hợp để bắt đầu.</p>
        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#617168]">Số khay muốn thuê</p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full bg-white p-2 ring-1 ring-[#d9dfd7]">
            <button type="button" onClick={() => changeQuantity(drafts.length - 1)} disabled={drafts.length <= 1 || actionPending} aria-label="Giảm số lượng khay" className="grid size-11 place-items-center rounded-full text-[#365b46] transition hover:bg-[#eaf0e8] disabled:opacity-35"><Minus size={18} /></button>
            <span className="min-w-16 text-center text-3xl font-extrabold tabular-nums text-[#19382b]">{drafts.length}</span>
            <button type="button" onClick={() => changeQuantity(drafts.length + 1)} disabled={!capacityReady || draftCapacity === 0 || actionPending} aria-label="Tăng số lượng khay" className="grid size-11 place-items-center rounded-full text-[#365b46] transition hover:bg-[#eaf0e8] disabled:opacity-35"><Plus size={18} /></button>
          </div>
        </div>
        <div className="mt-6">
          {capacityError ? <Notice tone="danger"><span>{capacityError}</span><button type="button" onClick={retryLoading} className="ml-3 inline-flex items-center gap-1 font-bold underline"><RotateCcw size={14} />Thử lại</button></Notice>
            : available === null ? <Notice>Đang kiểm tra số khay còn trống…</Notice>
              : available === 0 ? <Notice tone="danger">Hiện không còn khay trống.</Notice>
                : capacityWarning ? <Notice tone="warning"><span className="inline-flex gap-2"><AlertTriangle size={18} className="mt-0.5 shrink-0" />{capacityWarning}</span></Notice> : null}
          {overCapacity && <div className="mt-3"><Notice tone="warning"><span className="inline-flex gap-2"><AlertTriangle size={18} className="mt-0.5 shrink-0" />Số khay bạn chọn vượt quá số khay còn trống. Vui lòng giảm số lượng.</span></Notice></div>}
        </div>
      </div>;
    }

    if (step === 2) {
      return <div className={styles.stepEnter} key="step-2">
        <p className="max-w-2xl text-sm leading-6 text-[#617168]">Mỗi khay có thể chọn một giống riêng hoặc dùng chung một giống.</p>
        {seedError ? <div className="mt-6"><Notice tone="danger">{seedError}<button type="button" onClick={retryLoading} className="ml-3 font-bold underline">Thử lại</button></Notice></div>
          : seeds.length === 0 ? <div className="mt-6"><Notice tone="warning">Hiện chưa có giống cây khả dụng.</Notice></div>
            : <div className="mt-8 space-y-4">{drafts.map((draft, index) => {
              const selectedSeed = draft.seedVarietyId === null ? null : seedById.get(draft.seedVarietyId) ?? null;
              return <section key={draft.clientId} className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#dfe4dc] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#19382b] text-sm font-extrabold text-[#f3e89a]">{index + 1}</span><div><h2 className="font-extrabold text-[#19382b]">Khay {index + 1}</h2><p className="text-xs text-[#879189]">Chọn từ danh mục giống hiện có</p></div></div>
                  <label className="block w-full text-sm font-bold text-[#365b46] sm:max-w-sm"><span className="sr-only">Giống rau cho khay {index + 1}</span><select value={draft.seedVarietyId ?? ""} onChange={(event) => changeSeed(draft.clientId, event.target.value ? Number(event.target.value) : null)} className={fieldClass}><option value="">Chọn giống rau</option>{seeds.map((seed) => <option key={seed.seedVarietyId} value={seed.seedVarietyId}>{seed.name || `Giống #${seed.seedVarietyId}`}</option>)}</select></label>
                </div>
                {selectedSeed && <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
                  <div><p className="font-bold text-[#19382b]">{selectedSeed.name || `Giống #${selectedSeed.seedVarietyId}`}</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[#617168]">{selectedSeed.description || "Chưa có mô tả cho giống này."}</p></div>
                  <dl className="grid grid-cols-2 gap-x-7 gap-y-2 text-sm md:text-right"><div><dt className="text-xs text-[#879189]">Thời gian sinh trưởng</dt><dd className="mt-1 font-bold text-[#19382b]">{selectedSeed.growthDays} ngày</dd></div><div><dt className="text-xs text-[#879189]">Giá thuê mỗi đợt trồng</dt><dd className="mt-1 font-bold text-[#19382b]">{formatVnd(selectedSeed.rentalPricePerTray)}</dd></div></dl>
                </div>}
              </section>;
            })}</div>}
      </div>;
    }

    if (step === 3) {
      return <div className={styles.stepEnter} key="step-3">
        <p className="max-w-2xl text-sm leading-6 text-[#617168]">Chọn lịch riêng cho từng khay. Ngày nhận dự kiến được tính theo thời gian sinh trưởng của giống.</p>
        {scheduleError && <div className="mt-6"><Notice tone="danger">{scheduleError}<button type="button" onClick={retryLoading} className="ml-3 font-bold underline">Thử lại</button></Notice></div>}
        {areaError && <div className="mt-3"><Notice tone="warning">{areaError}</Notice></div>}
        <div className="mt-8 space-y-4">{drafts.map((draft, index) => {
          const seed = draft.seedVarietyId === null ? null : seedById.get(draft.seedVarietyId) ?? null;
          const growthDays = seed?.growthDays ?? null;
          const deliveryMin = growthDays === null ? undefined : deliveryDateFromPlanting(minDate, growthDays);
          const deliveryMax = growthDays === null || maxDate === null ? undefined : deliveryDateFromPlanting(maxDate, growthDays);
          const plantingDateValid = isOptionalDateInRange(draft.targetPlantingDate, minDate, maxDate);
          const pickerClass = "mt-2 h-12 w-full rounded-2xl border-0 bg-[#f5f3eb] px-4 text-sm text-[#19382b] shadow-none ring-1 ring-[#d9dfd7] transition hover:bg-[#f0eee5] focus-visible:ring-2 focus-visible:ring-[#4f8f68]";

          return <section key={draft.clientId} className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#dfe4dc] sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><CalendarDays size={19} className="shrink-0 text-[#4f8f68]" /><h2 className="font-extrabold text-[#19382b]">Khay {index + 1} · {seed?.name || (draft.seedVarietyId === null ? "Chưa chọn giống" : `Giống #${draft.seedVarietyId}`)}</h2></div>
              {growthDays !== null && <p className="pl-8 text-sm font-semibold text-[#567060] sm:pl-0">Sinh trưởng {growthDays} ngày</p>}
            </div>
            <div className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#365b46]">Khu trồng <span className="font-normal text-[#879189]">(tùy chọn)</span><select value={draft.farmAreaId ?? ""} onChange={(event) => updateDraft(draft.clientId, { farmAreaId: event.target.value ? Number(event.target.value) : null })} className={fieldClass}><option value="">SmartFarm sắp xếp</option>{farmAreas.map((area) => <option key={area.farmAreaId} value={area.farmAreaId} disabled={area.availableTrays <= 0}>{area.name} · còn {area.availableTrays} khay</option>)}</select></label>
              <label className="text-sm font-bold text-[#365b46]">Số đợt trồng<input type="number" min={1} max={100} value={draft.totalCycles} onChange={(event) => { const totalCycles = Math.min(100, Math.max(1, Number(event.target.value) || 1)); if (growthDays === null) updateDraft(draft.clientId, { totalCycles }); else changeCycles(draft.clientId, totalCycles, growthDays); }} className={fieldClass} /></label>
              <div className="text-sm font-bold text-[#365b46]">Ngày gieo <span className="font-normal text-[#879189]">(tùy chọn)</span><LocalDatePicker value={draft.targetPlantingDate} onChange={(value) => { if (growthDays !== null) changePlantingDate(draft.clientId, value, growthDays); }} label={`Chọn ngày gieo cho khay ${index + 1}`} min={minDate} max={maxDate ?? undefined} allowClear className={pickerClass} /></div>
              <div className="text-sm font-bold text-[#365b46]">Ngày nhận rau dự kiến <span className="font-normal text-[#879189]">(tùy chọn)</span><LocalDatePicker value={draft.targetDeliveryDate} onChange={(value) => { if (growthDays !== null) changeDeliveryDate(draft.clientId, value, growthDays); }} label={`Chọn ngày nhận rau cho khay ${index + 1}`} min={deliveryMin} max={deliveryMax} allowClear className={pickerClass} /></div>
            </div>
            {!plantingDateValid && <p role="alert" className="mt-4 rounded-2xl bg-[#fff6d9] px-4 py-3 text-sm leading-6 text-[#795f17]">Ngày nhận đã chọn khiến ngày gieo nằm ngoài khoảng SmartFarm nhận lịch. Vui lòng chọn lại.</p>}
          </section>;
        })}</div>

      </div>;
    }

    if (step === 4) {
      return <div className={styles.stepEnter} key="step-4">
        <p className="max-w-2xl text-sm leading-6 text-[#617168]">Đọc lưu ý của các giống đã chọn trước khi xác nhận.</p>
        <div className="mt-8 space-y-3">{selectedSeeds.map((seed) => {
          const riskDescription = normalizeSeedRiskDescription(seed.riskDescription);
          return <section key={seed.seedVarietyId} className="rounded-[1.75rem] bg-white px-5 py-4 ring-1 ring-[#dfe4dc] sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-extrabold text-[#19382b]">{seed.name || `Giống #${seed.seedVarietyId}`}</h2>
                {riskDescription && <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#795f17]"><AlertTriangle size={15} className="shrink-0" />Có lưu ý riêng cho giống này</p>}
              </div>
              {riskDescription && <button type="button" onClick={() => setRiskDialogSeedId(seed.seedVarietyId)} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-[#e7efe5] px-4 text-sm font-bold text-[#315a43] outline-none transition hover:bg-[#d9e7d7] focus-visible:ring-2 focus-visible:ring-[#4f8f68] focus-visible:ring-offset-2 active:scale-[0.98]">Xem lưu ý khi trồng</button>}
            </div>
          </section>;
        })}</div>
        <div className="mt-7 flex items-start gap-4 rounded-[1.75rem] bg-[#19382b] p-5 text-white sm:p-6">
          <input id="rental-risk-acceptance" type="checkbox" checked={riskAccepted} onChange={(event) => { setRiskAccepted(event.target.checked); setStepError(""); }} className="mt-1 size-5 shrink-0 accent-[#f3e89a]" />
          <div className="min-w-0"><label htmlFor="rental-risk-acceptance" className="cursor-pointer text-base font-extrabold">Tôi đã đọc và chấp nhận rủi ro gieo trồng</label><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-6 text-[#cdd9d1]"><span>Bạn cần xác nhận để tiếp tục đặt thuê.</span>{selectedRiskSeeds.length > 0 && <button type="button" onClick={() => setRiskDialogSeedId("all")} className="font-bold text-[#f3e89a] underline decoration-[#f3e89a]/55 underline-offset-4 outline-none transition hover:text-white focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#f3e89a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#19382b]">Xem chi tiết</button>}</div></div>
        </div>
        <section className="mt-7 rounded-[1.75rem] bg-white p-5 ring-1 ring-[#dfe4dc] sm:p-6"><div className="mb-5"><h2 className="text-lg font-extrabold text-[#19382b]">Địa chỉ nhận hàng</h2><p className="mt-1 text-sm leading-6 text-[#617168]">Địa chỉ và vị trí này được dùng cho thuê trực tiếp hoặc được giữ lại khi bạn chuyển sang giỏ thuê.</p></div><DeliveryAddressPicker value={deliveryAddress} onChange={setDeliveryAddress} preview={deliveryPreview} onPreviewChange={setDeliveryPreview} accepted={deliveryAccepted} onAcceptedChange={setDeliveryAccepted} disabled={actionPending} /></section>

      </div>;
    }

    return <div className={styles.stepEnter} key="step-5">

      <div className="mt-8 space-y-4">{drafts.map((draft, index) => {
        const seed = draft.seedVarietyId === null ? null : seedById.get(draft.seedVarietyId) ?? null;
        const area = draft.farmAreaId === null ? null : farmAreas.find((item) => item.farmAreaId === draft.farmAreaId)?.name;
        return <section key={draft.clientId} className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#dfe4dc] sm:p-6">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#eaf0e8] font-extrabold text-[#19382b]">{index + 1}</span><div><h2 className="font-extrabold text-[#19382b]">{seed?.name || "Chưa chọn giống"}</h2><p className="text-xs text-[#879189]">Khay {index + 1}</p></div></div><p className="text-right text-xs text-[#879189]">Giá thuê mỗi đợt trồng<br /><strong className="text-sm text-[#19382b]">{seed ? formatVnd(seed.rentalPricePerTray) : "Chưa có"}</strong></p></div>
          <dl className="mt-6 grid gap-4 rounded-2xl bg-[#f5f3eb] p-4 text-sm sm:grid-cols-3"><div><dt className="flex items-center gap-1 text-xs text-[#879189]"><CalendarDays size={14} />Ngày gieo</dt><dd className="mt-1 font-bold text-[#365b46]">{draft.targetPlantingDate || "SmartFarm sắp xếp"}</dd></div><div><dt className="flex items-center gap-1 text-xs text-[#879189]"><RotateCcw size={14} />Đợt trồng</dt><dd className="mt-1 font-bold text-[#365b46]">{draft.totalCycles}</dd></div><div><dt className="flex items-center gap-1 text-xs text-[#879189]"><MapPin size={14} />Khu trồng</dt><dd className="mt-1 font-bold text-[#365b46]">{area || "SmartFarm sắp xếp"}</dd></div></dl>
        </section>;
      })}</div>
      <section className="mt-5 rounded-[1.75rem] bg-[#eaf0e8] p-5 sm:p-6"><div className="grid gap-5 sm:grid-cols-2"><div><p className="text-xs font-bold text-[#5a7163]">Giá tạm tính</p><p className="mt-1 text-xl font-extrabold text-[#19382b]">{formatVnd(draftSubtotal)}</p></div><div className="sm:text-right"><p className="text-xs text-[#617168]">Giao đến</p><p className="mt-1 font-bold text-[#19382b]">{deliveryAddress.address}</p><p className="mt-1 text-xs text-[#617168]">{deliveryPreview?.distanceKm === null ? "Khoảng cách chưa xác định" : `${deliveryPreview?.distanceKm.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} km`}{deliveryPreview?.isOutOfRange ? " · Ngoài bán kính đã chấp nhận" : " · Trong phạm vi"}</p>{cart && cart.itemCount > 0 && <p className="mt-3 text-xs text-[#617168]">Giỏ hiện có: <strong>{formatVnd(cart.total)}</strong></p>}</div></div></section>
      {actionError && <div className="mt-4"><Notice tone="danger">{actionError}{verificationRequired && <Link href="/rentals/cart" className="ml-2 font-bold underline">Xem giỏ hàng</Link>}</Notice></div>}
      <div className="mt-7 flex flex-wrap gap-3">
        {drafts.length === 1 && <button type="button" disabled={!finalConfigurationValid || actionPending || verificationRequired} onClick={() => void createDirectRental()} className={primaryButtonClass}>{creatingDirect ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}{creatingDirect ? "Đang tạo đơn thuê..." : "Thuê ngay và thanh toán"}<ActionArrow /></button>}
        <button type="button" disabled={!finalConfigurationValid || actionPending || verificationRequired} onClick={() => void addAllToRentalCart()} className={`${secondaryButtonClass} ${drafts.length > 1 ? "w-full sm:w-auto" : ""}`}>{adding ? <LoaderCircle size={18} className="animate-spin" /> : <ShoppingBag size={18} />}{adding ? `Đang thêm ${progress.completed}/${progress.total}` : "Thêm vào giỏ thuê"}</button>
      </div>
      
      <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm"><Link href="/rentals/cart" className="font-bold text-[#365b46]">Xem giỏ hàng ({cartItemCount})</Link>{!compact && <Link href="/orders" className="text-[#617168]">Xem đơn hàng</Link>}</div>
    </div>;
  }

  if (loading) {
    return <main className={`${manrope.className} bg-[#f5f3eb] px-4 py-8 sm:px-6 lg:py-12`}><div className="mx-auto grid max-w-[1220px] items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]"><div className="space-y-5 rounded-[1.5rem] bg-white p-6 sm:p-8"><div className="h-4 w-36 rounded bg-[#dfe6dc]" /><div className="h-10 w-3/4 rounded bg-[#dfe6dc]" /><div className="h-40 rounded-[1.25rem] bg-[#f5f3eb]" /></div><div className="aspect-[4/3] rounded-[1.5rem] bg-[#dfe6dc] lg:aspect-[4/5]" /></div></main>;
  }

  return <main className={`${manrope.className} bg-[#f5f3eb] px-4 py-8 text-[#19382b] sm:px-6 sm:py-10 lg:py-12`}>
    <div className="mx-auto grid max-w-[1220px] items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)] xl:gap-8">
      <article className="min-w-0 rounded-[1.5rem] bg-white p-5 ring-1 ring-[#dfe4dc] sm:p-8 lg:p-9">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-[#4f8f68]">SmartFarm / Thuê khay</p>
          <p className="text-xs font-bold tabular-nums text-[#5a7163]">Bước {String(step).padStart(2, "0")} / 05</p>
        </div>

        <ol aria-label="Tiến trình thuê khay" className="mt-5 hidden grid-cols-5 gap-2 sm:grid">
          {steps.map((item, index) => {
            const stepNumber = index + 1;
            const isCurrent = stepNumber === step;
            const isComplete = stepNumber < step;
            return <li key={item.shortTitle} aria-current={isCurrent ? "step" : undefined} className="min-w-0">
              <div className={`h-1 rounded-full ${stepNumber <= step ? "bg-[#315a43]" : "bg-[#dfe6dc]"}`} />
              <div className={`mt-2 flex items-center gap-1.5 text-[0.68rem] font-bold ${isCurrent ? "text-[#19382b]" : isComplete ? "text-[#4f8f68]" : "text-[#9aa49c]"}`}>
                {isComplete && <Check size={12} className="shrink-0" />}
                <span className="truncate">{item.shortTitle}</span>
              </div>
            </li>;
          })}
        </ol>
        <div className="mt-4 sm:hidden"><div className="grid grid-cols-5 gap-1.5">{steps.map((item, index) => <span key={item.shortTitle} className={`h-1 rounded-full ${index + 1 <= step ? "bg-[#315a43]" : "bg-[#dfe6dc]"}`} />)}</div><p className="mt-2 text-xs font-semibold text-[#617168]">{steps[step - 1].shortTitle}</p></div>

        <header className="mt-7 sm:mt-8"><h1 ref={headingRef} tabIndex={-1} className="max-w-2xl text-[2rem] font-extrabold leading-[1.12] tracking-[-0.035em] text-balance outline-none sm:text-[2.35rem]">{steps[step - 1].title}</h1></header>
        <div className="py-6 sm:py-7">{renderStepContent()}</div>

        {step < 5 && <footer className="flex items-end justify-between gap-3 pt-1">
          <button type="button" onClick={goBack} disabled={step === 1 || actionPending} className={secondaryButtonClass}><ArrowLeft size={17} />Quay lại</button>
          <div className="text-right">{stepError && <p role="alert" className="mb-2 max-w-sm text-xs font-semibold text-[#a13c32]">{stepError}</p>}<button type="button" onClick={goNext} className={primaryButtonClass}>Tiếp tục<ActionArrow /></button></div>
        </footer>}
        {step === 5 && <footer className="pt-4"><button type="button" onClick={goBack} disabled={actionPending} className={secondaryButtonClass}><ArrowLeft size={17} />Chỉnh sửa</button></footer>}
      </article>

      <aside className="overflow-hidden rounded-[1.5rem] bg-[#19382b] ring-1 ring-[#d5ddd3] lg:sticky lg:top-24">
        <div className="relative aspect-[16/10] lg:aspect-[4/5]">
          <Image src="/images/home/smartfarm-hero.png" alt="Các khay rau mầm được chăm sóc trong nhà kính SmartFarm" fill priority sizes="(max-width: 1023px) 100vw, 40vw" className="object-cover object-[62%_center]" />
        </div>
        <p className="px-6 py-5 text-sm font-semibold leading-6 text-[#eef3ec]">Nuôi dưỡng những mầm xanh, theo cách thông minh hơn.</p>
      </aside>
    </div>
    <Dialog open={riskDialogSeedId !== null} onOpenChange={(open) => { if (!open) setRiskDialogSeedId(null); }}>
      <DialogContent className={`${manrope.className} max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.5rem] border-[#d9e4d8] bg-[#f8faf6] p-0 text-[#19382b] shadow-[0_24px_80px_rgba(25,56,43,0.22)] sm:max-w-xl`}>
        <div className="border-b border-[#dfe7dc] bg-[#e7efe5] px-5 pb-5 pt-6 sm:px-7">
          <DialogHeader className="pr-8 text-left">
            <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff6d9] text-[#795f17]"><AlertTriangle size={18} /></span><div><DialogTitle className="text-xl font-extrabold tracking-[-0.02em]">Lưu ý khi trồng</DialogTitle><DialogDescription className="mt-1 font-semibold text-[#567060]">{riskDialogSeedId === "all" && riskDialogSeeds.length > 1 ? `${riskDialogSeeds.length} giống đã chọn` : riskDialogSeeds[0]?.name || (riskDialogSeeds[0] ? `Giống #${riskDialogSeeds[0].seedVarietyId}` : "Giống cây")}</DialogDescription></div></div>
          </DialogHeader>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">{riskDialogSeeds.map((seed, index) => <section key={seed.seedVarietyId} className={index > 0 ? "border-t border-[#dfe7dc] pt-5" : undefined}>{riskDialogSeeds.length > 1 && <h3 className="mb-2 font-extrabold text-[#19382b]">{seed.name || `Giống #${seed.seedVarietyId}`}</h3>}<p className="whitespace-pre-line text-sm leading-7 text-[#425c4d]">{normalizeSeedRiskDescription(seed.riskDescription)}</p></section>)}</div>
        <DialogFooter className="border-t border-[#dfe7dc] px-5 py-4 sm:px-7">
          <DialogClose asChild><button type="button" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#19382b] px-6 text-sm font-bold text-white outline-none transition hover:bg-[#10291f] focus-visible:ring-2 focus-visible:ring-[#4f8f68] focus-visible:ring-offset-2 active:scale-[0.98]">Đóng</button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>;
}
