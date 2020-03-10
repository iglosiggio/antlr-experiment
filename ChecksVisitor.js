const ABAPVisitor = require('./ABAPVisitor').ABAPVisitor;
const typeMap = require('./common.js').typeMap;

const isString = v => typeof v === 'string';
const isObject = v => typeof v === 'object';

class ChecksVisitor extends ABAPVisitor {
	variables = {};
	source = '';

	constructor(source = 'stdin') {
		super();
		this.source = source;
	}

	checkUndefined(ctx, ident) {
		const line = ctx.start.line;
		if (this.variables.hasOwnProperty(ident)) {
			const oldLine = this.variables[ident].line;
			return `${this.source}:${line} identifier ${ident} was already defined in line ${oldLine}.`;
		}
	}

	checkType(ctx, expr, type) {
		const line = ctx.start.line;
		if (expr.type !== type)
			return `${this.source}:${line} argument \`${expr.text}\` is not a ${type}.`
	}

	checkDefined(ctx, ident) {
		const line = ctx.start.line;
		if (!this.variables.hasOwnProperty(ident))
			return `${this.source}:${line} identifier ${ident} was not previously defined.`;
	}

	visitFile(ctx) {
		const isValidError = error => typeof(error) === 'string' && error !== '';
		/* Register variables */
		const parameters = ctx.parameterList().accept(this) || [];
		const datas = ctx.dataList().accept(this) || [];

		/* Get most of the errors */
		const statements = ctx.statementList().accept(this).flat();

		return [
			...parameters,
			...datas,
			...statements
		].filter(isValidError);
	}

	visitParameter(ctx) {
		const ident = ctx.IDENTIFIER().getText();
		const type = typeMap[ctx.type().getText()];
		const line = ctx.start.line;
		const error = this.checkUndefined(ctx, ident);

		if (error)
			return error;

		this.variables[ident] = { type, line };
	}

	visitData(ctx) {
		const ident = ctx.IDENTIFIER().getText();
		const type = typeMap[ctx.type().getText()];
		const line = ctx.start.line;
		const error = this.checkUndefined(ctx, ident);

		if (error)
			return error;

		this.variables[ident] = { type, line };
	}

	visitWriteStatement(ctx) {
		const expressions = ctx.expressionList().accept(this);
		const expressionErrors = expressions.filter(v => typeof(v) === 'string');
		const expressionTypes = expressions.filter(v => typeof(v) === 'object');
		const line = ctx.start.line;

		return [
			...expressionErrors,
			...expressionTypes.map(expr => this.checkType(ctx, expr, 'string')),
		];
	}

	visitConcatenateStatement(ctx) {
		const ident = ctx.IDENTIFIER().getText();
		const expressions = ctx.expressionList().accept(this);
		const expressionErrors = expressions.filter(isString);
		const expressionTypes = expressions.filter(isObject);
		const line = ctx.start.line;

		return [
			...expressionErrors,
			...expressionTypes.map(expr => this.checkType(ctx, expr, 'string')),
			this.checkDefined(ctx, ident),
		];
	}

	visitExpression(ctx) {
		const ident = ctx.IDENTIFIER();
		const integer = ctx.INTEGER();
		const string = ctx.STRING();
		const line = ctx.start.line;

		if (ident !== null) {
			const identName = ident.getText();
			const error = this.checkDefined(ctx, identName);

			if (error)
				return error;

			return {
				type: this.variables[identName].type,
				text: identName
			};
		}

		if (integer !== null)
			return { type: 'integer', text: integer.getText() };

		if (string !== null)
			return { type: 'string', text: string.getText() };

		return `${source}:${line} Invalid expression.`;
	}

	visitStatement(ctx) {
		return ctx.getChild(0).accept(this);
	}
}

module.exports = ChecksVisitor;