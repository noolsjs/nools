module.exports = function (grunt) {
    grunt.initConfig({
        pkg: '<json:package.json>',
        meta: {
            banner:'// <%= pkg.title || pkg.name %> - v<%= pkg.version %> \n\n' +
                '// Built <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
                '// Licensed <%= pkg.license %>'
        },
        min: {
            dist: {
                src: ['bundle.js'],
                dest: 'nools-min.js'
            }
        },
        uglify: {
            mangle: true
        }
    });
};
