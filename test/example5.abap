REPORT invalid_report_name.

PARAMETER name TYPE list.
PARAMETER age TYPE integer.

DATA 0variable TYPE i.
DATA 123 TYPE string.
DATA one_two_three_four TYPE string.

WRITE 'Hello, ' name '. I am glad to see that you are ' age ' years old.' undefined_var.
CONCATENATE 'Hello, ' nname '. I am glad to see that you are ' age ' years old.' INTO undefined_var.
READ name INTO 0variable.
