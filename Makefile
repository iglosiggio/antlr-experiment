# Path to your antl4-complete.jar goes here
CLASSPATH=/usr/share/java/antlr-4.8-complete.jar

# Yup, i'm just tracking this file instead of the whole generated project
ABAPParser.java: ABAP.g4
	antlr4 $<
ABAPParser.class: ABAPParser.java
	env CLASSPATH="$(CLASSPATH)" javac *.java
ABAPParser.js: ABAP.g4
	antlr4 -Dlanguage=JavaScript $<

run-tree: ABAPParser.class
	grun ABAP file -tree
run-gui: ABAPParser.class
	grun ABAP file -gui

tree-%: example%.abap
	$(MAKE) run-tree < $<
gui-%: example%.abap
	$(MAKE) run-gui < $<

clean:
	rm -f ABAP*.java ABAP*.class ABAP*.tokens ABAP*.interp
	rm -f ABAP*.js

.PHONY: clean run-tree run-gui