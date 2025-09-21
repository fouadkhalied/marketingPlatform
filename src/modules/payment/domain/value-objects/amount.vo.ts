export class Amount {
    constructor(public value: number) {
        if (value <= 0) throw new Error("Amount must be positive");
    }
}
