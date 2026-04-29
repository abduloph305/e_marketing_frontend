import { useContext, useEffect, useMemo, useState } from 'react'
import { Download, Eye } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'
import { api } from '../../lib/api.js'

const numberFormat = new Intl.NumberFormat('en-IN')

const formatNumber = (value = 0) => numberFormat.format(value || 0)

const formatCurrency = (value = 0, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value || 0)

const formatDate = (value) => {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Checkout is available only in browser'))
      return
    }

    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Razorpay), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout'))
    document.body.appendChild(script)
  })

function UsageBar({ label, used, limit, remaining }) {
  const percentage = limit ? Math.min(Math.round((used / limit) * 100), 100) : 0
  const isNearLimit = percentage >= 80
  const isExhausted = percentage >= 100

  return (
    <article className="shell-card-strong p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[17px] font-semibold text-[#21192d]">{label}</h3>
          <p className="mt-1 text-sm text-[#7b7592]">
            {formatNumber(used)} of {formatNumber(limit)} emails used
          </p>
        </div>
        <span
          className={`border px-3 py-1.5 text-xs font-semibold ${
            isExhausted
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : isNearLimit
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {formatNumber(remaining)} left
        </span>
      </div>
      <div className="mt-5 h-3 overflow-hidden bg-[#eee9f8]">
        <div
          className={`h-full ${
            isExhausted ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#5f5375]">{percentage}% used</p>
    </article>
  )
}

function PlanCard({ busyKey, currentPlanId, onCheckout, plan }) {
  const isCurrent = String(currentPlanId || '') === String(plan._id || '')
  const isFreePlan = Number(plan.monthlyPrice || 0) <= 0 && Number(plan.yearlyPrice || 0) <= 0
  const monthlyKey = `${plan._id}:monthly`
  const yearlyKey = `${plan._id}:yearly`
  const isMonthlyBusy = busyKey === monthlyKey
  const isYearlyBusy = busyKey === yearlyKey

  return (
    <article className={`border p-5 ${isCurrent ? 'border-[#8338ec] bg-[#fbf8ff]' : 'border-[#ded7ef] bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-semibold text-[#21192d]">{plan.name}</h3>
          <p className="mt-2 min-h-10 text-sm leading-5 text-[#7b7592]">{plan.description}</p>
        </div>
        {isCurrent ? (
          <span className="bg-[#8338ec] px-3 py-1.5 text-xs font-semibold text-white">Current</span>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="border border-[#eee9f8] bg-white p-3">
          <p className="text-[11px] font-semibold uppercase text-[#9b8caf]">Monthly</p>
          <p className="mt-1 text-[19px] font-semibold text-[#21192d]">
            {formatCurrency(plan.monthlyPrice, plan.currency)}
          </p>
        </div>
        <div className="border border-[#eee9f8] bg-white p-3">
          <p className="text-[11px] font-semibold uppercase text-[#9b8caf]">Yearly</p>
          <p className="mt-1 text-[19px] font-semibold text-[#21192d]">
            {formatCurrency(plan.yearlyPrice, plan.currency)}
          </p>
        </div>
        <div className="border border-[#eee9f8] bg-white p-3">
          <p className="text-[11px] font-semibold uppercase text-[#9b8caf]">Daily Emails</p>
          <p className="mt-1 text-[19px] font-semibold text-[#21192d]">{formatNumber(plan.emailsPerDay)}</p>
        </div>
        <div className="border border-[#eee9f8] bg-white p-3">
          <p className="text-[11px] font-semibold uppercase text-[#9b8caf]">Monthly Emails</p>
          <p className="mt-1 text-[19px] font-semibold text-[#21192d]">{formatNumber(plan.emailsPerMonth)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(plan.features || []).map((feature) => (
          <span key={feature} className="bg-[#f5efff] px-2.5 py-1 text-xs font-semibold text-[#5a4380]">
            {feature}
          </span>
        ))}
      </div>

      {isCurrent || isFreePlan ? (
        <button
          type="button"
          disabled
          className="mt-5 w-full border border-[#ded7ef] bg-[#f7f3fb] px-4 py-3 text-sm font-semibold text-[#8d7fa3]"
        >
          {isCurrent ? 'Current Plan' : 'Free Plan'}
        </button>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={Boolean(busyKey)}
            onClick={() => onCheckout(plan, 'monthly')}
            className="border border-[#8338ec] bg-[#8338ec] px-4 py-3 text-sm font-semibold text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMonthlyBusy ? 'Opening...' : 'Pay Monthly'}
          </button>
          <button
            type="button"
            disabled={Boolean(busyKey)}
            onClick={() => onCheckout(plan, 'yearly')}
            className="border border-[#8338ec] bg-white px-4 py-3 text-sm font-semibold text-[#8338ec] hover:bg-[#fbf8ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isYearlyBusy ? 'Opening...' : 'Pay Yearly'}
          </button>
        </div>
      )}
    </article>
  )
}

function BillingPlanPage() {
  const toast = useContext(ToastContext)
  const [snapshot, setSnapshot] = useState(null)
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyKey, setBusyKey] = useState('')
  const [invoiceBusyKey, setInvoiceBusyKey] = useState('')

  const loadBilling = async () => {
    setIsLoading(true)
    try {
      const [subscriptionResponse, plansResponse, invoicesResponse] = await Promise.all([
        api.get('/billing/me'),
        api.get('/billing/plans'),
        api.get('/billing/me/invoices'),
      ])

      setSnapshot(subscriptionResponse.data)
      setPlans(plansResponse.data.plans || [])
      setInvoices(invoicesResponse.data.invoices || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load billing details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBilling()
  }, [])

  const startCheckout = async (selectedPlan, billingCycle) => {
    const nextBusyKey = `${selectedPlan._id}:${billingCycle}`
    setBusyKey(nextBusyKey)

    try {
      const Razorpay = await loadRazorpayCheckout()
      const { data } = await api.post('/billing/razorpay/orders', {
        planId: selectedPlan._id,
        billingCycle,
      })

      const checkout = new Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'SellersLogin Email Marketing',
        description: `${data.plan.name} - ${billingCycle} billing`,
        order_id: data.order.id,
        prefill: data.prefill,
        theme: {
          color: '#8338ec',
        },
        handler: async (response) => {
          try {
            await api.post('/billing/razorpay/verify', response)
            toast.success('Payment verified. Your plan is active now.')
            await loadBilling()
          } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to verify payment')
          } finally {
            setBusyKey('')
          }
        },
        modal: {
          ondismiss: () => {
            setBusyKey('')
          },
        },
      })

      checkout.on('payment.failed', (response) => {
        toast.error(response.error?.description || 'Payment failed. Please try again.')
        setBusyKey('')
      })

      checkout.open()
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to start payment')
      setBusyKey('')
    }
  }

  const openInvoice = async (invoice) => {
    const key = `${invoice._id}:view`
    setInvoiceBusyKey(key)
    const invoiceWindow = window.open('', '_blank', 'noopener,noreferrer')

    try {
      const response = await api.get(`/billing/me/invoices/${invoice._id}`, {
        responseType: 'blob',
      })
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'text/html' }))
      if (invoiceWindow) {
        invoiceWindow.location.href = blobUrl
      } else {
        window.open(blobUrl, '_blank', 'noopener,noreferrer')
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (error) {
      invoiceWindow?.close()
      toast.error(error.response?.data?.message || 'Unable to open invoice')
    } finally {
      setInvoiceBusyKey('')
    }
  }

  const downloadInvoice = async (invoice) => {
    const key = `${invoice._id}:download`
    setInvoiceBusyKey(key)

    try {
      const response = await api.get(`/billing/me/invoices/${invoice._id}/download`, {
        responseType: 'blob',
      })
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `SellersLogin-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to download invoice')
    } finally {
      setInvoiceBusyKey('')
    }
  }

  const plan = snapshot?.plan || {}
  const subscription = snapshot?.subscription || {}
  const usage = snapshot?.usage || {}
  const featureUsage = snapshot?.featureUsage || {}

  const alert = useMemo(() => {
    if (!snapshot) {
      return null
    }

    const dayPercent = plan.emailsPerDay ? (usage.emailsSentToday / plan.emailsPerDay) * 100 : 0
    const monthPercent = plan.emailsPerMonth ? (usage.emailsSentThisMonth / plan.emailsPerMonth) * 100 : 0

    if (['payment_failed', 'expired', 'past_due'].includes(subscription.status)) {
      return {
        tone: 'danger',
        title: 'Billing action required',
        message: 'Your subscription is limited. Renew or upgrade to continue sending emails.',
      }
    }

    if (dayPercent >= 100 || monthPercent >= 100) {
      return {
        tone: 'danger',
        title: 'Email quota exhausted',
        message: 'Campaign sending is blocked until your quota resets or your plan is upgraded.',
      }
    }

    if (dayPercent >= 80 || monthPercent >= 80) {
      return {
        tone: 'warning',
        title: 'You are close to your email limit',
        message: 'Upgrade before sending larger campaigns to avoid interruptions.',
      }
    }

    return {
      tone: 'success',
      title: 'Plan is healthy',
      message: 'Your email quota is available and campaign sending can continue.',
    }
  }, [plan.emailsPerDay, plan.emailsPerMonth, snapshot, subscription.status, usage.emailsSentThisMonth, usage.emailsSentToday])

  if (isLoading && !snapshot) {
    return (
      <div className="shell-card-strong p-8 text-center text-sm font-semibold text-[#7b7592]">
        Loading billing and plan details...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          title="Billing / Plan"
          description="Review your subscription, email quota, plan limits, and invoices."
        />
        <button
          type="button"
          onClick={loadBilling}
          className="border border-[#ded7ef] bg-white px-4 py-3 text-sm font-semibold text-[#5a4380]"
        >
          Refresh
        </button>
      </div>

      {alert ? (
        <section
          className={`border px-5 py-4 ${
            alert.tone === 'danger'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : alert.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          <p className="font-semibold">{alert.title}</p>
          <p className="mt-1 text-sm">{alert.message}</p>
        </section>
      ) : null}

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Plan" value={plan.name || 'Free Plan'} hint={`${subscription.billingCycle || 'monthly'} billing`} />
        <StatCard label="Status" value={subscription.status || 'free'} hint={`Renews ${formatDate(subscription.currentPeriodEnd)}`} accent="success" />
        <StatCard
          label="Emails Today"
          value={`${formatNumber(usage.emailsSentToday)} / ${formatNumber(plan.emailsPerDay)}`}
          hint={`${formatNumber(snapshot?.remainingToday)} remaining`}
          accent="info"
        />
        <StatCard
          label="Emails This Month"
          value={`${formatNumber(usage.emailsSentThisMonth)} / ${formatNumber(plan.emailsPerMonth)}`}
          hint={`${formatNumber(snapshot?.remainingThisMonth)} remaining`}
          accent="warning"
        />
      </section>

      <section className="dashboard-grid xl:grid-cols-2">
        <UsageBar
          label="Daily Email Usage"
          used={usage.emailsSentToday || 0}
          limit={plan.emailsPerDay || 0}
          remaining={snapshot?.remainingToday || 0}
        />
        <UsageBar
          label="Monthly Email Usage"
          used={usage.emailsSentThisMonth || 0}
          limit={plan.emailsPerMonth || 0}
          remaining={snapshot?.remainingThisMonth || 0}
        />
      </section>

      <section className="shell-card-strong p-5">
        <div className="mb-5">
          <h3 className="text-[18px] font-semibold text-[#21192d]">Current Plan Limits</h3>
          <p className="mt-1 text-sm text-[#7b7592]">These limits are enforced before a campaign can send.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Automations"
            value={`${formatNumber(featureUsage.automations?.used)} / ${formatNumber(featureUsage.automations?.limit ?? plan.limits?.automations)}`}
            hint={`${formatNumber(featureUsage.automations?.remaining)} remaining`}
          />
          <StatCard
            label="Team Members"
            value={`${formatNumber(featureUsage.teamMembers?.used)} / ${formatNumber(featureUsage.teamMembers?.limit ?? plan.limits?.teamMembers)}`}
            hint={`${formatNumber(featureUsage.teamMembers?.remaining)} remaining`}
          />
          <StatCard
            label="Templates"
            value={`${formatNumber(featureUsage.templates?.used)} / ${formatNumber(featureUsage.templates?.limit ?? plan.limits?.templates)}`}
            hint={`${formatNumber(featureUsage.templates?.remaining)} remaining`}
          />
          <StatCard
            label="Segments"
            value={`${formatNumber(featureUsage.segments?.used)} / ${formatNumber(featureUsage.segments?.limit ?? plan.limits?.segments)}`}
            hint={`${formatNumber(featureUsage.segments?.remaining)} remaining`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-[20px] font-semibold text-[#21192d]">Available Plans</h3>
          <p className="mt-1 text-sm text-[#7b7592]">Choose monthly or yearly billing and complete payment through Razorpay.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map((item) => (
            <PlanCard
              key={item._id}
              busyKey={busyKey}
              currentPlanId={plan._id}
              onCheckout={startCheckout}
              plan={item}
            />
          ))}
        </div>
      </section>

      <section className="shell-card-strong overflow-hidden">
        <div className="border-b border-[#eee9f8] px-5 py-4">
          <h3 className="text-[18px] font-semibold text-[#21192d]">Invoices</h3>
          {/* <p className="mt-1 text-sm text-[#7b7592]">Payment and GST invoice records for this workspace.</p> */}
        </div>
        {invoices.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#fbf9ff] text-[#6e5a93]">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">GST</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Issued</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9f8]">
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="px-5 py-4 font-semibold text-[#21192d]">{invoice.invoiceNumber}</td>
                    <td className="px-5 py-4 text-[#7b7592]">{formatCurrency(invoice.gstAmount, invoice.currency)}</td>
                    <td className="px-5 py-4 font-semibold text-[#21192d]">{formatCurrency(invoice.total, invoice.currency)}</td>
                    <td className="px-5 py-4 text-[#7b7592]">{invoice.status}</td>
                    <td className="px-5 py-4 text-[#7b7592]">{formatDate(invoice.issuedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                       
                        <button
                          type="button"
                          title="Download invoice"
                          disabled={Boolean(invoiceBusyKey)}
                          onClick={() => downloadInvoice(invoice)}
                          className="inline-flex h-9 w-9 items-center justify-center border border-[#8338ec] bg-[#8338ec] text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#7b7592]">
            Invoices will appear after a paid plan is activated or payment is completed.
          </div>
        )}
      </section>
    </div>
  )
}

export default BillingPlanPage
