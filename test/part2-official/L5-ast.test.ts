import { expect } from "chai";
import { isNumExp, isBoolExp, isVarRef, isPrimOp, isProgram, isDefineExp, isVarDecl,
         isAppExp, isStrExp, isIfExp, isProcExp, isLetExp, isLitExp, isLetrecExp, isSetExp, 
         isLetValuesExp, parseL5Exp, unparse, Exp, parseL5 } from "../../part2/L5-ast";
import { Result, bind, isOkT, makeOk } from "../../shared/result";
import { parse as parseSexp } from "../../shared/parser";

const p = (x: string): Result<Exp> => bind(parseSexp(x), parseL5Exp);

describe('L5 Parser', () => {
    it('parses atomic expressions', () => {
        expect(p("1")).to.satisfy(isOkT(isNumExp));
        expect(p("#t")).to.satisfy(isOkT(isBoolExp));
        expect(p("x")).to.satisfy(isOkT(isVarRef));
        expect(p('"a"')).to.satisfy(isOkT(isStrExp));
        expect(p(">")).to.satisfy(isOkT(isPrimOp));
        expect(p("=")).to.satisfy(isOkT(isPrimOp));
        expect(p("string=?")).to.satisfy(isOkT(isPrimOp));
        expect(p("values")).to.satisfy(isOkT(isPrimOp));
        expect(p("eq?")).to.satisfy(isOkT(isPrimOp));
        expect(p("cons")).to.satisfy(isOkT(isPrimOp));
    });

    it('parses programs', () => {
        expect(parseL5("(L5 (define x 1) (> (+ x 1) (* x x)))")).to.satisfy(isOkT(isProgram));
    });

    it('parses "define" expressions', () => {
        const def = p("(define x 1)");
        expect(def).to.satisfy(isOkT(isDefineExp));
        if (isOkT(isDefineExp)(def)) {
            expect(def.value.var).to.satisfy(isVarDecl);
            expect(def.value.val).to.satisfy(isNumExp);
        }
    });

    it('parses "define" expressions with type annotations', () => {
        const define = "(define (a : number) 1)";
        expect(p(define)).to.satisfy(isOkT(isDefineExp));
    });

    it('parses applications', () => {
        expect(p("(> x 1)")).to.satisfy(isOkT(isAppExp));
        expect(p("(> (+ x x) (* x x))")).to.satisfy(isOkT(isAppExp));
    });

    it('parses "if" expressions', () => {
        expect(p("(if #t 1 2)")).to.satisfy(isOkT(isIfExp));
        expect(p("(if (< x 2) x 2)")).to.satisfy(isOkT(isIfExp));
    });

    it('parses procedures', () => {
        expect(p("(lambda () 1)")).to.satisfy(isOkT(isProcExp));
        expect(p("(lambda (x) x x)")).to.satisfy(isOkT(isProcExp));
    });

    it('parses procedures with type annotations', () => {
        expect(p("(lambda ((x : number)) : number (* x x))")).to.satisfy(isOkT(isProcExp));
    });



//added tests *****************************
// it('parses "values" specail form expressions', () => {
//     expect(p(" (values 1 2 3)")).to.satisfy(isOkT(isValuesExp));
//     expect(p(" (values 1 (lambda (x) x x) #t)")).to.satisfy(isOkT(isValuesExp));
//     expect(p("(values (+ x x) (* x x))")).to.satisfy(isOkT(isValuesExp));
//     });

it('parses "values" primitive operation expressions', () => {
    expect(p(" (values 1 2 3)")).to.satisfy(isOkT(isAppExp));
    expect(p(" (values 1 (lambda (x) x x) #t)")).to.satisfy(isOkT(isAppExp));
    expect(p("(values (+ x x) (* x x))")).to.satisfy(isOkT(isAppExp));
    });



it('parses "let-values" expressions', () => {
    expect(p("(let-values (((a b) (values 1 2))) (if b a (+ a 1)))")).to.satisfy(isOkT(isLetValuesExp));
    });

it('parses "let-values" expressions', () => {
    expect(p("(let-values (((a b) (values 1 2)) ((c d e)  (values 1 (lambda (x) x x) #t) )) 5)")).to.satisfy(isOkT(isLetValuesExp));
     });
    
//***************************** */
    it('parses literal expressions', () => {
        expect(p("'a")).to.satisfy(isOkT(isLitExp));
        expect(p("'()")).to.satisfy(isOkT(isLitExp));
        expect(p("'(1)")).to.satisfy(isOkT(isLitExp));
    });

    it('parses "letrec" expressions', () => {
        expect(p("(letrec ((e (lambda (x) x))) (e 2))")).to.satisfy(isOkT(isLetrecExp));
    });

    it('parses "letrec" expressions with type annotations', () => {
        expect(p("(letrec (((p : (number * number -> number)) (lambda ((x : number) (y : number)) (+ x y)))) (p 1 2))")).to.satisfy(isOkT(isLetrecExp));
    });

    it('parses "set!" expressions', () => {
        expect(p("(set! x 1)")).to.satisfy(isOkT(isSetExp));
    });
});

describe('L5 Unparse', () => {
    const roundTrip = (x: string): Result<string> => bind(p(x), unparse);

    it('unparses "define" expressions with type annotations', () => {
        const define = "(define (a : number) 1)";
        expect(roundTrip(define)).to.deep.equal(makeOk(define));
    });

    it('unparses procedures with type annotations', () => {
        const lambda = "(lambda ((x : number)) : number (* x x))";
        expect(roundTrip(lambda)).to.deep.equal(makeOk(lambda));
    });

    it('unparses "let" expressions with type annotations', () => {
        const let1 = "(let (((a : boolean) #t) ((b : number) 2)) (if a b (+ b b)))";
        expect(roundTrip(let1)).to.deep.equal(makeOk(let1));
    });

 //added tests *****************************

    it('unparses "values" expressions without type annotations', () => {
        const let1 = "(values 1 2 3)";
        expect(roundTrip(let1)).to.deep.equal(makeOk(let1));
    });

    it('unparses "let-values" expressions without type annotations', () => {
        const let1 = "(let-values (((a b) (values 1 2)) ((a b) (values 1 2))) (+ 1 2))";
        expect(roundTrip(let1)).to.deep.equal(makeOk(let1));//(if a b (+ b b))
    });
    it('unparses "let-values" expressions with type annotations', () => {
        const let1 = "(let-values ((((a : boolean) (b : number)) (values #t 2))) (if a b (+ b b)))";
        expect(roundTrip(let1)).to.deep.equal(makeOk(let1));
    });
// *****************************
    it('unparses "letrec" expressions', () => {
        const letrec = "(letrec (((p : (number * number -> number)) (lambda ((x : number) (y : number)) (+ x y)))) (p 1 2))";
        expect(roundTrip(letrec)).to.deep.equal(makeOk(letrec));
    });
});
