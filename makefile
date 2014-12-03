SRC = lib/*.js
NODE_HARMONY = node --use-strict $(node --v8-options | grep harm | awk '{print $1}' | xargs)

DIR ?= $(dir $(lastword $(MAKEFILE_LIST)))
LINT_CONFIG ?= $(DIR)/.jshintrc
LINT := $(DIR)/node_modules/.bin/jshint

REPORTER = spec
TIMEOUT = 3000
MOCHA_OPTS =
TESTS = test/base.js \
		test/mongodb.js

lint:
	@$(LINT) --config $(LINT_CONFIG) $(SRC)

test: lint
	@NODE_ENV=test $(NODE_HARMONY) \
		./node_modules/mocha/bin/mocha --harmony \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		$(MOCHA_OPTS) \
		test/index.js

test-cov:
	@NODE_ENV=test node $(node --v8-options | grep harm | awk '{print $1}' | xargs) \
		node_modules/istanbul/lib/cli.js cover --traceur \
		./node_modules/.bin/_mocha \
		-- -u exports \
		--require should \
		$(TESTS) \
		--bail

test-travis:
	@NODE_ENV=test node $(node --v8-options | grep harm | awk '{print $1}' | xargs) \
		node_modules/istanbul/lib/cli.js cover --traceur \
		./node_modules/.bin/_mocha \
		--report lcovonly \
		-- -u exports \
		--require should \
		$(TESTS) \
		--bail

.PHONY: test