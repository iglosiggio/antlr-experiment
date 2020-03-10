const fs = require('fs');
const readline = require('readline');

const antlr4 = require('antlr4');
const Lexer = require('./ABAPLexer').ABAPLexer;
const Parser = require('./ABAPParser').ABAPParser;
const Visitor = require('./ABAPVisitor').ABAPVisitor;

const ChecksVisitor = require('./ChecksVisitor');
const CompilerVisitor = require('./CompilerVisitor');

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

class ShouldCancelErrorListener extends antlr4.error.ErrorListener {
	shouldCancel = false;

	syntaxError() {
		this.shouldCancel = true;
	}
}

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
				rlInstance.once('line', () => accept(consumeLine()));
		});
	};

	return readLine;
};

const main = async ({ source: filename, input }) => {
	const sourceContents = fs.readFileSync(filename, 'utf8');
	const chars = new antlr4.InputStream(sourceContents);
	const lexer = new Lexer(chars);
	const tokens  = new antlr4.CommonTokenStream(lexer);
	const parser = new Parser(tokens);
	const errorListener = new ShouldCancelErrorListener();
	parser.addErrorListener(new ShouldCancelErrorListener());
	const tree = parser.file();

	if (errorListener.shouldCancel)
		return;

	const errors = tree.accept(new ChecksVisitor(filename));
	errors.forEach(error => console.error(error));

	if (errors.length > 0)
		return;

	const ABAPCode = tree.accept(new CompilerVisitor(filename));
	const readlineInstance = readline.createInterface({
		input,
		crlfDelay: Infinity,
	});
	await ABAPCode(makeReadLineByLine(readlineInstance))
	readlineInstance.close();
}

main(parseArguments());
