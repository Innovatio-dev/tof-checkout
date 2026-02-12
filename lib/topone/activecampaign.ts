import "server-only";

type ActiveCampaignContactPayload = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  customFields: {
    billingCountry?: string;
    billingAddress?: string;
    billingCity?: string;
    billingState?: string;
    billingPostcode?: string;
  };
};

type ActiveCampaignConfig = {
  enabled: boolean;
  apiBase: string;
  apiKey: string;
  tagId?: number;
  listId?: number;
  fieldIds: {
    billingCountry: number;
    billingAddress: number;
    billingCity: number;
    billingState: number;
    billingPostcode: number;
  };
};

const ACTIVE_CAMPAIGN_FIELD_IDS = {
  billingCountry: 11,
  billingAddress: 6,
  billingCity: 8,
  billingState: 9,
  billingPostcode: 10,
} as const;

const getActiveCampaignConfig = (): ActiveCampaignConfig => {
  const enabled = process.env.ACTIVE_CAMPAIGN_ENABLED === "true";
  const apiBase = process.env.ACTIVE_CAMPAIGN_API_BASE?.trim().replace(/\/+$/, "") ?? "";
  const apiKey = process.env.ACTIVE_CAMPAIGN_API_KEY?.trim() ?? "";

  const toNumber = (value: string | undefined) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    enabled,
    apiBase,
    apiKey,
    tagId: toNumber(process.env.ACTIVE_CAMPAIGN_TAG_ID),
    listId: toNumber(process.env.ACTIVE_CAMPAIGN_LIST_ID),
    fieldIds: ACTIVE_CAMPAIGN_FIELD_IDS,
  };
};

const buildHeaders = (apiKey: string) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "Api-Token": apiKey,
});

const requestJson = async <T>(input: string, init: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const bodyText = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(`ActiveCampaign request failed: ${response.status} ${response.statusText} ${bodyText}`);
  }
  return (bodyText ? JSON.parse(bodyText) : {}) as T;
};

const buildFieldValues = (config: ActiveCampaignConfig, payload: ActiveCampaignContactPayload) => {
  const entries: Array<{ field: number; value: string }> = [];
  const { customFields } = payload;

  const addValue = (fieldId: number, value?: string) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    entries.push({ field: fieldId, value: trimmed });
  };

  addValue(config.fieldIds.billingCountry, customFields.billingCountry);
  addValue(config.fieldIds.billingAddress, customFields.billingAddress);
  addValue(config.fieldIds.billingCity, customFields.billingCity);
  addValue(config.fieldIds.billingState, customFields.billingState);
  addValue(config.fieldIds.billingPostcode, customFields.billingPostcode);

  return entries;
};

export const syncActiveCampaignContact = async (payload: ActiveCampaignContactPayload) => {
  const config = getActiveCampaignConfig();
  if (!config.enabled) return;
  if (!config.apiBase || !config.apiKey) {
    console.warn("[ActiveCampaign] Missing API configuration");
    return;
  }

  if (!payload.email || !payload.firstName || !payload.lastName || !payload.phone) {
    return;
  }

  const email = payload.email.trim().toLowerCase();
  if (!email) return;

  try {
    const contactLookup = await requestJson<{ contacts?: Array<{ id?: string }> }>(
      `${config.apiBase}/contacts?email=${encodeURIComponent(email)}`,
      {
        headers: buildHeaders(config.apiKey),
      }
    );

    let contactId = contactLookup.contacts?.[0]?.id ?? null;
    const fieldValues = buildFieldValues(config, payload);

    if (!contactId) {
      const createResponse = await requestJson<{ contact?: { id?: string } }>(`${config.apiBase}/contacts`, {
        method: "POST",
        headers: buildHeaders(config.apiKey),
        body: JSON.stringify({
          contact: {
            email,
            firstName: payload.firstName.trim(),
            lastName: payload.lastName.trim(),
            phone: payload.phone.trim(),
            fieldValues,
          },
        }),
      });
      contactId = createResponse.contact?.id ?? null;
    }

    if (!contactId) return;

    if (fieldValues.length) {
      await Promise.all(
        fieldValues.map((fieldValue) =>
          requestJson(`${config.apiBase}/fieldValues`, {
            method: "POST",
            headers: buildHeaders(config.apiKey),
            body: JSON.stringify({
              fieldValue: {
                contact: contactId,
                field: fieldValue.field,
                value: fieldValue.value,
              },
            }),
          })
        )
      );
    }

    if (config.tagId) {
      await requestJson(`${config.apiBase}/contactTags`, {
        method: "POST",
        headers: buildHeaders(config.apiKey),
        body: JSON.stringify({
          contactTag: {
            contact: contactId,
            tag: config.tagId,
          },
        }),
      });
    }

    if (config.listId) {
      await requestJson(`${config.apiBase}/contactLists`, {
        method: "POST",
        headers: buildHeaders(config.apiKey),
        body: JSON.stringify({
          contactList: {
            list: config.listId,
            contact: contactId,
            status: 1,
          },
        }),
      });
    }
  } catch (error) {
    console.warn("[ActiveCampaign] sync failed", error);
  }
};
