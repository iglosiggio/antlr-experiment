grammar ABAP;

file : reportHeader parameterList dataList statementList EOF;

reportHeader  : 'REPORT' REPORTNAME '.' ;
parameterList : parameter* ;
dataList      : data* ;
statementList : statement* ;

parameter : 'PARAMETER' IDENTIFIER 'TYPE' type '.' ;
data      : 'DATA' IDENTIFIER 'TYPE' type '.' ;
statement : assignmentStatement | writeStatement | concatenateStatement ;

assignmentStatement  : IDENTIFIER '=' expression '.' ;
writeStatement       : 'WRITE' expressionList '.' ;
concatenateStatement : 'CONCATENATE' expressionList 'INTO' IDENTIFIER '.' ;

type           : 'string' | 'i' ;
expression     : IDENTIFIER | INTEGER | STRING ;
expressionList : expression+ ;

WHITESPACE : [ \t\r\n]+ -> skip ;
STRING     : QUOTE CHAR+ QUOTE ;
INTEGER    : [0-9]+ ;
IDENTIFIER : [a-z_][a-z_0-9]* ;
REPORTNAME : [A-Z_][A-Z_0-9]* ;
QUOTE      : '\'' ;
CHAR       : ~[\\'] | ESCAPEDCHAR ;
ESCAPEDCHAR : '\\' . ;
