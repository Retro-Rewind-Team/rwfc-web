export interface TeamMemberDef {
    name: string;
    discord: string;
    image?: string;
    /*
     * Optional animated version of `image`. It is fetched only when someone hovers or focuses the
     * card, and never under reduced motion: an always-on loop would download on every visit and
     * moves for longer than 5s with no pause control (WCAG 2.2.2).
     */
    animatedImage?: string;
    fc?: string;
}

export class TeamMember {
    name: string;
    discord: string;
    role?: string;
    donation?: string;
    image?: string;
    animatedImage?: string;
    fc?: string;
    forge?: string;

    constructor(def: TeamMemberDef) {
        this.name = def.name;
        this.discord = def.discord;
        this.image = def.image;
        this.animatedImage = def.animatedImage;
        this.fc = def.fc;
    }

    public withRole(role: string): TeamMember {
        const clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        clone.role = role;
        return clone;
    }

    public withDonation(donation: string): TeamMember {
        const clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        clone.donation = donation;
        return clone;
    }

    public withForge(forge: string): TeamMember {
        const clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        clone.forge = forge;
        return clone;
    }
}
