export const workflowStatusTabs = ['all', 'draft', 'active', 'inactive', 'archived']

export const triggerLabels = {
  welcome_signup: 'Welcome signup',
  abandoned_cart: 'Abandoned cart',
  browse_abandonment: 'Browse abandonment',
  order_followup: 'Order follow-up',
  review_request: 'Review request',
  win_back: 'Win-back',
  price_drop: 'Price drop',
  back_in_stock: 'Back in stock',
  inactive_subscriber: 'Inactive subscriber',
}

export const stepTypeLabels = {
  delay: 'Delay',
  condition: 'Condition',
  send_email: 'Send email',
  add_tag: 'Add tag',
  remove_tag: 'Remove tag',
  webhook: 'Webhook',
  exit: 'Exit',
}

export const createWorkflowStep = (type = 'send_email') => ({
  type,
  title: stepTypeLabels[type] || 'Workflow step',
  description: '',
  config:
    type === 'delay'
      ? { unit: 'hours', value: 24 }
      : type === 'condition'
        ? { field: 'engagementScore', operator: 'gte', value: '50' }
        : type === 'send_email'
          ? { templateId: '', subjectOverride: '' }
          : type === 'add_tag' || type === 'remove_tag'
            ? { tag: '' }
            : type === 'webhook'
              ? { url: '', method: 'POST' }
              : {},
})
