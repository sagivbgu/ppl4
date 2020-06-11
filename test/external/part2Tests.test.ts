import { expect } from 'chai';
import { makeOk, bind, isFailure } from '../../shared/result';
import { L5typeof } from '../../part2/L5-typecheck';
import { parseL5, unparse } from '../../part2/L5-ast';
import { parseTE, makeProcTExp, makeTVar, makeNonEmptyTupleTExp, makeBoolTExp, makeNumTExp, makeStrTExp, makeVoidTExp } from '../../part2/TExp';
import { evalParse, evalProgram } from '../../part2/L5-eval';
describe('L4 Normal Eval', () => {

    it('evaluates simple values', () => {
        expect(L5typeof(`(values 1 2)`)).to.deep.equal(makeOk(`(number * number)`));
    })

    it('evaluates empty lambda', () => {
        expect(L5typeof(`(lambda () : (number * number) (values 1 2))`)).
        to.deep.equal(makeOk(`(Empty -> (number * number))`));
    })

    it('evaluates lambda with params', () => {
        expect(L5typeof(`(lambda ((x : string) (y : string)) : (number * number) (values 1 2))`))
        .to.deep.equal(makeOk(`(string * string -> (number * number))`));
    })

    it('evaluates something', () => {
        //expect(L5typeof(`(define (x : number) 2)`)).to.deep.equal(makeOk(`void`));
    })

    it('evaluates let-values', () => {
        expect(L5typeof(`(let-values ((((n : number) (s : number)) (values 1 2) : (number * number))) n)`))
        .to.deep.equal(makeOk(`number`));
    })

    it('evaluates values(10 3)', () => {
        expect(L5typeof(`(values 10 3)`))
        .to.deep.equal(makeOk(`(number * number)`));
    })

    it('evaluates (values 10 (+ 1 2) (> 5 4) #f)', () => {
        expect(L5typeof(`(values 10 (+ 1 2) (> 5 4) #f)`))
        .to.deep.equal(makeOk(`(number * number * boolean * boolean)`));
    })

    it('evaluates let-values with app in body', () => {
        expect(L5typeof(`(let-values ((((x : number) (y : number)) (values 10 3))) (+ x y))`))
        .to.deep.equal(makeOk(`number`));
    })

    it('evaluates let values with string', () => {
        expect(L5typeof(`(let-values ((((n : number) (s : string)) (values 1 "string"))) s)`))
        .to.deep.equal(makeOk(`string`));
    }) 

    it('test pares 1', () => {
        expect(bind(parseL5(`(L5 (define f (lambda (x) (values 1 2 3))))`), unparse))
        .to.deep.equal(makeOk(`(L5 (define f (lambda (x) (values 1 2 3))))`));
    })

    it('test pares 2', () => {
        expect(bind(parseL5(`(L5 (let-values (((x y) (values 10 3)) ((a b) (values 5 2))) (list y x) (+ a b)))`), unparse))
        .to.deep.equal(makeOk(`(L5 (let-values (((x y) (values 10 3)) ((a b) (values 5 2))) (list y x) (+ a b)))`));
    })

    it('test pares 3', () => {
        expect(bind(parseL5(`(L5 (let-values (((a b c) (f 0))) (+ a b c)))`), unparse))
        .to.deep.equal(makeOk(`(L5 (let-values (((a b c) (f 0))) (+ a b c)))`));
    })

    it('test pares 4', () => {
        expect(bind(parseL5(`(L5 (let-values (((n s) (values 1 “string”))) n))`), unparse))
        .to.deep.equal(makeOk(`(L5 (let-values (((n s) (values 1 “string”))) n))`));
    })

    it('test pares 5', () => {
        expect(bind(parseL5(`(L5 (let-values (((n1 s) (values 1 “string”)) ((b n2 n3) (values #t (+ 1 1) 3))) (if b (+ n1 n2) s)))`), unparse))
        .to.deep.equal(makeOk(`(L5 (let-values (((n1 s) (values 1 “string”)) ((b n2 n3) (values #t (+ 1 1) 3))) (if b (+ n1 n2) s)))`));
    })

    it('test parseTE 1', () => {
        expect(parseTE('(T * T -> (boolean * number))'))
        .to.deep.equal(makeOk(makeProcTExp([makeTVar('T'), makeTVar('T')], makeNonEmptyTupleTExp([makeBoolTExp(), makeNumTExp()]))));
    })

    it('test parseTE 2', () => {
        expect(parseTE('(T * T * boolean * number)'))
        .to.deep.equal(makeOk(makeNonEmptyTupleTExp([makeTVar('T'), makeTVar('T'), makeBoolTExp(), makeNumTExp()])));
    })

    it('test parseTE 3', () => {
        expect(parseTE('((number -> (string * boolean)) * T -> (boolean * number))'))
        .to.deep.equal(makeOk(makeProcTExp([makeProcTExp([makeNumTExp()], makeNonEmptyTupleTExp([makeStrTExp(), makeBoolTExp()])), makeTVar('T')], makeNonEmptyTupleTExp([makeBoolTExp(), makeNumTExp()]))));
    })

    it('test parseTE 4', () => {
        expect(parseTE('((string * boolean) * (number * number) -> (boolean * number))'))
        .to.deep.equal(makeOk(makeProcTExp([makeNonEmptyTupleTExp([makeStrTExp(), makeBoolTExp()]), makeNonEmptyTupleTExp([makeNumTExp(), makeNumTExp()])], makeNonEmptyTupleTExp([makeBoolTExp(), makeNumTExp()]))));
    })

    it('test parseTE 5', () => {
        expect(parseTE('((string -> (boolean * number)) -> (string -> (boolean * number)))'))
        .to.deep.equal(makeOk(makeProcTExp([makeProcTExp([makeStrTExp()], makeNonEmptyTupleTExp([makeBoolTExp(), makeNumTExp()]))], makeProcTExp([makeStrTExp()], makeNonEmptyTupleTExp([makeBoolTExp(), makeNumTExp()])))));
    })

    it('test evalParse 1', () => {
        expect(evalParse("(let-values (((a b c) (values 1 2 3))) (+ a b c))"))
        .to.deep.equal(makeOk(6));
    })

    it('test evalParse 2', () => {
        expect(bind(parseL5("(L5 (define f (lambda (x) (values 1 2 3))) (let-values (((a b c) (f 0))) (+ a b c)))"), evalProgram))
        .to.deep.equal(makeOk(6));
    })

    it('test evalParse 3', () => {
        expect(evalParse("(let-values (((x y) (values 1 2)) ((a b c) (values 5 4 (+ 7 7)))) (* (+ y x) (+ c b y)))"))
        .to.deep.equal(makeOk(60));
    })

    it('test evalParse 4', () => {
        expect(evalParse("(let-values (((n s) (values 1 #t))) (if s 3 5))"))
        .to.deep.equal(makeOk(3));
    })

    it('test evalParse 5', () => {
        expect(evalParse(`
        (let-values 
            (
                (
                    (a) (values 1 2)
                ) 
                (
                    (b c) 
                    (values 3)
                )
            ) 
            (+ a b c)
        )`)).satisfy(isFailure);
    })

    it('test evalParse 6', () => {
        expect(bind(parseL5("(L5 (define x 7) (let-values (((a b c) (values 1 2 3)) ((d e f) (values 4 5 6))) (+ x b c) (+ (let-values (((y t) (values 4 5))) (* t y x)) (+ f d e))))"), evalProgram))
        .to.deep.equal(makeOk(155));
    })

    it('test typeof 1', () => {
        expect(L5typeof(`(let-values ((((n : number) (s : number)) (values 1 2) : (number * number)) (((a : boolean) (t : number)) (values #t 3) : (boolean * number))) (if a (* n t) (* s t)))`))
            .to.deep.equal(makeOk(`number`));
    });

    const a = `(let-values 
        (
            (
                (
                    (n : number) (s : number)
                ) 
                (values 1 2) : (number * number)
            ) 
            (
                (
                    (a : boolean) (t : number)
                ) 
                (values #t 3) : (boolean * number)
            )
        ) 
        (if a (* n t) (* s t)))`;

    it('mismatch types 1', () => {
        expect(L5typeof(`(let-values ((((n : boolean) (s : number)) (values 1 2) : (number * number)) (((a : boolean) (t : number)) (values #t 3) : (boolean * number))) (if a (* n t) (* s t)))`))
            .to.satisfy(isFailure);
    })

    it('mismatch types 2', () => {
        expect(L5typeof(`(let-values ((((n : boolean) (s : number)) (values #t 2) : (number * number)) (((a : boolean) (t : number)) (values #t 3) : (boolean * number))) (if a (* n t) (* s t)))`))
            .to.satisfy(isFailure);
    })
    
    it('mismatch types 3', () => {
        expect(L5typeof(`(let-values ((((n : number) (s : number)) (values #t 2) : (number * number)) (((a : boolean) (t : number)) (values #t 3) : (boolean * number))) (if a (* n t) (* s t)))`))
            .to.satisfy(isFailure);
    })
});


