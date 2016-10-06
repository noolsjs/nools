/*global module:false*/
module.exports = function (grunt) {
    // Project configuration.
    var path = require("path"),
        child = require("child_process");
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        exec: {
            removeDocs: "rm -rf docs/* && mkdir -p ./docs/examples/browser && cp -r ./examples/browser ./docs/examples && cp ./nools.min.js ./docs/nools.js",
            createDocs: 'node_modules/coddoc/bin/coddoc -f multi-html -d ./lib --dir ./docs'
        },

        jshint: {
            src: ["./index.js", "lib/**/*.js", "Gruntfile.js"],
            options: {
                jshintrc: '.jshintrc',
                ignores: ["./lib/parser/constraint/parser.js"]
            }
        },
        it: {
            all: {
                src: 'test/**/*.test.js',
                options: {
                    timeout: 3000, // not fully supported yet
                    reporter: 'dotmatrix'
                }
            }
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint it'
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                    '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
                    '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
                    ' Licensed <%= pkg.license %> */\n',
                report: 'min'
            },
            min: {
                files: {
                    '<%= pkg.name %>.min.js': ['nools.js']
                }
            }
        },

        browserify: {
            'nools': {
                src: ['./browser/nools.js'],
                dest: './nools.js'
            }
        },

        benchmark: {
            manners: {
                files: "./benchmark/manners/benchmark.js"
            },
            sendMoreMoney: {
                files: "./benchmark/sendMoreMoney/benchmark.js"
            },
            simple: {
                files: "./benchmark/simple/benchmark.js"
            },
            waltzDb: {
                files: "./benchmark/waltzDb/benchmark.js"
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['jshint', "compile-tests", 'it', 'browserify:nools', 'uglify:min', 'exec']);
    grunt.loadNpmTasks('grunt-it');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask("compile-tests", "compiles all nools files", function () {
        var files = grunt.file.expand("./test/rules/*.nools"), count = files.length, done = this.async();

        function counter(err) {
            if (err) {
                done(err);
            } else {
                count--;
                if (!count) {
                    done();
                }
            }
        }

        files.forEach(function (file) {
            var base = path.basename(file, ".nools"),
                out = path.resolve(path.dirname(file), base + "-compiled.js");
            child.exec(path.resolve(__dirname, "./bin/nools") + " compile " + file + " -l ../../ -n " + base + "-compiled", function (err, output) {
                if (!err) {
                    grunt.file.write(out, output.toString());
                }
                counter(err);
            });
        });
    });

    grunt.registerTask("benchmarks", function () {

    });

    grunt.registerMultiTask('benchmark', 'execute it unit tests in a spawned process', function () {
        var done = this.async();
        require(this.data.files).classic(function (err) {
            if (err) {
                done(false);
            } else {
                done();
            }
        });
    });
};
