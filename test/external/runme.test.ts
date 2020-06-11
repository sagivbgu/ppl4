import { parseL5, parseL5CExp, Exp, parseL5Exp, isNumExp, isBoolExp, isVarRef, isStrExp, isPrimOp, isProgram, isDefineExp, isVarDecl, isAppExp, isIfExp, isProcExp, isLetValuesExp, isLitExp, isLetrecExp, isSetExp, unparse } from "../../part2/L5-ast"
import { expect } from 'chai';
import { bind, makeOk, isOk, isOkT } from "../../shared/result";
import { evalProgram, evalParse } from "../../part2/L5-eval";
import { L5typeof } from "../../part2/L5-typecheck";
import { parse as parseSexp } from "../../shared/parser";
const p = (x: string): Result<Exp> => bind(parseSexp(x), parseL5Exp);

const print = (x: any): void => {
    const makeSpaces = (n: number): string => {
        let str = "";
        while (str.length < n)
            str += " ";
        return str;
    }
    let str = "";
    let top = "";
    let content = JSON.stringify(x, null, 2);
    let len = content.length;
    let maxW = 0;
    let height = 1;
    let counter = 0;

    for (let i = 0; i < len; i++) {
        counter++;
        if (counter > maxW)
            maxW = counter;
        if (content[i] == '\n') {
            counter = 0;
            height++;
        }
    }

    for (let i = 0; i < maxW + 4; i++)
        top += "-";

    str = top + "\n| ";
    counter = 0;
    for (let i = 0; i < len; i++) {
        let c = content[i];
        if (c == '\n') {
            str += makeSpaces(maxW - counter) + " |\n| ";
            counter = 0;
        }
        else {
            str += c;
            counter++;
        }
    }

    str += makeSpaces(maxW - counter) + " |\n" + top + "\n";
    console.log(str);
}

