"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, LocateFixed, MapPin, Navigation, RefreshCw, Search } from "lucide-react";
import { deliveryPreviewService, type DeliveryPreview } from "@/lib/api";
import type { DeliveryAddressValue } from "@/lib/delivery-address";
import { GeocodingError, geocodingService, type GeocodingResult } from "@/lib/geocoding-service";
import { DeliveryPreviewCard } from "./delivery-preview-card";

const DeliveryLocationMap = dynamic(() => import("./delivery-location-map"), {
  ssr: false,
  loading: () => <div className="grid h-[220px] place-items-center bg-[#f3f8f4] text-sm text-[#6b7280] sm:h-[260px]">Đang tải bản đồ...</div>,
});

const fieldClass = "h-11 min-w-0 flex-1 rounded-xl border border-[#dce9df] bg-[#f8fbf9] px-4 text-sm outline-none transition focus:border-[#4F8F68] focus:bg-white";

function validCoordinates(latitude: number | null, longitude: number | null) {
  return latitude !== null && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && longitude !== null && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function geocodingErrorMessage(error: unknown, action: "search" | "reverse") {
  const prefix = action === "search" ? "tìm kiếm địa chỉ" : "xác định địa chỉ tại điểm đã chọn";
  if (!(error instanceof GeocodingError)) return `Chưa thể ${prefix}. Vui lòng kiểm tra kết nối và thử lại.`;
  if (error.code === "NOT_CONFIGURED") return "Tính năng gợi ý địa chỉ chưa được cấu hình. Quản trị viên cần thêm GEOAPIFY_API_KEY vào môi trường triển khai.";
  if (error.code === "TIMEOUT") return `Yêu cầu ${prefix} quá thời gian. Vui lòng thử lại.`;
  if (error.code === "RATE_LIMITED") return "Dịch vụ địa chỉ đang giới hạn lượt truy cập. Vui lòng đợi một lúc rồi thử lại.";
  if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") return "Cấu hình Geoapify không hợp lệ hoặc không có quyền truy cập. Vui lòng liên hệ quản trị viên.";
  if (error.code === "PROVIDER_ERROR" || error.code === "INVALID_RESPONSE") return "Dịch vụ địa chỉ đang tạm gián đoạn. Bạn vẫn có thể chọn tọa độ trực tiếp trên bản đồ.";
  return `Chưa thể ${prefix}. Vui lòng kiểm tra kết nối và thử lại.`;
}

export function DeliveryAddressPicker({ value, onChange, preview, onPreviewChange, accepted, onAcceptedChange, disabled = false }: {
  value: DeliveryAddressValue;
  onChange: (value: DeliveryAddressValue) => void;
  preview: DeliveryPreview | null;
  onPreviewChange: (preview: DeliveryPreview | null) => void;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  disabled?: boolean;
}) {
  const [locating, setLocating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [reversing, setReversing] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [reverseSuggestion, setReverseSuggestion] = useState<GeocodingResult | null>(null);
  const [coordinateSource, setCoordinateSource] = useState<"search" | "map" | "location" | null>(null);
  const [searchError, setSearchError] = useState("");
  const [reverseError, setReverseError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [tileError, setTileError] = useState(false);
  const [tileRetryKey, setTileRetryKey] = useState(0);
  const searchSequence = useRef(0);
  const reverseSequence = useRef(0);
  const searchController = useRef<AbortController | null>(null);
  const reverseController = useRef<AbortController | null>(null);
  const hasUserEditedAddress = useRef(false);
  const addressInputId = useId();
  const suggestionsId = useId();

  useEffect(() => () => {
    searchController.current?.abort();
    reverseController.current?.abort();
  }, []);

  function commitUnconfirmedValue(nextValue: DeliveryAddressValue) {
    onChange(nextValue);
    onPreviewChange(null);
    onAcceptedChange(false);
  }

  async function reverseCoordinates(latitude: number, longitude: number) {
    reverseController.current?.abort();
    const controller = new AbortController();
    reverseController.current = controller;
    const sequence = ++reverseSequence.current;
    setReversing(true);
    setReverseSuggestion(null);
    setReverseError("");
    try {
      const result = await geocodingService.reverse(latitude, longitude, { signal: controller.signal, timeoutMs: 12_000 });
      if (sequence !== reverseSequence.current) return;
      setReverseSuggestion(result);
      if (!result) setReverseError("Không tìm thấy địa chỉ cho điểm này. Bạn có thể giữ tọa độ và nhập địa chỉ giao hàng thủ công.");
    } catch (error) {
      if (error instanceof GeocodingError && error.code === "ABORTED") return;
      if (sequence !== reverseSequence.current) return;
      setReverseError(geocodingErrorMessage(error, "reverse"));
    } finally {
      if (sequence === reverseSequence.current) setReversing(false);
    }
  }

  function updateCoordinates(latitude: number, longitude: number, source: "map" | "location" = "map") {
    if (!validCoordinates(latitude, longitude)) return;
    commitUnconfirmedValue({ ...value, latitude, longitude });
    setCoordinateSource(source);
    setSearchResults([]);
    setLocationError("");
    setPreviewError("");
    void reverseCoordinates(latitude, longitude);
  }

  function updateAddress(address: string) {
    searchController.current?.abort();
    reverseController.current?.abort();
    searchSequence.current += 1;
    reverseSequence.current += 1;
    hasUserEditedAddress.current = true;
    commitUnconfirmedValue({ address, latitude: null, longitude: null });
    setCoordinateSource(null);
    setSearching(false);
    setReversing(false);
    setSearchResults([]);
    setActiveSuggestion(-1);
    setReverseSuggestion(null);
    setSearchError("");
    setReverseError("");
    setLocationError("");
    setPreviewError("");
  }

  const runAddressSearch = useCallback(async (query: string) => {
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    const sequence = ++searchSequence.current;
    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    setActiveSuggestion(-1);
    try {
      const results = await geocodingService.search(query, { signal: controller.signal, timeoutMs: 12_000 });
      if (sequence !== searchSequence.current) return;
      setSearchResults(results);
      setActiveSuggestion(results.length > 0 ? 0 : -1);
      if (results.length === 0) {
        setSearchError("Không tìm thấy địa chỉ phù hợp tại Việt Nam. Hãy bổ sung số nhà, phường/xã, tỉnh/thành hoặc chọn vị trí trực tiếp trên bản đồ.");
      }
    } catch (error) {
      if (error instanceof GeocodingError && error.code === "ABORTED") return;
      if (sequence !== searchSequence.current) return;
      setSearchError(geocodingErrorMessage(error, "search"));
    } finally {
      if (sequence === searchSequence.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!hasUserEditedAddress.current || disabled) return;

    const query = value.address.normalize("NFC").trim().replace(/\s+/g, " ");
    if (query.length < 3) {
      searchController.current?.abort();
      return;
    }

    const debounce = window.setTimeout(() => void runAddressSearch(query), 400);
    return () => window.clearTimeout(debounce);
  }, [disabled, runAddressSearch, value.address]);

  function selectSearchResult(result: GeocodingResult) {
    searchController.current?.abort();
    reverseController.current?.abort();
    searchSequence.current += 1;
    reverseSequence.current += 1;
    hasUserEditedAddress.current = false;
    commitUnconfirmedValue({ address: result.displayName, latitude: result.latitude, longitude: result.longitude });
    setCoordinateSource("search");
    setSearching(false);
    setReversing(false);
    setSearchResults([]);
    setActiveSuggestion(-1);
    setReverseSuggestion(null);
    setSearchError("");
    setReverseError("");
    setLocationError("");
    setPreviewError("");
  }

  function applyReverseSuggestion() {
    if (!reverseSuggestion) return;
    hasUserEditedAddress.current = false;
    commitUnconfirmedValue({ ...value, address: reverseSuggestion.displayName });
    setSearchError("");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt này không hỗ trợ lấy vị trí hiện tại.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateCoordinates(position.coords.latitude, position.coords.longitude, "location");
        setLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Bạn chưa cấp quyền vị trí. Hãy cho phép truy cập hoặc chọn trực tiếp trên bản đồ."
          : error.code === error.TIMEOUT
            ? "Không lấy được vị trí trong thời gian cho phép. Vui lòng thử lại hoặc chọn trên bản đồ."
            : "Không thể lấy vị trí hiện tại. Vui lòng chọn trực tiếp trên bản đồ.";
        setLocationError(message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  }

  async function confirmLocation() {
    if (!value.address.trim()) {
      setLocationError("Vui lòng nhập địa chỉ giao hàng hoặc dùng địa chỉ được gợi ý.");
      return;
    }
    if (!validCoordinates(value.latitude, value.longitude)) {
      setLocationError("Vui lòng tìm địa chỉ hoặc chọn vị trí hợp lệ trên bản đồ.");
      return;
    }
    setChecking(true);
    setLocationError("");
    setPreviewError("");
    onPreviewChange(null);
    try {
      onPreviewChange(await deliveryPreviewService.getPreview(value.latitude!, value.longitude!));
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      setPreviewError(timedOut
        ? "Kiểm tra khoảng cách quá thời gian. Vui lòng thử lại."
        : "Chưa thể kiểm tra khoảng cách với hệ thống giao hàng. Vui lòng thử lại.");
    } finally {
      setChecking(false);
    }
  }

  const hasCoordinates = validCoordinates(value.latitude, value.longitude);
  const locationSourceLabel = coordinateSource === "search"
    ? "Từ kết quả tìm kiếm"
    : coordinateSource === "location"
      ? "Từ vị trí thiết bị"
      : coordinateSource === "map"
        ? "Đã chọn trên bản đồ"
        : null;
  const showReverseSuggestion = reverseSuggestion
    && reverseSuggestion.displayName.trim().toLocaleLowerCase("vi-VN") !== value.address.trim().toLocaleLowerCase("vi-VN");

  const showSuggestions = searching || Boolean(searchError) || searchResults.length > 0;

  return <div className="space-y-4">
    <div className="relative z-[1000] space-y-2">
      <label htmlFor={addressInputId} className="block text-sm font-semibold text-[#19382b]">Địa chỉ giao hàng</label>
      <div className="relative">
        <input
          id={addressInputId}
          required
          disabled={disabled}
          value={value.address}
          onChange={(event) => updateAddress(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && searchResults.length > 0) {
              event.preventDefault();
              setActiveSuggestion((current) => current < searchResults.length - 1 ? current + 1 : 0);
            } else if (event.key === "ArrowUp" && searchResults.length > 0) {
              event.preventDefault();
              setActiveSuggestion((current) => current > 0 ? current - 1 : searchResults.length - 1);
            } else if (event.key === "Enter" && searchResults.length > 0) {
              event.preventDefault();
              selectSearchResult(searchResults[activeSuggestion >= 0 ? activeSuggestion : 0]);
            }
            if (event.key === "Escape") {
              searchController.current?.abort();
              setSearching(false);
              setSearchResults([]);
              setActiveSuggestion(-1);
              setSearchError("");
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={suggestionsId}
          aria-activedescendant={activeSuggestion >= 0 ? `${suggestionsId}-option-${activeSuggestion}` : undefined}
          autoComplete="street-address"
          placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
          className={`${fieldClass} w-full pr-11`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[#789184]" aria-hidden="true">
          {searching ? <LoaderCircle size={17} className="animate-spin" /> : <Search size={17} />}
        </span>
        {showSuggestions && <div id={suggestionsId} role="listbox" className="absolute inset-x-0 top-full z-[1100] mt-2 max-h-80 overflow-y-auto rounded-xl border border-[#dce9df] bg-white p-2 shadow-[0_18px_45px_rgba(25,56,43,0.18)]">
          {searching && <p role="status" className="flex items-center gap-2 px-3 py-2 text-sm text-[#6b7280]"><LoaderCircle size={15} className="animate-spin" />Đang tìm địa chỉ phù hợp...</p>}
          {!searching && searchError && <div className="px-3 py-2"><p role="alert" className="text-sm leading-5 text-[#a64539]">{searchError}</p><button type="button" onClick={() => void runAddressSearch(value.address)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3F7655] underline underline-offset-4"><RefreshCw size={13} />Thử lại</button></div>}
          {!searching && searchResults.length > 0 && <>
            <p className="px-3 pb-2 pt-1 text-xs font-semibold text-[#6b7280]">Chọn đúng địa điểm của bạn</p>
            <ul className="space-y-1">{searchResults.map((result, index) => <li key={result.id} id={`${suggestionsId}-option-${index}`} role="option" aria-selected={activeSuggestion === index}>
              <button type="button" onMouseEnter={() => setActiveSuggestion(index)} onClick={() => selectSearchResult(result)} className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition focus:outline-none active:scale-[0.995] ${activeSuggestion === index ? "bg-[#f3f8f4]" : "hover:bg-[#f7faf8]"}`}>
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#4F8F68]" />
                <span className="min-w-0"><strong className="block text-sm font-semibold leading-5 text-[#274936]">{result.title}</strong>{result.context && <span className="mt-0.5 block text-xs leading-5 text-[#6b7280]">{result.context}</span>}<span className="mt-0.5 block text-[11px] leading-4 text-[#8a948d]">{result.displayName}</span></span>
              </button>
            </li>)}</ul>
            <p className="px-3 pb-1 pt-2 text-[11px] text-[#879189]">Kết quả bởi <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2">Geoapify</a>, dữ liệu © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline underline-offset-2">OpenStreetMap contributors</a></p>
          </>}
        </div>}
      </div>
      <p className="text-xs leading-5 text-[#7a877f]">Nhập ít nhất 3 ký tự để xem tối đa 5 gợi ý tại Việt Nam. Dùng ↑ ↓ và Enter để chọn nhanh.</p>
    </div>

    <div className="overflow-hidden rounded-2xl border border-[#dce9df] bg-[#f3f8f4]">
      <div className="relative h-[220px] overflow-hidden sm:h-[260px]">
        <DeliveryLocationMap value={value} onSelect={(latitude, longitude) => updateCoordinates(latitude, longitude, "map")} tileRetryKey={tileRetryKey} onTileError={() => setTileError(true)} onTileReady={() => setTileError(false)} />
        {tileError && <div className="absolute inset-x-3 top-3 z-[500] rounded-xl border border-amber-200 bg-amber-50/95 p-3 shadow-sm backdrop-blur"><div className="flex items-start justify-between gap-3"><p role="alert" className="text-xs leading-5 text-amber-900">Một số ô bản đồ chưa tải được. Bạn vẫn có thể dùng tọa độ hoặc thử tải lại lớp bản đồ.</p><button type="button" onClick={() => { setTileError(false); setTileRetryKey((current) => current + 1); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200"><RefreshCw size={13} />Thử lại</button></div></div>}
      </div>
      <div className="border-t border-[#dce9df] bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-[#365b46]">Vị trí đang chọn</p>{preview && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3F7655]"><CheckCircle2 size={12} />Đã xác nhận</span>}</div>
            <p className="mt-1 text-xs tabular-nums text-[#6b7280]">{hasCoordinates ? `${value.latitude!.toFixed(6)}, ${value.longitude!.toFixed(6)}` : "Chưa chọn tọa độ"}</p>
            {locationSourceLabel && <p className="mt-1 text-[11px] text-[#879189]">{locationSourceLabel}</p>}
          </div>
          <button type="button" disabled={disabled || locating} onClick={useCurrentLocation} className="inline-flex items-center gap-2 rounded-xl border border-[#dce9df] px-3 py-2 text-xs font-semibold text-[#3F7655] transition hover:bg-[#f3f8f4] active:scale-[0.98] disabled:opacity-50"><LocateFixed size={15} />{locating ? "Đang định vị..." : "Dùng vị trí hiện tại"}</button>
        </div>
        {reversing && <p role="status" className="mt-3 text-xs text-[#6b7280]">Đang tìm địa chỉ gần điểm đã chọn...</p>}
        {!reversing && showReverseSuggestion && <div className="mt-3 rounded-xl bg-[#f3f8f4] p-3"><p className="text-[11px] font-semibold text-[#6b7280]">Địa chỉ gợi ý từ tọa độ</p><p className="mt-1 text-xs font-semibold leading-5 text-[#315a43]">{reverseSuggestion.displayName}</p><button type="button" disabled={disabled} onClick={applyReverseSuggestion} className="mt-2 text-xs font-bold text-[#3F7655] underline underline-offset-4">Dùng địa chỉ này</button></div>}
        {!reversing && reverseError && <p role="status" className="mt-3 text-xs leading-5 text-amber-800">{reverseError}</p>}
        {locationError && <p role="alert" className="mt-3 text-xs leading-5 text-[#a64539]">{locationError}</p>}
      </div>
      <div className="flex justify-end border-t border-[#dce9df] bg-white px-4 py-3"><button type="button" disabled={disabled || checking || !hasCoordinates || !value.address.trim()} onClick={() => void confirmLocation()} className="inline-flex items-center gap-2 rounded-xl bg-[#19382b] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#10291f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"><Navigation size={14} />{checking ? "Đang kiểm tra..." : "Xác nhận vị trí"}</button></div>
    </div>
    <DeliveryPreviewCard preview={preview} loading={checking} error={previewError} accepted={accepted} onAcceptedChange={onAcceptedChange} onRetry={() => void confirmLocation()} />
  </div>;
}
