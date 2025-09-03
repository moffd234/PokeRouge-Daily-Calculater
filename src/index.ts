import express, {Request, Response} from "express";

class RDG {
    private c = 1;
    private s0 = 0;
    private s1 = 0;
    private s2 = 0;
    private n = 0xefc8249d;
    private rngCounter = 0;
    private rngOffset = 0;
    private rngSeedOverride = "";
    private rngSeed = "";

    public init_builder(seeds?: string[]) {
        this.c = 1;
        this.s0 = 0;
        this.s1 = 0;
        this.s2 = 0;
        this.n = 0;
        this.sow([(Date.now() * Math.random()).toString()]);
        if (seeds) this.init(seeds);
    }

    public init(seeds?: string[] | string) {
        if (typeof seeds === "string") {
            this.state(seeds);
        } else {
            this.sow(seeds);
        }
    }

    private hash(data: string): number {
        let h: number | undefined = undefined;
        let n = this.n;
        data = data.toString();
        for (let i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            let t = 0.02519603282416938 * n;
            n = t >>> 0;
            t -= n;
            t *= n;
            n = t >>> 0;
            t -= n;
            n += t * 0x100000000;
            h = (n >>> 0) * 2.3283064365386963e-10;
        }
        this.n = n;
        return (h ?? 0);
    }

    public sow(seeds?: string[]) {
        this.n = 0xefc8249d;
        this.s0 = this.hash(" ");
        this.s1 = this.hash(" ");
        this.s2 = this.hash(" ");
        this.c = 1;
        if (!seeds) return;
        for (let i = 0; i < seeds.length && (seeds[i] != null); i++) {
            const seed = (seeds[i] as string).toString();
            this.s0 -= this.hash(seed);
            this.s0 += ~~(this.s0 < 0);
            this.s1 -= this.hash(seed);
            this.s1 += ~~(this.s1 < 0);
            this.s2 -= this.hash(seed);
            this.s2 += ~~(this.s2 < 0);
        }
    }

    private rnd(): number {
        const t = 2091639 * this.s0 + this.c * 2.3283064365386963e-10;
        this.c = t | 0;
        this.s0 = this.s1;
        this.s1 = this.s2;
        this.s2 = t - this.c;
        return this.s2;
    }

    private frac(): number {
        return this.rnd() + ((this.rnd() * 0x200000) | 0) * (1.1102230246251565e-16);
    }

    public shuffle<T>(array: T[]): T[] {
        const a = array;
        for (let i = a.length - 1; i > 0; i--) {
            const r = Math.floor(this.frac() * (i + 1));
            const tmp = a[r];
            a[r] = a[i];
            a[i] = tmp;
        }
        return a;
    }

    private shiftCharCodes(str: string, shiftCount?: number): string {
        const s = shiftCount ?? 0;
        let out = "";
        for (let i = 0; i < str.length; i++) {
            const cc = str.charCodeAt(i);
            out += String.fromCharCode(cc + s);
        }
        return out;
    }

    public state(st?: string): string {
        return ['!rnd', this.c, this.s0, this.s1, this.s2].join(',');
    }

    public executeWithSeedOffset<T>(f: () => T, offset: number, seedOverride?: string): T {
        const tempRngCounter = this.rngCounter;
        const tempRngOffset = this.rngOffset;
        const tempRngSeedOverride = this.rngSeedOverride;
        const state = this.state();
        this.sow([this.shiftCharCodes((seedOverride || this.rngSeed), offset)]);
        this.rngCounter = 0;
        this.rngOffset = offset;
        this.rngSeedOverride = seedOverride || "";
        const returnValue = f();
        this.init(state);
        this.rngCounter = tempRngCounter;
        this.rngOffset = tempRngOffset;
        this.rngSeedOverride = tempRngSeedOverride;
        return returnValue;
    }
}

type Legendary = { name: string; id: string };

