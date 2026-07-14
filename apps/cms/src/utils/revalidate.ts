type LifecycleEvent = {
  action?: string;
  result?: unknown;
  params?: {
    where?: unknown;
    data?: unknown;
  };
};

type RevalidatePayload = {
  model: string;
  action: string;
  slug?: string;
};

export async function revalidateFrontend(model: string, event: LifecycleEvent) {
  const url = process.env.FRONTEND_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;

  const payload: RevalidatePayload = {
    model,
    action: event.action ?? "change",
    slug: extractSlug(event.result) ?? extractSlug(event.params?.data) ?? extractSlug(event.params?.where)
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`Frontend revalidation failed for ${model}: ${response.status}`);
    }
  } catch (error) {
    console.warn(`Frontend revalidation request failed for ${model}: ${error instanceof Error ? error.message : "unknown"}`);
  }
}

function extractSlug(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  return typeof record.slug === "string" ? record.slug : undefined;
}
