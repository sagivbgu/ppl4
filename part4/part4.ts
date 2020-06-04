import { KeyValuePair } from "ramda";

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
