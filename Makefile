# Path to your antl4-complete.jar goes here
CLASSPATH=/usr/share/java/antlr-4.8-complete.jar

# Yup, i'm just tracking this file instead of the whole generated project
ABAPParser.java: ABAP.g4
	antlr4 $<
ABAPParser.class: ABAPParser.java
	env CLASSPATH="$(CLASSPATH)" javac *.java
ABAPParser.js: ABAP.g4
	antlr4 -Dlanguage=JavaScript -visitor $<

run-tree: ABAPParser.class
	grun ABAP file -tree
run-gui: ABAPParser.class
	grun ABAP file -gui

tree-%: test/example%.abap
	$(MAKE) run-tree < $<
gui-%: test/example%.abap
	$(MAKE) run-gui < $<

test-%: test/example%.abap test/example%.input test/example%.output ABAPParser.js
	@echo "=== RESULT ==="
	@node index.js --source test/example$*.abap --input test/example$*.input;
	@echo "=== HASH $$(node index.js --source test/example$*.abap --input test/example$*.input | sha256sum | cut -d' ' -f1) ==="
	@echo "=== EXPECTED RESULT ==="
	@cat test/example$*.output
	@echo "=== HASH $$(sha256sum test/example$*.output | cut -d' ' -f1) ==="

clean:
	rm -f ABAP*.java ABAP*.class ABAP*.tokens ABAP*.interp
	rm -f ABAP*.js

.PHONY: clean run-tree run-gui
