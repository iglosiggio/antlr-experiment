REPORT CHECKS_VISITOR_DEMO.

PARAMETER name TYPE string.
PARAMETER name TYPE string.
PARAMETER age TYPE i.
PARAMETER name TYPE string.
PARAMETER year TYPE i.

DATA age TYPE i.
DATA other TYPE string.
DATA one_two_three_four TYPE string.

age = other.
other = age.
unknown = age.
age = unknown.
age = 5.
other = 'asd'.
other = 66.

WRITE 'Hello, ' nnamme '. I am glad to see that you are ' age ' years old.' .
CONCATENATE 'Hello, ' nnamme '. I am glad to see that you are ' age ' years old.' INTO undefined_var.
WRITE 66.
CONCATENATE 1 2 3 4 INTO one_two_three_four.
