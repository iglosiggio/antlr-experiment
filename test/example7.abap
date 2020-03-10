REPORT COHERCION_DEMO_2.

PARAMETER age TYPE string.

DATA age_i TYPE i.
DATA age_i_str TYPE string.

age_i = age.
age_i_str = age_i.

WRITE 'Your age is: ' age_i_str.
