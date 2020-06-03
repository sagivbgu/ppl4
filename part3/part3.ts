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
