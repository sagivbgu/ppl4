import { expect, assert } from 'chai';
import { slower } from './part4';

const getFastPromise = () => Promise.resolve("fast");

const slowPromiseValue = "slow";
const getSlowPromise = () => new Promise((resolve, reject) => {
    setTimeout(resolve, 100, slowPromiseValue);
});

const rejectValue = new Error("reject");
const getFastRejectingPromise = () => Promise.reject(rejectValue);
const getSlowRejectingPromise = () => new Promise((resolve, reject) => {
    setTimeout(reject, 100, rejectValue);
});

const getVerySlowPromise = () => new Promise((resolve, reject) => {
    setTimeout(resolve, 100000000, slowPromiseValue);
});

describe('slower tests', () => {
    it('2 promises fulfill - return value of slower', async () => {
        let value = await Promise.race([slower(getSlowPromise(), getFastPromise())]);
        expect(value).to.deep.equal([0, slowPromiseValue]);

        value = await Promise.race([slower(getFastPromise(), getSlowPromise())]);
        expect(value).to.deep.equal([1, slowPromiseValue]);
    });

    it('2 promises reject - reject', async () => {
        try {
            await Promise.race([slower(getFastRejectingPromise(), getSlowRejectingPromise())])
        }
        catch (e) {
            expect(e).to.deep.equal(rejectValue);
            return;
        }
        assert.fail("must throw");
    });

    it('2 promises reject - reject (call in reverse order)', async () => {
        try {
            await Promise.race([slower(getSlowRejectingPromise(), getFastRejectingPromise())])
        }
        catch (e) {
            expect(e).to.deep.equal(rejectValue);
            return;
        }
        assert.fail("must throw");
    });

    it('fast promise rejects - reject', async () => {
        try {
            await Promise.race([slower(getFastRejectingPromise(), getSlowPromise())]);
        }
        catch (e) {
            expect(e).to.deep.equal(rejectValue);
            return;
        }
        assert.fail("must throw");
    });

    it('fast promise rejects - reject (call in reverse order)', async () => {
        try {
            await Promise.race([slower(getSlowPromise(), getFastRejectingPromise())]);
        }
        catch (e) {
            expect(e).to.deep.equal(rejectValue);
            return;
        }
        assert.fail("must throw");
    });

    it('slow promise rejects - reject', async () => {
        try {
            await Promise.race([slower(getSlowRejectingPromise(), getFastPromise())]);
        }
        catch (e) {
            expect(e).to.deep.equal(rejectValue);
            return;
        }
        assert.fail("must throw");
    });

    it('slow promise rejects - reject (call in reverse order)', async () => {
        try {
            await Promise.race([slower(getFastPromise(), getSlowRejectingPromise())]);
        }
        catch (e) {
            expect(e).to.deep.equal(rejectValue);
            return;
        }
        assert.fail("must throw");
    });

    // it('slower doesnt block', () => {
    //     let blocked = false;
    //     slower(getVerySlowPromise(), getVerySlowPromise()).then(() => blocked = true);

    //     expect(blocked).to.deep.equal(false);
    // });
});