export const segmentPresets = [
  {
    id: "inactiveUsers",
    name: "Inactive users",
    description: "Reach subscribers who have gone quiet for a while.",
    rules: [{ field: "inactiveUsers", operator: "gte", value: "30" }],
  },
  {
    id: "repeatBuyers",
    name: "Repeat buyers",
    description: "Target customers with more than one order.",
    rules: [{ field: "repeatBuyers", operator: "gte", value: "2" }],
  },
  {
    id: "highValueCustomers",
    name: "High value customers",
    description: "Focus on the strongest spenders in your audience.",
    rules: [{ field: "highValueCustomers", operator: "gte", value: "500" }],
  },
  {
    id: "openedButDidNotClick",
    name: "Opened but did not click",
    description: "Re-engage people who opened but never clicked through.",
    rules: [{ field: "openedButDidNotClick", operator: "eq", value: "true" }],
  },
  {
    id: "cartAbandoners",
    name: "Cart abandoners",
    description: "Bring back subscribers with abandoned cart signals.",
    rules: [{ field: "cartAbandoners", operator: "eq", value: "true" }],
  },
];

export const getSegmentPreset = (presetId) =>
  segmentPresets.find((preset) => preset.id === presetId);
