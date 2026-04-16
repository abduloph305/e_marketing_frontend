const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const buildTemplateHtml = (form) => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#64748b;font-weight:700;">${escapeHtml(form.eyebrow)}</p>
                <h1 style="margin:0;font-size:34px;line-height:1.15;color:#0f172a;font-weight:700;">${escapeHtml(form.headline)}</h1>
                <p style="margin:16px 0 0;font-size:16px;line-height:1.8;color:#334155;white-space:pre-line;">${escapeHtml(form.bodyText).replaceAll("\n", "<br />")}</p>
                <div style="margin-top:24px;">
                  <img src="${escapeHtml(form.imageUrl)}" alt="${escapeHtml(form.imageAlt)}" style="display:block;width:100%;border-radius:24px;object-fit:cover;" />
                </div>
                <div style="margin-top:24px;">
                  <a href="${escapeHtml(form.ctaUrl)}" style="display:inline-block;text-decoration:none;font-size:15px;font-weight:700;padding:13px 20px;border-radius:12px;background:#635bff;color:#fff;border:1px solid #635bff;">${escapeHtml(form.ctaText)}</a>
                </div>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:#64748b;">${escapeHtml(form.footerNote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const templatePresets = [
  {
    key: "welcome_series",
    name: "Welcome Series",
    category: "Ready-made",
    description: "A warm welcome journey for new subscribers.",
    subject: "Welcome, {{firstName}}",
    previewText: "Start your journey with a quick hello and key links.",
    variables: ["{{firstName}}", "{{email}}"],
    form: {
      eyebrow: "Welcome",
      headline: "Thanks for joining us, {{firstName}}",
      bodyText:
        "We are excited to have you here. Discover your dashboard, browse featured products, and get started with a quick tour designed for you.",
      ctaText: "Explore now",
      ctaUrl: "https://sellerslogin.com/overview",
      imageUrl:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Welcome onboarding",
      footerNote: "You are receiving this email because you signed up for updates.",
    },
  },
  {
    key: "welcome_signup",
    name: "Signup Email",
    category: "Ready-made",
    description: "An instant signup confirmation with a friendly first touch.",
    subject: "Thanks for signing up, {{firstName}}",
    previewText: "A quick confirmation and welcome message for new users.",
    variables: ["{{firstName}}", "{{email}}"],
    form: {
      eyebrow: "Signup confirmed",
      headline: "Welcome aboard, {{firstName}}",
      bodyText:
        "Thanks for signing up. We have created your account and you can now explore your dashboard, saved offers, and recommended products.",
      ctaText: "Open dashboard",
      ctaUrl: "https://sellerslogin.com/overview",
      imageUrl:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Signup email",
      footerNote: "You are receiving this because you created a new account.",
    },
  },
  {
    key: "abandoned_cart_recovery",
    name: "Abandoned Cart Recovery",
    category: "Ready-made",
    description: "A reminder email to recover missed checkouts.",
    subject: "You left items behind, {{firstName}}",
    previewText: "Come back and finish your checkout in a few clicks.",
    variables: [
      "{{firstName}}",
      "{{customFields.ophmateCartItemsSummary}}",
      "{{customFields.ophmateCartValue}}",
    ],
    form: {
      eyebrow: "Cart recovery",
      headline: "Your cart is waiting, {{firstName}}",
      bodyText:
        "Items you picked are still reserved for you: {{customFields.ophmateCartItemsSummary}}. Return to your cart and complete checkout before they sell out.",
      ctaText: "Return to cart",
      ctaUrl: "https://sellerslogin.com/cart",
      imageUrl:
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Abandoned cart",
      footerNote: "This reminder is sent automatically when checkout is not completed.",
    },
  },
  {
    key: "order_confirmation",
    name: "Order Confirmation",
    category: "Ready-made",
    description: "A clean thank-you email after a purchase or COD order.",
    subject: "Order {{customFields.ophmateOrderNumber}} is confirmed",
    previewText: "Thanks for shopping with us. Here is your order summary.",
    variables: [
      "{{firstName}}",
      "{{customFields.ophmateOrderNumber}}",
      "{{customFields.ophmateItemsSummary}}",
      "{{customFields.ophmateShippingAddressText}}",
    ],
    form: {
      eyebrow: "Order update",
      headline: "Thanks for your order, {{firstName}}",
      bodyText:
        "Your order {{customFields.ophmateOrderNumber}} is confirmed. Items: {{customFields.ophmateItemsSummary}}. Shipping to: {{customFields.ophmateShippingAddressText}}.",
      ctaText: "View order",
      ctaUrl: "https://sellerslogin.com/orders",
      imageUrl:
        "https://images.unsplash.com/photo-1556740720-0d7f8f2f7f0f?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Order confirmation",
      footerNote: "A confirmation will remain in your order history for easy reference.",
    },
  },
  {
    key: "payment_success_thank_you",
    name: "Payment Success / Thank You",
    category: "Ready-made",
    description: "A thank-you email for successful payments with order details.",
    subject: "Payment received for {{customFields.ophmateOrderNumber}}",
    previewText: "A quick thank-you after a successful payment.",
    variables: [
      "{{firstName}}",
      "{{customFields.ophmateOrderNumber}}",
      "{{customFields.ophmateOrderDate}}",
      "{{customFields.ophmateOrderTime}}",
    ],
    form: {
      eyebrow: "Thank you",
      headline: "Payment successful, {{firstName}}",
      bodyText:
        "We have received your payment for order {{customFields.ophmateOrderNumber}} on {{customFields.ophmateOrderDate}} at {{customFields.ophmateOrderTime}}. Thank you for shopping with us.",
      ctaText: "View receipt",
      ctaUrl: "https://sellerslogin.com/orders",
      imageUrl:
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Thank you email",
      footerNote: "If you have questions, reply to this email and our team will help.",
    },
  },
  {
    key: "follow_up_sequence",
    name: "Follow-up Sequence",
    category: "Ready-made",
    description: "A friendly post-purchase follow-up with support and next steps.",
    subject: "How is everything going, {{firstName}}?",
    previewText: "A follow-up email to keep the conversation going.",
    variables: ["{{firstName}}", "{{customFields.ophmateOrderNumber}}"],
    form: {
      eyebrow: "Follow-up",
      headline: "We hope everything is going well, {{firstName}}",
      bodyText:
        "Just checking in after your recent order {{customFields.ophmateOrderNumber}}. If you need any help, our team is here for you.",
      ctaText: "Contact support",
      ctaUrl: "https://sellerslogin.com/support",
      imageUrl:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Follow-up sequence",
      footerNote: "We send follow-up messages to help you get the best experience.",
    },
  },
  {
    key: "reminder_email",
    name: "Reminder Email",
    category: "Ready-made",
    description: "A simple reminder for due actions, events, or renewals.",
    subject: "Friendly reminder for {{firstName}}",
    previewText: "Use this for reminders, renewals, and due dates.",
    variables: ["{{firstName}}", "{{customFields.ophmateReminderType}}"],
    form: {
      eyebrow: "Reminder",
      headline: "A quick reminder, {{firstName}}",
      bodyText:
        "This is a gentle reminder for {{customFields.ophmateReminderType}}. Please review the details and take the next step when you are ready.",
      ctaText: "Review now",
      ctaUrl: "https://sellerslogin.com/overview",
      imageUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Reminder email",
      footerNote: "You are receiving this reminder because it is relevant to your account.",
    },
  },
  {
    key: "discount_offer",
    name: "Discount Offer",
    category: "Ready-made",
    description: "A conversion-focused template with urgency and offer copy.",
    subject: "A special offer just for you, {{firstName}}",
    previewText: "Use this template for limited-time offers and win-back flows.",
    variables: [
      "{{firstName}}",
      "{{customFields.ophmateDiscountCode}}",
      "{{customFields.ophmateOrderNumber}}",
    ],
    form: {
      eyebrow: "Special offer",
      headline: "Save more today, {{firstName}}",
      bodyText:
        "Unlock a time-sensitive discount on your next purchase. Use code {{customFields.ophmateDiscountCode}} before the offer expires.",
      ctaText: "Claim offer",
      ctaUrl: "https://sellerslogin.com/offers",
      imageUrl:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Discount offer",
      footerNote: "Offer terms and expiry can be customized before sending.",
    },
  },
];

export const getTemplatePreset = (key = "") =>
  templatePresets.find((preset) => preset.key === key) || null;

export const applyTemplatePreset = (baseForm, key = "") => {
  const preset = getTemplatePreset(key);
  if (!preset) {
    return baseForm;
  }

  return {
    ...baseForm,
    name: preset.name,
    subject: preset.subject,
    previewText: preset.previewText,
    ...preset.form,
  };
};

export { templatePresets };
