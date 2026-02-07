import { NextRequest, NextResponse } from "next/server";
import {
  getProductById,
  getProductVariationById,
  isWooCommerceConfigured,
} from "@/lib/woocommerce";

type PriceEntry = { wooId: string; wooVariantId?: string; recurrence: string; platforms: Record<string, number> };
type PriceTable = Record<string, Record<string, PriceEntry>>;
type Option = { value: string; label: string };

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  "one-step-elite": "1- Step ELITE Challenge",
  "instant-sim-funded": "INSTANT Sim Funded",
  "s2f-sim-pro": "S2F Sim PRO",
  "ignite-instant": "IGNITE Instant Funding",
};

const ACCOUNT_SIZE_LABELS: Record<string, string> = {
  "25k": "$25,000",
  "50k": "$50,000",
  "100k": "$100,000",
  "150k": "$150,000",
  "250k": "$250,000",
};

const PLATFORM_LABELS: Record<string, string> = {
  "tradovate-ninjatrader": "Tradovate / Ninjatrader",
};

const PRICE_TABLE: PriceTable = {
  "one-step-elite": {
    "25k": {
      wooId: "167",
      recurrence: "monthly",
      platforms: { "tradovate-ninjatrader": 69 },
    },
    "50k": {
      wooId: "168",
      recurrence: "monthly",
      platforms: { "tradovate-ninjatrader": 105 },
    },
    "100k": {
      wooId: "169",
      recurrence: "monthly",
      platforms: { "tradovate-ninjatrader": 209 },
    },
    "150k": {
      wooId: "170",
      recurrence: "monthly",
      platforms: { "tradovate-ninjatrader": 309 },
    },
  },
  "instant-sim-funded": {
    "25k": {
      wooId: "135",
      wooVariantId: "137",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 419 },
    },
    "50k": {
      wooId: "135",
      wooVariantId: "140",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 679 },
    },
    "100k": {
      wooId: "135",
      wooVariantId: "143",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 821 },
    },
    "150k": {
      wooId: "135",
      wooVariantId: "146",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 939 },
    },
  },
  "s2f-sim-pro": {
    "25k": {
      wooId: "135",
      wooVariantId: "138",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 257 },
    },
    "50k": {
      wooId: "135",
      wooVariantId: "141",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 421 },
    },
    "100k": {
      wooId: "135",
      wooVariantId: "144",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 632 },
    },
    "150k": {
      wooId: "135",
      wooVariantId: "147",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 727 },
    },
  },
  "ignite-instant": {
    "25k": {
      wooId: "135",
      wooVariantId: "148",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 218 },
    },
    "50k": {
      wooId: "135",
      wooVariantId: "149",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 398 },
    },
    "100k": {
      wooId: "135",
      wooVariantId: "150",
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 563 },
    },
  },
};

const resolvePrice = (accountType: string, accountSize: string, platform: string) => {
  return PRICE_TABLE[accountType]?.[accountSize]?.platforms?.[platform] ?? null;
};

const resolveWooIds = (accountType: string, accountSize: string) => {
  const entry = PRICE_TABLE[accountType]?.[accountSize];

  if (!entry) {
    return null;
  }

  return {
    productId: Number(entry.wooId),
    variationId: entry.wooVariantId ? Number(entry.wooVariantId) : null,
  };
};

const resolveWooPrice = async (accountType: string, accountSize: string) => {
  if (!isWooCommerceConfigured()) {
    return null;
  }

  const ids = resolveWooIds(accountType, accountSize);

  if (!ids || Number.isNaN(ids.productId)) {
    return null;
  }

  try {
    if (ids.variationId && !Number.isNaN(ids.variationId)) {
      const variation = await getProductVariationById(ids.productId, ids.variationId);
      return variation.price ? Number(variation.price) : null;
    }

    const product = await getProductById(ids.productId);
    return product.price ? Number(product.price) : null;
  } catch (error) {
    console.error("Failed to fetch WooCommerce price:", error);
    return null;
  }
};

const resolveRecurrence = (accountType: string, accountSize: string) => {
  return PRICE_TABLE[accountType]?.[accountSize]?.recurrence ?? null;
};

const buildAccountTypeOptions = () => {
  return Object.keys(PRICE_TABLE).map((value) => ({
    value,
    label: ACCOUNT_TYPE_LABELS[value] ?? value,
  }));
};

const buildOptionsForAccountType = (accountType?: string) => {
  if (!accountType || !PRICE_TABLE[accountType]) {
    return {
      accountSizes: [] as Option[],
      platforms: [] as Option[],
    };
  }

  const sizes = Object.keys(PRICE_TABLE[accountType]);
  const platforms = Array.from(
    new Set(
      Object.values(PRICE_TABLE[accountType]).flatMap((entry) => Object.keys(entry.platforms))
    )
  );

  return {
    accountSizes: sizes.map((value) => ({
      value,
      label: ACCOUNT_SIZE_LABELS[value] ?? value,
    })),
    platforms: platforms.map((value) => ({
      value,
      label: PLATFORM_LABELS[value] ?? value,
    })),
  };
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountType = searchParams.get("accountType") ?? undefined;

  return NextResponse.json({
    accountTypes: buildAccountTypeOptions(),
    ...buildOptionsForAccountType(accountType),
  });
}

export async function POST(request: NextRequest) {
  const { accountType, accountSize, platform } = (await request.json()) as {
    accountType?: string;
    accountSize?: string;
    platform?: string;
  };

  if (!accountType || !accountSize || !platform) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const price = resolvePrice(accountType, accountSize, platform);
  const recurrence = resolveRecurrence(accountType, accountSize);
  const wooIds = resolveWooIds(accountType, accountSize);
  const wooPrice = await resolveWooPrice(accountType, accountSize);
  const resolvedPrice = wooPrice ?? price;

  if (resolvedPrice === null || recurrence === null) {
    return NextResponse.json({ error: "Price not found." }, { status: 404 });
  }

  return NextResponse.json({
    price: resolvedPrice,
    recurrence,
    wooProductId: wooIds?.productId ?? null,
    wooVariantId: wooIds?.variationId ?? null,
  });
}
