"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, Clock3, Copy, Landmark, XCircle } from "lucide-react";

import {
  ApiError,
  canRetryPayment,
  getAuthErrorMessage,
  hasPaymentException,
  isOrderPaymentExpired,
  isPaymentSuccess,
  isPaymentTerminal,
  normalizePaymentStatus,
  orderService,
  paymentExceptionLabel,
  paymentService,
  type PaymentInstructions,
  type PaymentStatus,
  type PaymentStatusResponse,
} from "@/lib/api";
import { displayValue, formatCustomerDateTime, formatVnd } from "@/lib/user-format";
import { buildVietQrImageUrl } from "@/lib/vietqr";

const pollingIntervalMs = 5_000;

function StatusDisplay({ status }: { status: PaymentStatus | null }) {
  const normalized = normalizePaymentStatus(status);
  const meta = normalized === "SUCCESS"
    ? { icon: CheckCircle2, className: "bg-[#E8F3EB] text-[#3F7655]", label: "Thành công" }
    : normalized === "FAILED"
      ? { icon: XCircle, className: "bg-red-50 text-[#EF5350]" }
      : normalized === "EXPIRED"
        ? { icon: AlertTriangle, className: "bg-slate-100 text-slate-700", label: "Đã hết hạn" }
      : { icon: Clock3, className: "bg-amber-50 text-amber-700", label: "Chờ thanh toán" };
  const Icon = meta.icon;
  const label = "label" in meta ? meta.label : "Thất bại";
  return <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${meta.className}`}><Icon size={14} />{label}</span>;
}

function paymentExceptionGuidance(type: PaymentStatusResponse["exceptionType"] | null) {
  if (type === "UNDERPAID") return "Backend cho phép thanh toán lại khi đơn còn hạn. Không chuyển bù phần thiếu; nếu thử lại, hãy dùng hướng dẫn mới và chuyển đúng toàn bộ số tiền.";
  if (type === "LATE") return "Giao dịch đến sau hạn thanh toán nên không thể thử thanh toán lại cho đơn này. Vui lòng liên hệ SmartFarm.";
  if (type === "REFERENCE_MISMATCH") return "Nội dung chuyển khoản không khớp. Vui lòng liên hệ SmartFarm và cung cấp chứng từ giao dịch.";
  if (type === "ORDER_STATE_MISMATCH" || type === "UNMATCHED") return "Giao dịch cần được SmartFarm kiểm tra thủ công. Không thực hiện thêm giao dịch cho đơn này.";
  return "SmartFarm chưa mở thanh toán lại an toàn cho trạng thái này. Vui lòng liên hệ hỗ trợ.";
}

export function PaymentStatusPage({ orderId }: { orderId: number }) {
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [pollingStopped, setPollingStopped] = useState(false);
  const [orderExpired, setOrderExpired] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [orderExpiresAt, setOrderExpiresAt] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const retryLockRef = useRef(false);

  async function copyValue(field: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopiedField(field);
    window.setTimeout(() => setCopiedField((current) => current === field ? null : current), 1_500);
  }

  async function refreshStatus() {
    setChecking(true);
    setError("");
    try {
      const [order, current] = await Promise.all([
        orderService.getOrder(orderId),
        paymentService.getPaymentStatus(orderId),
      ]);
      const expiresAt = order.paymentDueAt ?? null;
      const expired = isOrderPaymentExpired(order.status, expiresAt);
      setOrderStatus(order.status);
      setOrderExpiresAt(expiresAt);
      setOrderExpired(expired);
      setPaymentStatus(current);
      if (expired || isPaymentTerminal(current.status)) setPollingStopped(true);
      else {
        setPollingStopped(false);
        setReloadKey((value) => value + 1);
      }
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể cập nhật trạng thái thanh toán."));
    } finally {
      setChecking(false);
    }
  }

  async function retryPayment() {
    if (retryLockRef.current || !canRetryPayment(
      paymentStatus?.status,
      paymentStatus?.exceptionType,
      orderStatus,
      orderExpiresAt,
    )) return;

    retryLockRef.current = true;
    setRetrying(true);
    setError("");
    try {
      const created = await paymentService.createPayment(orderId);
      setInstructions(created);
      setPollingStopped(false);
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể tạo lại hướng dẫn thanh toán."));
    } finally {
      retryLockRef.current = false;
      setRetrying(false);
    }
  }

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    async function poll() {
      try {
        const [order, current] = await Promise.all([
          orderService.getOrder(orderId),
          paymentService.getPaymentStatus(orderId),
        ]);
        if (!active) return;
        const expiresAt = order.paymentDueAt ?? null;
        const expired = isOrderPaymentExpired(order.status, expiresAt);
        setOrderStatus(order.status);
        setOrderExpiresAt(expiresAt);
        setOrderExpired(expired);
        setPaymentStatus(current);
        setError("");
        if (expired || isPaymentTerminal(current.status)) {
          setPollingStopped(true);
          return;
        }
        timer = window.setTimeout(() => { void poll(); }, pollingIntervalMs);
      } catch (requestError) {
        if (!active) return;
        setError(getAuthErrorMessage(requestError, "Không thể cập nhật trạng thái thanh toán."));
        timer = window.setTimeout(() => { void poll(); }, pollingIntervalMs * 2);
      }
    }

    async function initialize() {
      setLoading(true);
      setPollingStopped(false);
      try {
        const order = await orderService.getOrder(orderId);
        if (!active) return;
        const expiresAt = order.paymentDueAt ?? null;
        const expired = isOrderPaymentExpired(order.status, expiresAt);
        setOrderStatus(order.status);
        setOrderExpiresAt(expiresAt);
        setOrderExpired(expired);
        if (expired) {
          setOrderExpired(true);
          setPollingStopped(true);
          try {
            setPaymentStatus(await paymentService.getPaymentStatus(orderId));
          } catch (statusError) {
            if (!(statusError instanceof ApiError && statusError.status === 404)) throw statusError;
          }
          if (active) setLoading(false);
          return;
        }
        try {
          const current = await paymentService.getPaymentStatus(orderId);
          if (!active) return;
          setPaymentStatus(current);
          if (isPaymentTerminal(current.status)) {
            setPollingStopped(true);
            setLoading(false);
            return;
          }
        } catch (statusError) {
          if (!(statusError instanceof ApiError && statusError.status === 404)) throw statusError;
        }
        if (order.status !== "AWAITING_PAYMENT") {
          setError("Đơn hàng này không còn ở trạng thái chờ thanh toán.");
          setLoading(false);
          setPollingStopped(true);
          return;
        }
        const created = await paymentService.createPayment(orderId);
        if (!active) return;
        setInstructions(created);
        setLoading(false);
        await poll();
      } catch (requestError) {
        if (!active) return;
        setError(getAuthErrorMessage(requestError, "Không thể tạo thanh toán cho đơn hàng."));
        setLoading(false);
        setPollingStopped(true);
      }
    }

    void initialize();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [orderId, reloadKey]);

  if (loading) return <main className="mx-auto max-w-3xl px-6 py-20 text-sm text-[#6b7280]">Đang tạo hướng dẫn thanh toán...</main>;
  const statusWithoutInstructions = paymentStatus?.status ?? null;
  const retryAvailable = canRetryPayment(
    paymentStatus?.status,
    paymentStatus?.exceptionType,
    orderStatus,
    orderExpiresAt,
  );
  if (!instructions && (orderExpired || isPaymentTerminal(statusWithoutInstructions))) {
    const normalized = normalizePaymentStatus(statusWithoutInstructions);
    const overpaid = normalized === "SUCCESS" && paymentStatus?.exceptionType === "OVERPAID";
    const terminalMeta = orderExpired
      ? { icon: AlertTriangle, color: "text-slate-600", title: "Đơn hàng đã hết hạn", description: "Không chuyển khoản cho đơn hàng này. Vui lòng tạo đơn mới nếu bạn vẫn có nhu cầu." }
      : normalized === "SUCCESS"
      ? { icon: CheckCircle2, color: "text-[#3F7655]", title: overpaid ? "Thanh toán thành công, có chuyển thừa" : "Thanh toán thành công", description: overpaid ? "Đơn đã được xác nhận nhưng số tiền ghi nhận cao hơn số tiền cần thanh toán. Vui lòng liên hệ SmartFarm để được hỗ trợ phần chênh lệch." : "Giao dịch của đơn hàng này đã được xác nhận." }
      : normalized === "FAILED"
        ? { icon: XCircle, color: "text-[#EF5350]", title: "Thanh toán không thành công", description: paymentExceptionGuidance(paymentStatus?.exceptionType ?? null) }
        : { icon: AlertTriangle, color: "text-slate-600", title: "Thanh toán đã hết hạn", description: "Đơn hàng đã quá thời hạn thanh toán. Vui lòng quay lại danh sách đơn hàng và đặt lại nếu bạn vẫn có nhu cầu." };
    const TerminalIcon = terminalMeta.icon;
    return <main className="mx-auto max-w-3xl px-6 py-20">
      <TerminalIcon size={42} className={terminalMeta.color} />
      <h1 className="mt-5 text-2xl font-bold">{terminalMeta.title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#6b7280]">{terminalMeta.description}</p>
      {hasPaymentException(paymentStatus?.exceptionType) && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{paymentExceptionLabel(paymentStatus?.exceptionType)}</p>}
      {paymentStatus && <dl className="mt-5 grid gap-3 rounded-xl bg-[#f3f8f4] p-4 text-sm sm:grid-cols-2"><div><dt className="text-[#6b7280]">Số tiền cần thanh toán</dt><dd className="mt-1 font-semibold tabular-nums">{formatVnd(paymentStatus.expectedAmount)}</dd></div><div><dt className="text-[#6b7280]">Đã ghi nhận</dt><dd className="mt-1 font-semibold tabular-nums">{formatVnd(paymentStatus.amountPaid)}</dd></div></dl>}
      <div className="mt-6 flex flex-wrap gap-4">
        {retryAvailable && <button type="button" onClick={() => void retryPayment()} disabled={retrying} className="rounded-xl bg-[#214f36] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#173c2b] disabled:opacity-50">{retrying ? "Đang tạo lại..." : "Thanh toán lại"}</button>}
        <button type="button" onClick={() => void refreshStatus()} disabled={checking} className="rounded-xl border border-[#d7e5da] px-4 py-2.5 text-sm font-semibold text-[#3F7655] transition-colors hover:bg-[#f3f8f4] disabled:opacity-50">{checking ? "Đang kiểm tra..." : "Kiểm tra lại trạng thái"}</button>
        <Link href={`/orders/${orderId}`} className="inline-flex items-center text-sm font-semibold text-[#4F8F68]">Quay lại đơn hàng</Link>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-[#b91c1c]">{error}</p>}
    </main>;
  }
  if (error && !instructions) return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-2xl font-bold">Không thể mở hướng dẫn thanh toán</h1><p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-[#EF5350]">{error}</p><Link href={`/orders/${orderId}`} className="mt-5 inline-block text-sm font-semibold text-[#4F8F68]">Quay lại đơn hàng</Link></main>;
  if (!instructions) return null;

  const effectiveStatus = paymentStatus?.status ?? instructions.status;
  const paymentSucceeded = isPaymentSuccess(effectiveStatus);
  const paymentFailed = normalizePaymentStatus(effectiveStatus) === "FAILED";
  const paymentExpired = orderExpired || normalizePaymentStatus(effectiveStatus) === "EXPIRED";
  const paymentPending = !paymentSucceeded && !paymentFailed && !paymentExpired;
  const transferDetailsReady = Number.isFinite(instructions.amount)
    && instructions.amount > 0
    && Boolean(instructions.paymentCode.trim())
    && Boolean(instructions.bankName.trim())
    && Boolean(instructions.bankAccountNumber.trim())
    && Boolean(instructions.accountName.trim());
  const showTransferInstructions = paymentPending && transferDetailsReady;
  const exceptionMessage = paymentExceptionLabel(paymentStatus?.exceptionType);
  const paymentOverpaid = paymentSucceeded && paymentStatus?.exceptionType === "OVERPAID";
  const backendQrUrl = instructions.qrCodeUrl?.trim();
  const vietQrUrl = showTransferInstructions ? (backendQrUrl || buildVietQrImageUrl(instructions)) : null;
  const copyButton = (field: string, value: string | null, label: string) => value ? <button type="button" onClick={() => void copyValue(field, value)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7e5da] px-2.5 py-1.5 text-xs font-semibold text-[#3F7655] transition-colors hover:bg-[#f3f8f4]" aria-label={`Sao chép ${label}`}>{copiedField === field ? <Check size={13} /> : <Copy size={13} />}{copiedField === field ? "Đã sao chép" : "Sao chép"}</button> : null;

  return <main className="mx-auto max-w-6xl px-6 py-10">
    <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-widest text-[#4F8F68]">Thanh toán</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1a2e1f] md:text-4xl">{paymentPending ? "Hướng dẫn chuyển khoản" : "Kết quả thanh toán"}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b7280]">{paymentPending ? "Vui lòng chuyển đúng số tiền và nội dung bên dưới. Trạng thái giao dịch sẽ được tự động cập nhật." : "Thông tin mới nhất của giao dịch và đơn hàng được hiển thị bên dưới."}</p></div>
    {paymentSucceeded && <section className={`mb-6 rounded-2xl border p-6 ${paymentOverpaid ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}><div className="flex items-center gap-3"><CheckCircle2 className={paymentOverpaid ? "text-amber-700" : "text-[#3F7655]"} /><div><h2 className="font-bold text-[#1a2e1f]">{paymentOverpaid ? "Thanh toán thành công, có chuyển thừa" : "Thanh toán thành công"}</h2><p className={`mt-1 text-sm ${paymentOverpaid ? "text-amber-900" : "text-[#3F7655]"}`}>{paymentOverpaid ? "Đơn đã được xác nhận. Vui lòng liên hệ SmartFarm để được hỗ trợ phần tiền chênh lệch." : `Giao dịch đã được xác nhận${paymentStatus?.paidAt ? ` lúc ${formatCustomerDateTime(paymentStatus.paidAt)}` : ""}. Mở chi tiết đơn hàng để xem trạng thái mới nhất.`}</p></div></div></section>}
    {paymentFailed && !orderExpired && <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6"><div className="flex items-center gap-3"><XCircle className="text-[#EF5350]" /><div><h2 className="font-bold text-[#7f1d1d]">Thanh toán không thành công</h2><p className="mt-1 text-sm text-[#b91c1c]">{exceptionMessage ?? "Giao dịch chưa được xác nhận."} {paymentExceptionGuidance(paymentStatus?.exceptionType ?? null)}</p></div></div></section>}
    {paymentExpired && <section className="mb-6 rounded-2xl bg-slate-100 p-6"><div className="flex items-center gap-3"><AlertTriangle className="text-slate-600" /><div><h2 className="font-bold text-slate-900">{orderExpired ? "Đơn hàng đã hết hạn" : "Thanh toán đã hết hạn"}</h2><p className="mt-1 text-sm text-slate-700">Không chuyển khoản cho hướng dẫn này. Hãy quay lại danh sách đơn hàng để tạo đơn mới.</p></div></div></section>}
    {paymentPending && !transferDetailsReady && <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6"><div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-700" /><div><h2 className="font-bold text-amber-950">Thông tin thanh toán chưa đầy đủ</h2><p className="mt-1 text-sm leading-6 text-amber-900">Backend chưa trả đủ ngân hàng, số tài khoản, chủ tài khoản, số tiền hoặc nội dung chuyển khoản. Không chuyển tiền cho đến khi cấu hình được hoàn tất.</p></div></div></section>}
    <div className="grid gap-8 lg:grid-cols-5">
      {showTransferInstructions && <section className="rounded-2xl border border-[#e8f3eb] bg-white p-6 shadow-sm lg:col-span-3">
        <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#4F8F68]"><Landmark size={21} /></span><div><p className="text-xs text-[#6b7280]">Ngân hàng</p><p className="font-bold">{displayValue(instructions.bankName)}</p></div></div><StatusDisplay status={effectiveStatus} /></div>
        {vietQrUrl ? <div className="mt-7 rounded-2xl bg-[#f7faf7] p-4 text-center"><Image src={vietQrUrl} alt={`Mã VietQR thanh toán đơn hàng ${instructions.orderId}`} width={300} height={356} unoptimized className="mx-auto h-auto w-full max-w-[300px] rounded-xl" /><p className="mt-3 text-xs leading-5 text-[#6b7280]">Quét mã bằng ứng dụng ngân hàng. Vui lòng kiểm tra lại số tiền và nội dung trước khi xác nhận.</p></div> : <p className="mt-7 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">Chưa thể tạo mã VietQR an toàn cho ngân hàng này. Bạn vẫn có thể chuyển khoản thủ công bằng thông tin bên dưới.</p>}
        <dl className="mt-7 grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-[#6b7280]">Số tài khoản</dt><dd className="mt-1 flex flex-wrap items-center gap-2"><span className="font-mono font-semibold">{displayValue(instructions.bankAccountNumber)}</span>{copyButton("account", instructions.bankAccountNumber, "số tài khoản")}</dd></div><div><dt className="text-[#6b7280]">Chủ tài khoản</dt><dd className="mt-1 flex flex-wrap items-center gap-2"><span className="font-semibold">{displayValue(instructions.accountName)}</span>{copyButton("account-name", instructions.accountName, "chủ tài khoản")}</dd></div>{instructions.bankBin.trim() && <div><dt className="text-[#6b7280]">Mã BIN</dt><dd className="mt-1 font-mono font-semibold">{instructions.bankBin}</dd></div>}<div><dt className="text-[#6b7280]">Số tiền</dt><dd className="mt-1 flex flex-wrap items-center gap-2"><span className="text-xl font-bold text-[#4F8F68]">{formatVnd(instructions.amount)}</span>{copyButton("amount", String(instructions.amount), "số tiền")}</dd></div><div><dt className="text-[#6b7280]">Hết hạn</dt><dd className="mt-1 font-semibold">{formatCustomerDateTime(instructions.expiresAt)}</dd></div></dl>
        <div className="mt-7 rounded-xl bg-[#f3f8f4] p-5"><p className="text-sm font-semibold text-[#1a2e1f]">Nội dung chuyển khoản</p><div className="mt-2 flex flex-wrap items-center gap-2"><p className="break-all font-mono text-sm font-semibold">{displayValue(instructions.paymentCode)}</p>{copyButton("content", instructions.paymentCode, "nội dung chuyển khoản")}</div></div>
        {!instructions.paymentCode && <p className="mt-5 text-xs leading-5 text-[#6b7280]">Thông tin chuyển khoản chưa đầy đủ. Vui lòng quay lại đơn hàng và thử lại sau.</p>}
      </section>}
      <aside className={`rounded-2xl border border-[#e8f3eb] bg-white p-6 shadow-sm ${showTransferInstructions ? "lg:col-span-2" : "lg:col-span-5 lg:max-w-2xl"}`}><h2 className="text-xl font-bold">Trạng thái giao dịch</h2><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Mã đơn hàng</dt><dd className="font-mono font-semibold">{instructions.orderId}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Mã thanh toán</dt><dd className="font-mono font-semibold">{instructions.paymentId}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Thời hạn thanh toán</dt><dd className="text-right font-semibold">{formatCustomerDateTime(instructions.expiresAt)}</dd></div>{paymentStatus && <><div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Số tiền cần thanh toán</dt><dd className="font-semibold tabular-nums">{formatVnd(paymentStatus.expectedAmount)}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Đã ghi nhận</dt><dd className="font-semibold tabular-nums">{formatVnd(paymentStatus.amountPaid)}</dd></div>{hasPaymentException(paymentStatus.exceptionType) && <div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Tình trạng</dt><dd className="max-w-[16rem] text-right font-semibold text-amber-800">{exceptionMessage}</dd></div>}{paymentStatus.staffNote && <div><dt className="text-[#6b7280]">Ghi chú</dt><dd className="mt-1 font-semibold">{paymentStatus.staffNote}</dd></div>}</>}</dl>
        {!isPaymentTerminal(effectiveStatus) && !pollingStopped && <p className="mt-6 flex items-center gap-2 text-xs text-amber-700"><Clock3 size={14} className="animate-pulse" />Đang kiểm tra trạng thái mỗi 5 giây...</p>}
        {!isPaymentTerminal(effectiveStatus) && pollingStopped && <p className="mt-6 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">Đã dừng tự động kiểm tra. Bạn có thể kiểm tra lại khi cần.</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-[#EF5350]">{error}</p>}
        <div className="mt-7 flex flex-wrap items-center gap-4 text-sm font-semibold text-[#4F8F68]">{retryAvailable && <button type="button" onClick={() => void retryPayment()} disabled={retrying} className="rounded-xl bg-[#214f36] px-4 py-2.5 text-white transition-colors hover:bg-[#173c2b] disabled:opacity-50">{retrying ? "Đang tạo lại..." : "Thanh toán lại"}</button>}<button type="button" onClick={() => void refreshStatus()} disabled={checking} className="rounded-xl border border-[#d7e5da] px-4 py-2.5 transition-colors hover:bg-[#f3f8f4] disabled:opacity-50">{checking ? "Đang kiểm tra..." : "Kiểm tra lại trạng thái"}</button><Link href={`/orders/${orderId}`}>Xem đơn hàng</Link><Link href="/orders">Danh sách đơn hàng</Link></div>
      </aside>
    </div>
  </main>;
}
