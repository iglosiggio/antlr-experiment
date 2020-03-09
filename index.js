const fs = require('fs');
const readline = require('readline');

const parseArguments = () => {
	let expectingSource = false;
	let expectingInput = false;
	let source = 'test/example3.abap';
	let input = process.stdin;

	for (const argument of process.argv) {
		if (expectingSource) {
			source = argument;
			expectingSource = false;
		} else if (expectingInput) {
			input = fs.createReadStream(argument);
			expectingInput = false;
		} else if (argument === '--source')
			expectingSource = true;
		else if (argument === '--input')
			expectingInput = true;
	}

	return { source, input };
};

const { source, input, terminal } = parseArguments();
const sourceContents = fs.readFileSync(source, 'utf8');
const readlineInstance = readline.createInterface({
	input,
	crlfDelay: Infinity,
});

const antlr4 = require('antlr4');
const Lexer = require('./ABAPLexer').ABAPLexer;
const Parser = require('./ABAPParser').ABAPParser;
const Visitor = require('./ABAPVisitor').ABAPVisitor;

const chars = new antlr4.InputStream(sourceContents);
const lexer = new Lexer(chars);
const tokens  = new antlr4.CommonTokenStream(lexer);
const parser = new Parser(tokens);
parser.buildParseTrees = true;
const tree = parser.file();

const makeReadLineByLine = (rlInstance) => {
	const lines = [];
	const consumeLine = () => lines.splice(0, 1)[0];

	rlInstance.on('line', line => {
		lines.push(line);
	});

	const readLine = () => {
		return new Promise(accept => {
			if (lines.length >= 1)
				accept(consumeLine());
			else
				readlineInstance.once('line', () => accept(consumeLine()));
		});
	};
	readLine.string = readLine;
	readLine.integer = async () => Number(await readLine());

	return readLine;
};

const typeMap = {
	string: 'string',
	i: 'integer',
};

class CustomVisitor extends Visitor {
	state = {};

	visitFile(ctx) {
		const parameters = ctx.parameterList().accept(this);
		const datas = ctx.dataList().accept(this);
		const statements = ctx.statementList().accept(this);
		const code = [
			() => console.log(`Program ${ctx.reportHeader().accept(this)}`),
			...parameters || [],
			...datas || [],
			...statements || [],
			() => readlineInstance.close(),
		];

		return async (readLine) => {
			for (const fn of code)
				await fn(readLine);
		};
	}

	visitReportHeader(ctx) {
		return ctx.REPORTNAME().getText();
	}

	visitParameter(ctx) {
		const ident = ctx.IDENTIFIER().getText();
		const type = typeMap[ctx.type().getText()];
		const state = this.state;

		return async (readLine) => {
			console.log(`${ident} (type : ${type}):`);
			state[ident] = { type, value: undefined };
			state[ident].value = await readLine[type]();
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

		return () => {
			/* TODO: Validate types */
			const { type: lvalueType, value: lvalueValue } = value();
			state[ident].value = lvalueValue;
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
			const identName = ident.getText();
			return () => state[identName];
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

const ABAPCode = tree.accept(new CustomVisitor())
ABAPCode(makeReadLineByLine(readlineInstance));
