REPORT Z_DRETS_DEMO.

PARAMETER name TYPE string.
PARAMETER age TYPE i.

DATA age_string TYPE string.
DATA msg TYPE string.

age_string = age.
CONCATENATE 'Hello, ' name ', so nice to hear you are ' age_string ' years old!' INTO msg.

WRITE msg.

