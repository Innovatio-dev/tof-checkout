import { NextRequest, NextResponse } from "next/server";

type PriceEntry = { recurrence: string; platforms: Record<string, number> };
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
  "250k": "$250,000",
};

const PLATFORM_LABELS: Record<string, string> = {
  "tradovate-ninjatrader": "Tradovate / Ninjatrader",
};

const PRICE_TABLE: PriceTable = {
  "one-step-elite": {
    "25k": {
      recurrence: "monthly",
      platforms: { "tradovate-ninjatrader": 69 },
    },
    "50k": {
      recurrence: "monthly",
      platforms: { "tradovate-ninjatrader": 105 },
    },
    "100k": {
      recurrence: "monthly",
      platforms: { "tradovate-ninjatrader": 209 },
    },
    "250k": {
      recurrence: "monthly",
      platforms: { "tradovate-ninjatrader": 309 },
    },
  },
  "instant-sim-funded": {
    "25k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 419 },
    },
    "50k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 679 },
    },
    "100k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 821 },
    },
    "250k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 939 },
    },
  },
  "s2f-sim-pro": {
    "25k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 257 },
    },
    "50k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 421 },
    },
    "100k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 632 },
    },
    "250k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 727 },
    },
  },
  "ignite-instant": {
    "25k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 218 },
    },
    "50k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 398 },
    },
    "100k": {
      recurrence: "one time fee",
      platforms: { "tradovate-ninjatrader": 563 },
    },
  },
};

const resolvePrice = (accountType: string, accountSize: string, platform: string) => {
  return PRICE_TABLE[accountType]?.[accountSize]?.platforms?.[platform] ?? null;
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

  if (price === null || recurrence === null) {
    return NextResponse.json({ error: "Price not found." }, { status: 404 });
  }

  return NextResponse.json({ price, recurrence });
}
