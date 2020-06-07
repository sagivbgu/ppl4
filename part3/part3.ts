import { isBoolean } from "../shared/type-predicates";

// Return a generator that combines generator1 and generator2 by interleaving their values
export function* braid(generator1: () => Generator, generator2: () => Generator): Generator {
    let generators = [generator1(), generator2()];
    while (generators.length > 0) {
        for (let i = 0; i < generators.length; i++) {
            const { value, done } = generators[i].next();
            if (done) {
                generators.splice(i, 1);
            }
            else {
                yield value;
            }
        }
    }
}

// returns a generator that combines both generators by taking two elements from gen1 
// and one from the gen2.
export function* biased(generator1: () => Generator, generator2: () => Generator): Generator {
    let gen1 = generator1();
    let gen2 = generator2();
    let gen1Done = false;
    let gen2Done = false;

    while (!(gen1Done && gen2Done)) {
        for (let i = 0; i < 2; i++) {
            const { value, done } = gen1.next();
            isBoolean(done) ? gen1Done = done : gen1Done = true;
            if (!gen1Done) {
                yield value;
            }
        }
        
        const { value, done } = gen2.next();
        isBoolean(done) ? gen2Done = done : gen2Done = true;
        if (!gen2Done) {
            yield value;
        }
    }
}