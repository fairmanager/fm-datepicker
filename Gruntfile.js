module.exports = function( grunt ) {

	// Project configuration.
	grunt.initConfig(
		{
			pkg : grunt.file.readJSON( "bower.json" ),

			jshint : {
				options : {
					jshintrc : true
				},
				src     : {
					src : [
						"src/*.js"
					]
				}
			},

			copy : {
				js      : {
					src  : "src/<%= pkg.name %>.js",
					dest : "dist/<%= pkg.name %>.js"
				},
				hamster : {
					src  : "bower_components/hamsterjs/hamster.js",
					dest : "dist/hamster.js"
				}
			},

			uglify : {
				js : {
					src  : "src/<%= pkg.name %>.js",
					dest : "dist/<%= pkg.name %>.min.js"
				}
			},

			watch : {
				files : [ "src/*.js", "dist/demo.html" ],
				tasks : [ "jshint", "copy", "uglify" ]
			},

			"gh-pages" : {
				options : {
					base : "dist"
				},
				src     : [ "**" ]
			}
		}
	);

	grunt.loadNpmTasks( "grunt-contrib-copy" );
	grunt.loadNpmTasks( "grunt-contrib-jshint" );
	grunt.loadNpmTasks( "grunt-contrib-uglify" );
	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-gh-pages" );

	grunt.registerTask( "default", [ "jshint", "copy", "uglify" ] );
};
