BENCHMARKS = `find benchmark -name benchmark.js`

test:
	export NODE_PATH=$NODE_PATH:lib && ./node_modules/it/bin/it -r dotmatrix

benchmarks:
	for file in $(BENCHMARKS) ; do \
	    echo $$file && node $$file ; \
	done

.PHONY: test benchmarks



