export type BadgeType = 
  | "WhWzDev"
  | "RrDev" 
  | "Translator"
  | "TranslatorLead"
  | "Firestarter_GoldWinner"
  | "Firestarter_SilverWinner"
  | "Firestarter_BronzeWinner"
  | "SummitShowdown_GoldWinner"
  | "SummitShowdown_SilverWinner"
  | "SummitShowdown_BronzeWinner"
  | "Leafstruck_GoldWinner"
  | "Leafstruck_SilverWinner"
  | "Leafstruck_BronzeWinner";

export const badgesData: Record<string, BadgeType[]> = {
    "4343-3434-3434": ["Firestarter_GoldWinner", "Leafstruck_GoldWinner", "SummitShowdown_SilverWinner"],
    "2277-7727-2227": ["Firestarter_GoldWinner", "Leafstruck_GoldWinner", "SummitShowdown_SilverWinner"],
    "1251-5622-1012": ["Firestarter_SilverWinner"],
    "0000-0202-1121": ["Firestarter_SilverWinner"],
    "3955-9063-2091": ["Firestarter_BronzeWinner"],
    "4988-1656-7319": ["Firestarter_BronzeWinner"],
    "0091-9119-1900": ["SummitShowdown_GoldWinner"],
    "4472-7904-7777": ["SummitShowdown_GoldWinner"],
    "3055-4510-9732": ["SummitShowdown_GoldWinner"],
    "4642-8389-5822": ["SummitShowdown_BronzeWinner"],
    "1117-1117-0111": ["SummitShowdown_BronzeWinner"],
    "1981-7118-9493": ["Leafstruck_SilverWinner"],
    "3871-4759-2494": ["Leafstruck_SilverWinner"],
    "0220-7722-0770": ["Leafstruck_SilverWinner"],
    "4773-4236-8101": ["Leafstruck_BronzeWinner"],
    "2963-5283-8221": ["Leafstruck_BronzeWinner"],
    "2110-5357-1284": ["Leafstruck_BronzeWinner"],
  
    "2877-6281-0055": ["RrDev"],
    "1889-7856-9675": ["RrDev"],
    "3914-4256-4301": ["RrDev"],
    "1165-6565-6533": ["RrDev"],
    "1509-2647-2032": ["RrDev"],
    "1212-1212-1245": ["RrDev"],
    "0000-0700-0400": ["RrDev"],
    "4215-0712-7201": ["RrDev"],
    "0001-0000-0011": ["RrDev"],
    "0816-0438-0197": ["WhWzDev", "RrDev"],
    "2619-9305-3743": ["WhWzDev"],
    "0214-7488-7628": ["WhWzDev", "Translator"],
    "4646-6664-4446": ["Translator", "TranslatorLead"],
    "2234-5677-8999": ["Translator", "RrDev"],
    "4644-6466-4446": ["Translator", "RrDev"],
    "3316-1616-1616": ["Translator", "RrDev"],
    "3484-8484-8484": ["Translator", "RrDev"],
    "0001-4444-1000": ["Translator", "RrDev"],
    "2282-2122-2222": ["Translator", "RrDev"],
    "4343-4343-3433": ["Translator", "RrDev"],
    "1122-1123-1124": ["Translator", "RrDev"],
    "0909-0090-0099": ["Translator", "RrDev"],
    "3999-9999-9089": ["Translator"],
    "0000-0002-6225": ["Translator"],
    "4943-2230-3770": ["Translator"],
    "2067-5991-2531": ["Translator"],
    "0909-0909-9909": ["Translator"],
    "2243-2234-2234": ["Translator"],
    "4988-1688-6126": ["Translator"],
    "2662-8800-8905": ["Translator"],
    "3779-5712-4832": ["Translator"],
    "0780-2005-2023": ["Translator"],
    "0000-0001-6722": ["Translator"],
    "3006-4772-3801": ["Translator"],
};

export const badgeInfo: Record<BadgeType, { label: string; tooltip: string }> = {
    "WhWzDev": {
        label: "WW Dev",
        tooltip: "WheelWizard Developer"
    },
    "RrDev": {
        label: "RR Dev",
        tooltip: "Retro Rewind Developer"
    },
    "Translator": {
        label: "Translator",
        tooltip: "Community Translator"
    },
    "TranslatorLead": {
        label: "Lead Trans",
        tooltip: "Translation Team Leader"
    },
    "Firestarter_GoldWinner": {
        label: "Firestarter",
        tooltip: "Firestarter Tournament - Gold Winner"
    },
    "Firestarter_SilverWinner": {
        label: "Firestarter",
        tooltip: "Firestarter Tournament - Silver Winner"
    },
    "Firestarter_BronzeWinner": {
        label: "Firestarter",
        tooltip: "Firestarter Tournament - Bronze Winner"
    },
    "SummitShowdown_GoldWinner": {
        label: "Summit",
        tooltip: "Summit Showdown Tournament - Gold Winner"
    },
    "SummitShowdown_SilverWinner": {
        label: "Summit",
        tooltip: "Summit Showdown Tournament - Silver Winner"
    },
    "SummitShowdown_BronzeWinner": {
        label: "Summit",
        tooltip: "Summit Showdown Tournament - Bronze Winner"
    },
    "Leafstruck_GoldWinner": {
        label: "Leafstruck",
        tooltip: "Leafstruck Tournament - Gold Winner"
    },
    "Leafstruck_SilverWinner": {
        label: "Leafstruck",
        tooltip: "Leafstruck Tournament - Silver Winner"
    },
    "Leafstruck_BronzeWinner": {
        label: "Leafstruck",
        tooltip: "Leafstruck Tournament - Bronze Winner"
    },
};

export function getPlayerBadges(friendCode: string): BadgeType[] {
    return badgesData[friendCode] || [];
}

export function hasBadges(friendCode: string): boolean {
    return getPlayerBadges(friendCode).length > 0;
}