describe('L5 Parser', () => {
    it('parses atomic expressions', () => {
        expect(p("1")).to.satisfy(isOkT(isNumExp));
        expect(p("#t")).to.satisfy(isOkT(isBoolExp));
        expect(p("x")).to.satisfy(isOkT(isVarRef));
        expect(p('"a"')).to.satisfy(isOkT(isStrExp));
        expect(p(">")).to.satisfy(isOkT(isPrimOp));
        expect(p("=")).to.satisfy(isOkT(isPrimOp));
        expect(p("string=?")).to.satisfy(isOkT(isPrimOp));
        // expect(p("values")).to.satisfy(isOkT(isPrimOp));
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

    /*
    
    //added tests *****************************
    it('parses "values" specail form expressions', () => {
        expect(p(" (values 1 2 3)")).to.satisfy(isOkT(isValuesExp));
        expect(p(" (values 1 (lambda (x) x x) #t)")).to.satisfy(isOkT(isValuesExp));
        expect(p("(values (+ x x) (* x x))")).to.satisfy(isOkT(isValuesExp));
        });
    */
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
import { Result } from "../../shared/result";
const printRes = (t: Result<any>): void =>
    isOk(t) ? print(t.value) : print(t);
describe('Q2 Tests', () => {
    
    
    it('example from assaginment - 1', () => {
        const res = parseL5(`
            (L5 (define f
                (lambda (x)
            (values 1 2 3)))
            (let-values (((a b c) (f 0)))
            (+ a b c)))`);
        //expect(L5typeof("(quote ())")).to.deep.equal(makeOk("literal"));
        expect(bind(res, evalProgram)).to.deep.equal(makeOk(6));
    });
    it('example from assaginment - 2', () => {
        const res = parseL5(`(L5 (let-values (((n s) (values 1 "string"))) n))`);
        expect(bind(res, evalProgram)).to.deep.equal(makeOk(1));
    });
    it('define values - 1', () => {
        const res = parseL5(`(L5
                (define a (values 1 2 3))
                (let-values (((x y z) a))
                    (+ x y z)
                )
            )`);
        expect(bind(res, evalProgram)).to.deep.equal(makeOk(6));
    });
    it('our test - values given as parameter to function', () => {
        const res = parseL5(`(L5
                (define f 
                    (lambda (a) 
                        (let-values (((x y z) a))
                            (+ x y z)
                        )
                    )
                )
                (f (values 1 2 3))
            )`);
        expect(bind(res, evalProgram)).to.deep.equal(makeOk(6));
    });
    it('our test - soft shadowing', () => {
        const res = parseL5(`(L5
                (define x 7)
                (define f 
                    (lambda (a) 
                        (let-values (((x y z) a))
                            (+ x y z)
                        )
                    )
                )
                (f (values x 2 3))
            )`);
        expect(bind(res, evalProgram)).to.deep.equal(makeOk(12));
    });
    it('our test - hard shdowing', () => {
        const res = parseL5(`(L5
                (define x 7)
                (define f 
                    (lambda (x) 
                        (let-values (((x y z) x))
                            (+ x y z)
                        )
                    )
                )
                (f (values x 2 3))
            )`);
        expect(bind(res, evalProgram)).to.deep.equal(makeOk(12));
    });
    it('our test - nested let-values - values kept in a let-values variable', () => {
        const res = parseL5(`(L5
                (define x 7)
                (define f 
                    (lambda (x) 
                        (let-values (((y x z) x))
                            (+ x y 
                                (let-values (((z y x) z))
                                    (+ x y z)
                                )
                            )
                        )
                    )
                )
                (f (values 2 x (values x 2 3)))
            )`);
        expect(bind(res, evalProgram)).to.deep.equal(makeOk(21));
    });
    
    it('Bonus 1 - typeof', () => {
        const exp = `(values 1 (values 2 2.5 2.9) 3)`
        expect(L5typeof(exp)).to.deep.equal(makeOk("(number * (number * number * number) * number)"));
    });
    it('Bonus 1 - eval', () => {
        const exp = `(let-values (((x y z) (values 1 (values 2 2.5 2.9) 3))) y)`
        expect(evalParse(exp)).to.deep.equal(makeOk([2, 2.5, 2.9]));
    });

    it('Bonus 2 - typeof', () => {
        const exp = `(let-values (((x (y : (number * number * number)) z) (values 1 (values 2 2.5 2.9) 3))) (values x y z))`
        expect(L5typeof(exp)).to.deep.equal(makeOk("(number * (number * number * number) * number)"));
    });
    it('Bonus 2 - eval', () => {
        const exp = `(let-values (((x (y : (number * number * number)) z) (values 1 (values 2 2.5 2.9) 3))) y)`
        expect(evalParse(exp)).to.deep.equal(makeOk([2, 2.5, 2.9]));
    });
    it('Bonus 3 - typeof', () => {
        const exp = `(let-values (((x (y : (number * number * number)) z) (values 1 (values 2 2.5 2.9) 3))) (values x y z))`
        expect(L5typeof(exp)).to.deep.equal(makeOk("(number * (number * number * number) * number)"));
    });
    it('Bonus 3 - eval', () => {
        const exp = `(let-values (((x (y : (number * number * number)) z) (values 1 (values 2 2.5 2.9) 3))) y)`
        expect(evalParse(exp)).to.deep.equal(makeOk([2, 2.5, 2.9]));
    });
    
    it('Bonus 4 - typeof', () => {
        const exp = `(let-values (((x (y : (number * (number * number * number) * number)) z) (values 1 (values 2 (values 2.5 2.55 2.59) 2.9) 3))) (values x y z))`
        expect(L5typeof(exp)).to.deep.equal(makeOk("(number * (number * (number * number * number) * number) * number)"));
    });
    it('Bonus 4 - eval', () => {
        const exp = `(let-values (((x (y : (number * (number * number * number) * number)) z) (values 1 (values 2 (values 2.5 2.55 2.59) 2.9) 3))) y)`
        expect(evalParse(exp)).to.deep.equal(makeOk([2, [2.5, 2.55, 2.59], 2.9]));
    });
});



