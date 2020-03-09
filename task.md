# Evaluation Task

Use the language of your choice to write interpreter for ABAP-like syntax.

## Example 1:

Source code to run:

```
REPORT ZDEMO.

PARAMETER name TYPE string.
WRITE 'Hello, ' name.
```

with the user input:

```
Bob
```

the interpreter outputs something like this:

```
Programm ZDEMO
name (type : string):
Hello, Bob
```

## Example 2:

Source code to run:

```
REPORT SAMPLE3.

PARAMETER blah TYPE string.

DATA foo TYPE string.
DATA bar TYPE i.
DATA bar1 TYPE string.
DATA baz TYPE i.
DATA baz1 TYPE string.

foo = 'foo'.
bar = 42.
baz = blah.
bar1 = bar.
baz1 = baz.

WRITE foo.
WRITE bar1.
WRITE baz1.
```

with the user input:

```
84
```

the interpreter outputs something like this:

```
Programm SAMPLE3
:blah (type : string):
foo
42
84
```

## Example 3:

Source code to run:

```
REPORT Z_DRETS_DEMO.

PARAMETER name TYPE string.
PARAMETER age TYPE i.

DATA age_string TYPE string.
DATA msg TYPE string.

age_string = age.
CONCATENATE 'Hello, ' name ', so nice to hear you are ' age_string ' years old!' INTO msg.

WRITE msg.
```

with the user input:

```
DMITRY
1723
```

the interpreter outputs something like this:

```
Programm Z_DRETS_DEMO
name (type : string):
age (type : integer):
Hello, DMITRY, so nice to hear you are 1723 years old!
```

## Usage

The interpreter is a command line tool.

Having the source file we can run it like this:

```
./my-interpreter --source mySourceFile.abap
```

We also can provide user input via typing in console or via file like:

```
./my-interpreter --source mySourceFile.abap --input myUserInputFile.txt
```

Please use ANTLR (https://www.antlr.org) tool for writing a grammar, for
getting AST to evaluate.

Enjoy :)
