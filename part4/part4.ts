import { KeyValuePair } from "ramda";

// Part 4 ; Q1.a
export const divisionByZero = new Error("Division By Zero");

export function f(x: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        if (x === 0) {
            reject(divisionByZero);
        } else {
            resolve(1 / x);
        }
    });
}

export function g(x: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        try {
            resolve(x * x);
        } catch (err) {
            reject(err);
        }
    });
}

export function h(x: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
       g(x)
        .then((x) => f(x) )
        .then((x) => resolve(x) )
        .catch((err) => reject(err) );
    });
}

// Part 4 ; Q2
export type SlowerResult<T> = KeyValuePair<number, T>;

const wrapPromise = <T>(promise: Promise<T>, index: number): Promise<SlowerResult<T>> =>
    new Promise<SlowerResult<T>>((resolve, reject) =>
        promise.then((res) => resolve([index, res]))
            .catch((e) => reject(e)));

// If both promises succeed, the return value is (0, value) or (1, value) where 0 indicates that
// the first promise was ​slower​, and 1 indicates that the second promise was slower,
// value is the return value of the promise that was resolved last.
export const slower = <T>(promises : Promise<T>[]): Promise<SlowerResult<T>> => {
    const w1 = wrapPromise(promises[0], 0);
    const w2 = wrapPromise(promises[1], 1);

    return new Promise<SlowerResult<T>>((resolve, reject) =>
        Promise.race([w1, w2])
            .then((fasterValue) => {
                Promise.all([w1, w2])
                    .then((values) => resolve(values.find(element => element[0] != fasterValue[0])))
                    .catch((e) => reject(e))
            })
            .catch((e) => reject(e))
    );
};