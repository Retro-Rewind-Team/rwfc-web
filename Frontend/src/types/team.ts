export interface TeamMemberDef {
    name: string;
    discord: string;
    image?: string;
    fc?: string;
}

export class TeamMember {
    name: string;
    discord: string;
    role?: string;
    donation?: string;
    image?: string;
    fc?: string;

    constructor(def: TeamMemberDef) {
        this.name = def.name;
        this.discord = def.discord;
        this.image = def.image;
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
}
