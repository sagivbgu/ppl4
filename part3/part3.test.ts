import { expect } from 'chai';
import { braid } from './part3';

// Gil's implementation from the forum
function take(n: number, g: Generator) {
    const result = [];
    for (let i = 0; i < n; i++) {
        const { value, done } = g.next();
        if (done) {
            break;
        }
        result.push(value);
    }
    return result;
}

// Example functions from the assignment
function* gen1() { yield 3; yield 6; yield 9; yield 12; }
function* gen2() { yield 8; yield 10; }

function countIterations(generator: Generator) {
    let iterations = 0;
    while (!generator.next().done) {
        iterations++;
    }
    return iterations;
}

describe('braid tests', () => {
    it('assignment example', () => {
        expect(take(4, braid(gen1, gen2)))
            .to.deep.equal([3, 8, 6, 10]);
    });

    // Based on a question from the forum
    it('take all elements from the list that did not end', () => {
        expect(take(6, braid(gen1, gen2)))
            .to.deep.equal([3, 8, 6, 10, 9, 12]);

        expect(take(6, braid(gen2, gen1)))
            .to.deep.equal([8, 3, 10, 6, 9, 12]);
    });

    it('done when 2 given generators are done', () => {
        expect(countIterations(braid(gen1, gen2)))
            .to.deep.equal(6);

        expect(countIterations(braid(gen2, gen1)))
            .to.deep.equal(6);
    });

    it('inner generator can return undefined but still not done', () => {
        function* g1() { yield 1; yield undefined; yield 2; }
        function* g2() { yield undefined; yield undefined; }

        expect(take(10000, braid(g1, g2)))
            .to.deep.equal([1, undefined, undefined, undefined, 2]);

        expect(take(10000, braid(g2, g1)))
            .to.deep.equal([undefined, 1, undefined, undefined, 2]);
    });

    it('inner generator can be "empty"', () => {
        function* g1() { yield 1; }
        function* gEmpty() { }

        expect(take(10000, braid(g1, gEmpty)))
            .to.deep.equal([1]);

        expect(take(10000, braid(gEmpty, g1)))
            .to.deep.equal([1]);
    });

    it('2 inner generators can be "empty"', () => {
        function* gEmpty() { }
        const { value, done } = braid(gEmpty, gEmpty).next();
        expect(value)
            .to.deep.equal(undefined);

        expect(done)
            .to.deep.equal(true);
    });
});
