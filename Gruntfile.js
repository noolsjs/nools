/*global module:false*/
module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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
                    ' Licensed <%= pkg.license %> */\n'
                //report: 'gzip'
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
        }
    });

    // Default task.
    grunt.registerTask('default', ['jshint', 'it', 'browserify:nools', 'uglify:min']);
    grunt.loadNpmTasks('grunt-it');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-browserify');
};