const LegendaryData: [string, string][] = [
    ["Mewtwo", "mewtwo"],
    ["Lugia", "lugia"],
    ["Ho-oh", "ho-oh"],
    ["Kyogre", "kyogre"],
    ["Groudon", "groudon"],
    ["Rayquaza", "rayquaza"],
    ["Dialga", "dialga"],
    ["Palkia", "palkia"],
    ["Regigigas", "regigigas"],
    ["Giratina", "giratina-altered"],
    ["Arceus", "arceus"],
    ["Reshiram", "reshiram"],
    ["Zekrom", "zekrom"],
    ["Kyurem", "kyurem"],
    ["Xerneas", "xerneas"],
    ["Yveltal", "yveltal"],
    ["Zygarde", "zygarde-50"],
    ["Cosmog", "cosmog"],
    ["Necrozma", "necrozma"],
    ["Zacian", "zacian"],
    ["Zamazenta", "zamazenta"],
    ["Calyrex", "calyrex"],
    ["Koraidon", "koraidon"],
    ["Miraidon", "miraidon"],
    ["Terapagos", "terapagos"],
];

const LEGENDARIES = LegendaryData.map(d => d[0]);
const LEGENDARY_IDS = LegendaryData.map(d => d[1]);

const rdg = new RDG();
rdg.init_builder();

const DAY_MS = 86400000;
const SEED = "1073741824";

function getLegendaryGachaForTimestamp(ts: number | Date): Legendary {
    const date = (ts instanceof Date) ? ts : new Date(ts);
    const dayCount = Math.floor(date.getTime() / DAY_MS);
    const offset = Math.floor(dayCount / LEGENDARIES.length);
    const index = dayCount % LEGENDARIES.length;

    const pick = rdg.executeWithSeedOffset(() => {
        const shuffled = rdg.shuffle(LEGENDARIES.slice());
        return shuffled[index];
    }, offset, SEED);

    const idx = LEGENDARIES.indexOf(pick);
    return {name: LEGENDARIES[idx], id: LEGENDARY_IDS[idx]};
}

function getMonthCalendar(year: number, monthZeroBased: number) {
    const first = new Date(Date.UTC(year, monthZeroBased, 1, 0, 0, 0));
    const res: Array<{ yyyy: number; mm: number; dd: number; dow: number; legendary: Legendary }> = [];
    let d = new Date(first.getTime());
    while (d.getUTCMonth() === monthZeroBased) {
        const leg = getLegendaryGachaForTimestamp(d);
        res.push({
            yyyy: d.getUTCFullYear(),
            mm: d.getUTCMonth() + 1,
            dd: d.getUTCDate(),
            dow: d.getUTCDay(),
            legendary: leg
        });
        d = new Date(d.getTime() + DAY_MS);
    }
    return res;
}

const app = express();

app.get("/api/today", (_req: Request, res: Response) => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const leg = getLegendaryGachaForTimestamp(todayUTC);
    res.json({date: todayUTC.toISOString().slice(0, 10), legendary: leg});
});

app.get("/api/tomorrow", (_req: Request, res: Response) => {
    const now = new Date();
    const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const leg = getLegendaryGachaForTimestamp(tomorrowUTC);
    res.json({date: tomorrowUTC.toISOString().slice(0, 10), legendary: leg});
});

app.get("/api/legendary", (req: Request, res: Response) => {
    const q = req.query.timestamp as string | undefined;
    const t = q ? new Date(q) : new Date();
    const dayUTC = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
    const leg = getLegendaryGachaForTimestamp(dayUTC);
    res.json({date: dayUTC.toISOString().slice(0, 10), legendary: leg});
});

app.get("/api/calendar", (req: Request, res: Response) => {
    const year = parseInt((req.query.year as string) || "");
    const month = parseInt((req.query.month as string) || "");
    if (Number.isNaN(year) || Number.isNaN(month)) {
        res.status(400).json({error: "year and month required. month is 1-12."});
        return;
    }
    const cal = getMonthCalendar(year, month - 1);
    res.json({year, month, days: cal});
});

// Export app for Lambda
export default app;

if (require.main === module) {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

    if (process.argv[2] === "test-today") {
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        console.log(getLegendaryGachaForTimestamp(todayUTC));
    } else {
        app.listen(PORT, () => {
            console.log(`Server running locally at http://localhost:${PORT}`);
        });
    }
}