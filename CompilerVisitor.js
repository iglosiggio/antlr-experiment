const ABAPVisitor = require('./ABAPVisitor').ABAPVisitor;
const typeMap = require('./common').typeMap;

const tryCoherce = ({ source, line }, value, originalType, finalType) => {
	const fail = () => {
		throw new Error(`${source}:${line} Couldn\'t coherce \`${value}\` into ${finalType}.`);
	};

	if (originalType == finalType)
		return value;

	if (finalType === 'string')
		return value.toString();

	if (finalType == 'integer' && originalType == 'string') {
		if (value.match(/^\s*[0-9]+\s*$/) === null)
			fail();
		const number = Number(value);

		if (isNaN(number))
			fail();

		return number;
	}

	fail();
};

const tryRead = ({ source, line, text }, ident, state) => {
	if (state[ident].value === undefined)
		throw new Error(`${source}:${line} Couldn't read variable ${text} because it was never set.`);

	return state[ident];
};

/* CompilerVisitor:
 *
 * Transforms the ParseTree into an anonymous function that interprets the
 * program. During the runtime of the program a few error may ocurr:
 *   * Unset variables:
 *       When trying to read a DATA that was never set.
 *   * Invalid cohersion:
 *       When trying to assign a non-numeric string value to a number.
 *
 * These errors are considered fatal and terminate the excecution of the
 * program.
 *
 * ADDITIONAL NOTES:
 *   The approach of composing anonymous functions for an interpreter is really
 *   easy to write but a bit slow. It shouldn't be difficult to transform this
 *   visitor into one that transpiles to javascript or one that interprets the
 *   code __during__ the visit.
 */
class CompilerVisitor extends ABAPVisitor {
	state = {};
	source = '';

	constructor(source = 'stdin') {
		super();
		this.source = source;
	}

	getLocInfo(ctx) {
		const firstToken = ctx.start || ctx.symbol;

		return {
			source: this.source,
			line: firstToken.line,
			text: ctx.getText(),
		};
	}

	visitFile(ctx) {
		const program_name = ctx.reportHeader().accept(this);
		const parameters = ctx.parameterList().accept(this);
		const datas = ctx.dataList().accept(this);
		const statements = ctx.statementList().accept(this);
		const code = [
			() => console.log(`Program ${program_name}`),
			...parameters || [],
			...datas || [],
			...statements || [],
		];

		return async (readLine) => {
			try {
				for (const fn of code)
					await fn(readLine);
			} catch (e) {
				console.error(e.message);
			}
		};
	}

	visitReportHeader(ctx) {
		return ctx.REPORTNAME().getText();
	}

	visitParameter(ctx) {
		const ident = ctx.IDENTIFIER().getText();
		const type = typeMap[ctx.type().getText()];
		const state = this.state;
		const loc = this.getLocInfo(ctx);

		return async (readLine) => {
			console.log(`${ident} (type : ${type}):`);
			const value = await readLine();

			state[ident] = {
				type,
				value: tryCoherce(loc, value, 'string', type),
			};
		};
	}

	visitData(ctx) {
		const ident = ctx.IDENTIFIER().getText();
		const type = typeMap[ctx.type().getText()];
		const state = this.state;

		return () => {
			state[ident] = { type, value: undefined };
		};
	}

	visitAssignmentStatement(ctx) {
		const ident = ctx.IDENTIFIER().getText();
		const value = ctx.expression().accept(this);
		const state = this.state;
		const loc = this.getLocInfo(ctx);

		return () => {
			const type = state[ident].type;
			const lvalue = value();
			state[ident].value = tryCoherce(loc, lvalue.value, lvalue.type, type);
		};
	}

	visitWriteStatement(ctx) {
		const expressions = ctx.expressionList().accept(this);
		return () => console.log(expressions.map(fn => fn().value).join(''));
	}

	visitConcatenateStatement(ctx) {
		const ident = ctx.IDENTIFIER().getText();
		const values = ctx.expressionList().accept(this);
		const state = this.state;

		return () => {
			state[ident].value = values.map(fn => fn().value).join('');
		};
	}

	visitExpression(ctx) {
		const ident = ctx.IDENTIFIER();
		const integer = ctx.INTEGER();
		const string = ctx.STRING();
		const state = this.state;

		if (ident !== null) {
			const loc = this.getLocInfo(ident);
			const identName = ident.getText();
			return () => tryRead(loc, identName, state);
		}

		if (integer !== null) {
			const value = Number(integer.getText());
			return () => ({ type: 'integer', value });
		}

		if (string !== null) {
			const value = string.getText().slice(1, -1);
			return () => ({ type: 'string', value });
		}

		throw new Error('Invalid expression');
	}

	visitStatement(ctx) {
		return ctx.getChild(0).accept(this);
	}
}

module.exports = CompilerVisitor;
