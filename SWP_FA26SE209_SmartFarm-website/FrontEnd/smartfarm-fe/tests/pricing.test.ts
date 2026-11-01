import { test } from "node:test";
import assert from "node:assert/strict";
import { initialPricing, agreedRates, rentalWasUsed, seedWasUsed, validateRental, validateSeedPrice, saveRental, saveSeedPrice, seedSelectable, normalized, priceText } from "../lib/pricing";
import { initialVarieties } from "../lib/varieties";
import { initialOrders } from "../lib/mock-data";
test("Bảng giá đúng bốn loại thuê và năm giống, dùng liên kết danh mục ổn định", () => {
  assert.deepEqual(initialPricing.rentals.map((r) => [r.code, r.price, r.enabled]), [["TK-01",15000,true],["TK-02",25000,true],["TK-03",40000,true],["TK-04",10000,false]]);
  assert.deepEqual(initialPricing.seeds.map((s) => [initialVarieties.find(v => v.id === s.varietyId)?.name, s.code, s.price, seedSelectable(s, initialVarieties)]), [["Cải xanh","GG-01",8000,true],["Củ cải trắng","GG-02",9000,true],["Hướng dương","GG-03",12000,true],["Đậu Hà Lan","GG-04",11000,false],["Lúa mì","GG-05",7000,true]]);
  assert.equal(priceText(15000), "15.000 ₫");
  assert.equal(normalized("  DỊCH VỤ  "), "dich vu");
  assert.equal(normalized("Đậu Hà Lan"), "dau ha lan");
});
test("Giá và đơn vị phải hợp lệ; mã loại thuê duy nhất và khóa mã đã sử dụng", () => {
  const r = initialPricing.rentals[0];
  assert.ok(validateRental({...r, name:" "},initialPricing,r.id).name);
  assert.ok(validateRental({...r, code:" tk-02 "},initialPricing).code);
  assert.ok(validateRental({...r, code:"TK-99"},initialPricing,r.id).code);
  for(const price of [-1,NaN,Infinity,1.2,Number.MAX_SAFE_INTEGER+1]) assert.ok(validateRental({...r,price},initialPricing,r.id).price);
  assert.deepEqual(validateRental({...r,price:0},initialPricing,r.id),{});
  assert.ok(validateRental({...r,unit:"khay / ngày"},initialPricing,r.id).unit);
  const unused = initialPricing.rentals[3];
  assert.deepEqual(validateRental({...unused,code:"TK-NEW"},initialPricing,unused.id),{});
  assert.ok(rentalWasUsed(r.id)); assert.equal(rentalWasUsed(unused.id),false);
});
test("Chỉ giống hoạt động được thêm giá, chặn trùng giống/đơn vị và không tự bật danh mục", () => {
  const s = initialPricing.seeds[0];
  assert.ok(validateSeedPrice(s,initialPricing,initialVarieties).unit);
  assert.deepEqual(validateSeedPrice({...s,unit:"gói 50 g / khay"},initialPricing,initialVarieties),{});
  assert.ok(validateSeedPrice({...s,varietyId:"var-4"},initialPricing,initialVarieties).varietyId);
  assert.ok(validateSeedPrice({...s,varietyId:"khong-co"},initialPricing,initialVarieties).varietyId);
  assert.ok(validateSeedPrice({...s,price:-10},initialPricing,initialVarieties,s.id).price);
  const disabled=initialPricing.seeds[3];
  assert.deepEqual(validateSeedPrice({...disabled,price:12000},initialPricing,initialVarieties,disabled.id),{});
  assert.ok(validateSeedPrice({...disabled,enabled:true},initialPricing,initialVarieties,disabled.id).varietyId);
  const catalog=initialVarieties.map(v=>v.id===s.varietyId?{...v,enabledForNewRentals:false}:v);
  assert.equal(seedSelectable(s,catalog),false);
});
test("Lưu giá mới không sửa giá thỏa thuận hoặc tổng tiền đơn hàng lịch sử", () => {
  const rates=JSON.stringify(agreedRates), orders=JSON.stringify(initialOrders), original=JSON.stringify(initialPricing);
  for(const a of agreedRates) assert.equal(initialOrders.find(o=>o.id===a.orderId)?.kind,"rental");
  let state=saveRental(initialPricing,{...initialPricing.rentals[0],price:19000,enabled:false},"rental-1");
  state=saveSeedPrice(state,{...state.seeds[0],price:15000,enabled:false},initialVarieties,"seed-price-1");
  assert.equal(state.rentals[0].price,19000); assert.equal(state.seeds[0].price,15000);
  assert.equal(state.rentals[0].version,2); assert.equal(state.seeds[0].version,2);
  assert.equal(JSON.stringify(agreedRates),rates);assert.equal(JSON.stringify(initialOrders),orders);assert.equal(JSON.stringify(initialPricing),original);
  assert.ok(seedWasUsed("seed-price-1"));assert.equal(seedWasUsed("seed-price-5"),false);
});
test("Tạo mới chuẩn hóa mã, cấp mã bảng giá riêng và giữ các bản ghi trước", () => {
  let state=saveRental(initialPricing,{...initialPricing.rentals[0],code:" tk-05 ",name:" Loại mới "});
  assert.equal(state.rentals[4].name,"Loại mới");assert.equal(state.rentals[4].code,"TK-05");
  state=saveSeedPrice(state,{...initialPricing.seeds[0],varietyId:"var-5",unit:"gói 25 g / khay"},initialVarieties);
  assert.equal(state.seeds[5].code,"GG-06");assert.equal(state.seeds[5].varietyId,"var-5");
  assert.equal(initialVarieties.find(v=>v.id==="var-5")?.code,"GR-005");
  assert.throws(()=>saveRental(state,{...state.rentals[0],code:"TK-05"}));
  assert.throws(()=>saveSeedPrice(state,{...state.seeds[0]},initialVarieties));
});
