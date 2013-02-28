/*global module:false*/
module.exports = function (grunt) {
    var fs = require('fs');

    // grunt doesn't natively support reading config from .jshintrc yet
    var jshintOptions = JSON.parse(fs.readFileSync('./.jshintrc'));

    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>',
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
                ' Licensed <%= pkg.license %> */'
        },

        jshint: {
            options: jshintOptions,
            globals: jshintOptions.predef
        },

        browserify: {
            'nools.js': {
                entries: ['browser/nools.js']
            }
        },

        lint: {
            files: [
                'array.js'
            ]
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
        min: {
            dist: {
                src: ['<banner:meta.banner>', 'nools.js'],
                dest: '<%= pkg.name %>.min.js'
            }
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint it'
        },
        uglify: {}
    });

    // Default task.
    grunt.registerTask('default', 'lint it browserify min');
    grunt.loadNpmTasks('grunt-it');
    grunt.loadNpmTasks('grunt-browserify');

};
