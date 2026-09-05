"use client";

import { useEffect } from "react";
import { useSettingsFeedback } from "@/components/settings/settings-feedback";

export function BillingFlashNotifier({ show }: { show: boolean }) {
  const { showFeedback } = useSettingsFeedback();

  useEffect(() => {
    if (show) showFeedback("Billing updated successfully.");
  }, [show, showFeedback]);

  return null;
}
