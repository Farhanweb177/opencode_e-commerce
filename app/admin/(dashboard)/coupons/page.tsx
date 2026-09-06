import { getCoupons } from "@/lib/admin-queries";
import { isAdminConfigured } from "@/lib/admin-auth";
import { DeleteButton } from "../DeleteButton";
import {
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();
  const today = new Date().toISOString().slice(0, 10);

  const couponsWithState = coupons.map((coupon) => ({
    ...coupon,
    expired:
      coupon.expires_at !== null && coupon.expires_at < today,
    usedUp:
      coupon.max_uses !== null && coupon.used_count >= coupon.max_uses,
  }));

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Coupons</h1>
          <p>
            Discount codes customers checkout par apply kar sakte hain
          </p>
        </div>
      </header>

      {!isAdminConfigured() && (
        <p className="admin-alert admin-alert-warn">
          Database connected nahi — coupons save nahi honge.
        </p>
      )}

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Add New Coupon</h2>
        </div>
        <form action={createCoupon} className="category-add-form coupon-add-form">
          <input
            name="code"
            placeholder="Code * e.g. SUMMER20"
            required
            className="cat-input"
            style={{ textTransform: "uppercase" }}
          />
          <select name="discountType" className="cat-input" defaultValue="percent">
            <option value="percent">% OFF</option>
            <option value="fixed">Fixed Rs.</option>
          </select>
          <input
            name="discountValue"
            type="number"
            min="1"
            placeholder="Value *"
            required
            className="cat-input cat-input-sm"
          />
          <input
            name="minSubtotal"
            type="number"
            min="0"
            placeholder="Min order (Rs.)"
            defaultValue="0"
            className="cat-input cat-input-sm"
          />
          <input
            name="maxUses"
            type="number"
            min="1"
            placeholder="Max uses"
            className="cat-input cat-input-sm"
          />
          <input
            name="expiresAt"
            type="date"
            placeholder="Expiry"
            className="cat-input"
          />
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
      </section>

      <section className="coupons-admin-list">
        {coupons.length === 0 ? (
          <div className="admin-empty-box">
            <p>Koi coupon nahi bana. Upar wale form se pehla coupon banayein.</p>
            <p>
              Tip: Checkout page par WELCOME10 aur FLAT150 starter coupons seed
              migration se aa jayenge.
            </p>
          </div>
        ) : (
          couponsWithState.map((coupon) => {
            const { expired, usedUp } = coupon;
            return (
              <div
                key={coupon.code}
                className="admin-card coupon-row"
              >
                <form action={updateCoupon} className="coupon-row-edit">
                  <input type="hidden" name="originalCode" value={coupon.code} />
                  <span className="coupon-code-badge">
                    {coupon.code}
                    <small className={coupon.active ? "ok" : ""}>
                      {coupon.active ? "Active" : "Paused"} · Used{" "}
                      {coupon.used_count}
                      {coupon.max_uses ? `/${coupon.max_uses}` : ""}
                    </small>
                    {expired && <small className="danger">Expired</small>}
                    {usedUp && <small className="danger">All used</small>}
                  </span>
                  <div className="coupon-row-fields">
                    <div className="category-row-meta">
                      <select
                        name="discountType"
                        defaultValue={coupon.discount_type}
                      >
                        <option value="percent">% OFF</option>
                        <option value="fixed">Fixed Rs.</option>
                      </select>
                      <input
                        name="discountValue"
                        type="number"
                        min="1"
                        defaultValue={coupon.discount_value}
                        className="cat-input-sm"
                        aria-label="Discount value"
                      />
                      <input
                        name="minSubtotal"
                        type="number"
                        min="0"
                        defaultValue={coupon.min_subtotal}
                        className="cat-input-sm"
                        aria-label="Min subtotal"
                      />
                      <input
                        name="maxUses"
                        type="number"
                        min="1"
                        placeholder="Max uses"
                        defaultValue={coupon.max_uses ?? ""}
                        className="cat-input-sm"
                        aria-label="Max uses"
                      />
                      <input
                        name="expiresAt"
                        type="date"
                        defaultValue={
                          coupon.expires_at
                            ? new Date(coupon.expires_at)
                                .toISOString()
                                .slice(0, 10)
                            : ""
                        }
                        aria-label="Expiry date"
                      />
                    </div>
                  </div>
                  <button type="submit" className="admin-action-btn" title="Save">
                    💾
                  </button>
                </form>
                <div className="admin-actions-cell">
                  <form action={toggleCoupon} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={coupon.code} />
                    <input
                      type="hidden"
                      name="active"
                      value={String(coupon.active)}
                    />
                    <button
                      type="submit"
                      className="admin-action-btn"
                      title={coupon.active ? "Pause" : "Activate"}
                    >
                      {coupon.active ? "⏸" : "▶️"}
                    </button>
                  </form>
                  <DeleteButton
                    id={coupon.code}
                    serverAction={deleteCoupon}
                    confirmText={`Coupon "${coupon.code}" delete karna hai?`}
                  />
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}