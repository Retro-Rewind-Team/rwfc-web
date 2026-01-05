// Character mappings (decimal values)
const characters: Record<number, string> = {
    0: "Mario",
    1: "Baby Peach",
    2: "Waluigi",
    3: "Bowser",
    4: "Baby Daisy",
    5: "Dry Bones",
    6: "Baby Mario",
    7: "Luigi",
    8: "Toad",
    9: "Donkey Kong",
    10: "Yoshi",
    11: "Wario",
    12: "Baby Luigi",
    13: "Toadette",
    14: "Koopa Troopa",
    15: "Daisy",
    16: "Peach",
    17: "Birdo",
    18: "Diddy Kong",
    19: "King Boo",
    20: "Bowser Jr.",
    21: "Dry Bowser",
    22: "Funky Kong",
    23: "Rosalina",
    24: "Small Mii Outfit A (Male)",
    25: "Small Mii Outfit A (Female)",
    26: "Small Mii Outfit B (Male)",
    27: "Small Mii Outfit B (Female)",
    28: "Small Mii Outfit C (Male)",
    29: "Small Mii Outfit C (Female)",
    30: "Medium Mii Outfit A (Male)",
    31: "Medium Mii Outfit A (Female)",
    32: "Medium Mii Outfit B (Male)",
    33: "Medium Mii Outfit B (Female)",
    34: "Medium Mii Outfit C (Male)",
    35: "Medium Mii Outfit C (Female)",
    36: "Large Mii Outfit A (Male)",
    37: "Large Mii Outfit A (Female)",
    38: "Large Mii Outfit B (Male)",
    39: "Large Mii Outfit B (Female)",
};

// Vehicle mappings (decimal values)
const vehicles: Record<number, string> = {
    0: "Standard Kart S",
    1: "Standard Kart M",
    2: "Standard Kart L",
    3: "Baby Booster",
    4: "Classic Dragster",
    5: "Offroader",
    6: "Mini Beast",
    7: "Wild Wing",
    8: "Flame Flyer",
    9: "Cheep Charger",
    10: "Super Blooper",
    11: "Piranha Prowler",
    12: "Tiny Titan",
    13: "Daytripper",
    14: "Jetsetter",
    15: "Blue Falcon",
    16: "Sprinter",
    17: "Honeycoupe",
    18: "Standard Bike S",
    19: "Standard Bike M",
    20: "Standard Bike L",
    21: "Bullet Bike",
    22: "Mach Bike",
    23: "Flame Runner",
    24: "Bit Bike",
    25: "Sugarscoot",
    26: "Wario Bike",
    27: "Quacker",
    28: "Zip Zip",
    29: "Shooting Star",
    30: "Magikruiser",
    31: "Sneakster",
    32: "Spear",
    33: "Jet Bubble",
    34: "Dolphin Dasher",
    35: "Phantom",
};

// Controller mappings
const controllers: Record<number, string> = {
    0: "Wii Wheel",
    1: "Nunchuk",
    2: "Classic Controller",
    3: "GameCube Controller",
};

// Drift type mappings
const driftTypes: Record<number, string> = {
    0: "Manual",
    1: "Hybrid",
};

// Drift category mappings
const driftCategories: Record<number, string> = {
    0: "Outside Drift",
    1: "Inside Drift",
};

export function getCharacterName(id: number): string {
    return characters[id] || `Unknown Character (${id})`;
}

export function getVehicleName(id: number): string {
    return vehicles[id] || `Unknown Vehicle (${id})`;
}

export function getControllerName(id: number): string {
    return controllers[id] || `Unknown Controller (${id})`;
}

export function getDriftTypeName(id: number): string {
    return driftTypes[id] || `Unknown Drift Type (${id})`;
}

export function getDriftCategoryName(id: number): string {
    return driftCategories[id] || `Unknown Drift Category (${id})`;
}

// Check if vehicle is a bike (decimal: 18-35)
export function isBike(vehicleId: number): boolean {
    return vehicleId >= 18 && vehicleId <= 35;
}



// Check if vehicle is a kart (decimal: 0-17)
export function isKart(vehicleId: number): boolean {
    return vehicleId >= 0 && vehicleId <= 17;
}