SRC = lib/*.js

NODE_EXEC = node --use-strict $(node --v8-options | grep harm | awk '{print $1}' | xargs)

DIR ?= $(dir $(lastword $(MAKEFILE_LIST)))
LINT_CONFIG ?= $(DIR)/.jshintrc
LINT := $(DIR)/node_modules/.bin/jshint

REPORTER = spec
TIMEOUT = 3000
MOCHA_OPTS =

lint:
	@$(LINT) --config $(LINT_CONFIG) $(SRC)

test: lint
	@NODE_ENV=test $(NODE_EXEC) ./node_modules/mocha/bin/mocha --harmony \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		$(MOCHA_OPTS) \
		test/index.js


.PHONY: test