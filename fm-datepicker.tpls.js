/**
 * Copyright (C) 2015, HARTWIG Communication & Events GmbH & Co. KG
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * Created: 2015-10-08 15:26
 *
 * @author Oliver Salzburg <oliver.salzburg@gmail.com>
 * @copyright Copyright (C) 2015, HARTWIG Communication & Events GmbH & Co. KG
 * @license http://opensource.org/licenses/mit-license.php MIT License
 */

(function() {
	"use strict";

	/* globals $, angular, Hamster, moment */

	var ONE_DAY  = moment.duration( 1, "day" );
	var ONE_WEEK = moment.duration( 1, "week" );

	angular.module( "fmDatepicker", [] );

	angular.module( "fmDatepicker" )
		.filter( "fmDateFormat", fmDateFormat )
		.filter( "fmDateInterval", fmDateInterval )
		.controller( "fmDatepickerController", fmDatepickerController )
		.directive( "fmDatepickerToggle", fmDatepickerToggle )
		.directive( "fmDatepicker", fmDatepicker );

	function fmDateFormat() {
		return function fmDateFormatFilter( input, format ) {
			if( typeof input === "number" ) {
				input = moment( input );
			}
			return moment( input ).format( format );
		};
	}

	function fmDateInterval() {
		return function fmDateIntervalFilter( input, start, end ) {
			if( !start || !end || !start.isValid() || !end.isValid() ) {
				return input;
			}

			start = moment( start );
			end   = moment( end );
			for( var time = start.clone(); +time <= +end; time.add( ONE_DAY ) ) {
				// We're using the UNIX offset integer value here.
				// When trying to return the actual moment instance (and then later format it through a filter),
				// you will get an infinite digest loop, because the returned objects in the resulting array
				// will always be new, unique instances. We always need to return the identical, literal values for each input.
				input.push( +time );

				if( 9999 < input.length ) {
					// Very likely a bounds issue. Avoid infinite loops.
					break;
				}
			}
			return input;
		};
	}

	/* @ngInject */
	function fmDatepickerController( $scope ) {
		$scope.fmFormat      = $scope.fmFormat || "LL";
		$scope.fmStartDate   = $scope.fmStartDate || moment().startOf( "month" );
		$scope.fmEndDate     = $scope.fmEndDate || moment().endOf( "month" );
		$scope.fmIsOpen      = $scope.fmIsOpen || false;
		$scope.fmStyle       = $scope.fmStyle || "dropdown";
		$scope.fmStrict      = $scope.fmStrict || false;
		$scope.fmBtnClass    = $scope.fmBtnClass || "btn btn-default";
		$scope.fmIconClasses = $scope.fmIconClasses || {
				plus     : "glyphicon glyphicon-plus",
				minus    : "glyphicon glyphicon-minus",
				calendar : "glyphicon glyphicon-calendar"
			};

		if( moment.tz ) {
			$scope.fmStartDate.tz( $scope.fmTimezone );
			$scope.fmEndDate.tz( $scope.fmTimezone );
		}

		/**
		 * Returns a time value that is within the bounds given by the start and end time parameters.
		 * @param {Moment} time The time value that should be constrained to be within the given bounds.
		 * @returns {Moment} A new time value within the bounds, or the input instance.
		 */
		$scope.ensureTimeIsWithinBounds = function ensureTimeIsWithinBounds( time ) {
			// We expect "time" to be a Moment instance; otherwise bail.
			if( !time || !moment.isMoment( time ) ) {
				return time;
			}
			// Constrain model value to be in given bounds.
			if( time.isBefore( $scope.fmStartDate ) ) {
				return moment( $scope.fmStartDate );
			}
			if( time.isAfter( $scope.fmEndDate ) ) {
				return moment( $scope.fmEndDate );
			}
			return time;
		};
		$scope.ngModel = $scope.ensureTimeIsWithinBounds( $scope.ngModel );

		/**
		 * Utility method to find the index of an item, in our collection of possible values, that matches a given time value.
		 * @param {Moment} model A moment instance to look for in our possible values.
		 */
		$scope.findActiveIndex = function findActiveIndex( model ) {
			$scope.activeIndex = 0;
			if( !model || !$scope.fmStartDate.isValid() || !$scope.fmEndDate.isValid() ) {
				return;
			}

			// We step through each possible value instead of calculating the index directly,
			// to make sure we account for DST changes in the reference timezone.
			for( var time = $scope.fmStartDate.clone(); +time <= +$scope.fmEndDate; time.add( ONE_DAY ), ++$scope.activeIndex ) {

				if( 9999 < $scope.activeIndex ) {
					// Very likely a bounds issue. Avoid infinite loops.
					break;
				}

				if( time.isSame( model ) ) {
					break;
				}
				// Check if we've already passed the time value that would fit our current model.
				if( time.isAfter( model ) ) {
					// If we're in strict mode, set an invalid index.
					if( $scope.fmStrict ) {
						$scope.activeIndex = -1;
					}
					// If we're not in strict mode, decrease the index to select the previous item (the one we just passed).
					$scope.activeIndex -= 1;
					// Now bail out and use whatever index we determined.
					break;
				}
			}
		};
		// Seed the active index based on the current model value.
		$scope.findActiveIndex( $scope.ngModel );
	}
	fmDatepickerController.$inject = ["$scope"];

	function fmDatepickerToggle() {
		return {
			restrict : "A",
			link     : function postLink( scope, element, attributes ) {
				// Toggle the popup when the toggle button is clicked.
				element.bind( "click", function onClick() {
					if( scope.fmIsOpen ) {
						scope.focusInputElement();
						scope.closePopup();
					} else {
						// Focusing the input element will automatically open the popup
						scope.focusInputElement();
					}
				} );
			}
		};
	}

	/* @ngInject */
	function fmDatepicker( $timeout ) {
		return {
			templateUrl : "fmDatepicker.html",
			replace     : true,
			restrict    : "E",
			scope       : {
				ngModel     : "=",
				fmFormat    : "=?",
				fmTimezone  : "=?",
				fmStartDate : "=?",
				fmEndDate   : "=?",
				fmIsOpen    : "=?",
				fmStyle     : "=?",
				fmStrict    : "=?",
				fmBtnClass  : "=?",
				fmDisabled  : "=?"
			},
			controller  : "fmDatepickerController",
			require     : "ngModel",
			link        : function postLink( scope, element, attributes, controller ) {
				// Watch our input parameters and re-validate our view when they change.
				scope.$watchCollection( "[fmStartDate,fmEndDate,fmStrict]", function inputWatcher() {
					validateView();
				} );

				// Watch all time related parameters.
				scope.$watchCollection( "[fmStartDate,fmEndDate,ngModel]", function dateWatcher() {
					// When they change, find the index of the element in the dropdown that relates to the current model value.
					scope.findActiveIndex( scope.ngModel );
				} );

				/**
				 * Invoked when we need to update the view due to a changed model value.
				 */
				controller.$render = function render() {
					// Convert the moment instance we got to a string in our desired format.
					var time = moment( controller.$modelValue ).format( scope.fmFormat );
					// Check if the given time is valid.
					var timeValid = checkTimeValueValid( time );
					if( scope.fmStrict ) {
						timeValid = timeValid && checkTimeValueWithinBounds( time );
					}

					if( timeValid ) {
						// If the time is valid, store the time string in the scope used by the input box.
						scope.time = time;
					} else {
						throw new Error( "The provided time value is invalid." );
					}
				};

				/**
				 * Reset the validity of the directive.
				 * @param {Boolean} to What to set the validity to?
				 */
				function resetValidity( to ) {
					controller.$setValidity( "time", to );
					controller.$setValidity( "bounds", to );
					controller.$setValidity( "start", to );
					controller.$setValidity( "end", to );
				}

				/**
				 * Check if the value in the view is valid.
				 * It has to represent a valid time in itself and it has to fit within the constraints defined through our input parameters.
				 */
				function validateView() {
					resetValidity( true );
					// Check if the string in the input box represents a valid date according to the rules set through parameters in our scope.
					var timeValid = checkTimeValueValid( scope.time );
					if( scope.fmStrict ) {
						timeValid = timeValid && checkTimeValueWithinBounds( scope.time );
					}

					if( !scope.fmStartDate.isValid() ) {
						controller.$setValidity( "start", false );
					}
					if( !scope.fmEndDate.isValid() ) {
						controller.$setValidity( "end", false );
					}

					if( timeValid ) {
						// If the string is valid, convert it to a moment instance, store in the model and...
						var newTime;
						if( moment.tz ) {
							newTime = moment.tz(
								scope.time,
								scope.fmFormat,
								scope.fmTimezone );
						} else {
							newTime = moment( scope.time, scope.fmFormat );
						}
						controller.$setViewValue( newTime );
						// ...convert it back to a string in our desired format.
						// This allows the user to input any partial format that moment accepts and we'll convert it to the format we expect.
						if( moment.tz ) {
							scope.time = moment.tz(
								scope.time,
								scope.fmFormat,
								scope.fmTimezone ).format( scope.fmFormat );
						} else {
							scope.time = moment( scope.time, scope.fmFormat ).format( scope.fmFormat );
						}
					}
				}

				/**
				 * Check if a given string represents a valid time in our expected format.
				 * @param {String} timeString The timestamp is the expected format.
				 * @returns {boolean} true if the string is a valid time; false otherwise.
				 */
				function checkTimeValueValid( timeString ) {
					var time;
					if( moment.tz ) {
						time = timeString ? moment.tz(
							timeString,
							scope.fmFormat,
							scope.fmTimezone ) : moment.invalid();
					} else {
						time = timeString ? moment( timeString, scope.fmFormat ) : moment.invalid();
					}
					if( !time.isValid() ) {
						controller.$setValidity( "time", false );
						controller.$setViewValue( null );
						return false;
					} else {
						controller.$setValidity( "time", true );
						return true;
					}
				}

				/**
				 * Check if a given string represents a time within the bounds specified through our start and end times.
				 * @param {String} timeString The timestamp is the expected format.
				 * @returns {boolean} true if the string represents a valid time and the time is within the defined bounds; false otherwise.
				 */
				function checkTimeValueWithinBounds( timeString ) {
					var time;
					if( moment.tz ) {
						time = timeString ? moment.tz(
							timeString,
							scope.fmFormat,
							scope.fmTimezone ) : moment.invalid();
					} else {
						time = timeString ? moment( timeString, scope.fmFormat ) : moment.invalid();
					}
					if( !time.isValid() || time.isBefore( scope.fmStartDate ) || time.isAfter( scope.fmEndDate ) ) {
						controller.$setValidity( "bounds", false );
						controller.$setViewValue( null );
						return false;
					} else {
						controller.$setValidity( "bounds", true );
						return true;
					}
				}

				function ensureUpdatedView() {
					$timeout( function runDigest() {
						scope.$apply();
					} );

					// Scroll the selected list item into view if the popup is open.
					if( scope.fmIsOpen ) {
						// Use $timeout to give the DOM time to catch up.
						$timeout( scrollSelectedItemIntoView );
					}
				}

				/**
				 * Scroll the time that is currently selected into view.
				 * This applies to the dropdown below the input element.
				 */
				function scrollSelectedItemIntoView() {
					// Find the popup.
					var popupListElement = element.find( "ul" );
					// Scroll it to the top, so that we can then get the correct relative offset for all list items.
					$( popupListElement ).scrollTop( 0 );
					// Find the selected list item.
					var selectedListElement = $( "li.active", popupListElement );
					// Retrieve offset from the top and height of the list element.
					var top    = selectedListElement.length ? selectedListElement.position().top : 0;
					var height = selectedListElement.length ? selectedListElement.outerHeight( true ) : 0;
					// Scroll the list to bring the selected list element into the view.
					$( popupListElement ).scrollTop( top - height );
				}

				/**
				 * Open the popup dropdown list.
				 */
				function openPopup() {
					if( !scope.fmIsOpen ) {
						scope.fmIsOpen     = true;
						scope.modelPreview = scope.ngModel ? scope.ngModel.clone() : scope.fmStartDate.clone();
						$timeout( ensureUpdatedView );
					}
				}

				// --------------- Scope methods ---------------

				/**
				 * Close the popup dropdown list.
				 */
				scope.closePopup = function closePopup( delayed ) {
					if( delayed ) {
						// Delay closing the popup by 200ms to ensure selection of
						// list items can happen before the popup is hidden.
						$timeout(
							function closeDropdown() {
								scope.fmIsOpen = false;
							}, 200 );
					} else {
						scope.fmIsOpen = false;
						$timeout( ensureUpdatedView );
					}
				};

				scope.handleListClick = function handleListClick( $event ) {
					// When the list scrollbar is clicked, this can cause the list to lose focus.
					// Preventing the default behavior here has no undesired effects, it just stops
					// the input from losing focus.
					$event.preventDefault();
					return false;
				};

				/**
				 * Selects a given timestamp as the new value of the timepicker.
				 * @param {Number} timestamp UNIX timestamp
				 * @param {Number} elementIndex The index of the time element in the dropdown list.
				 */
				scope.select = function select( timestamp, elementIndex ) {
					// Construct a moment instance from the UNIX offset.
					var time;
					if( moment.tz ) {
						time = moment( timestamp ).tz( scope.fmTimezone );
					} else {
						time = moment( timestamp );
					}
					// Format the time to store it in the input box.
					scope.time = time.format( scope.fmFormat );

					// Store the selected index
					scope.activeIndex = elementIndex;

					scope.update();
					scope.closePopup();
				};

				scope.increment = function increment() {
					if( scope.fmIsOpen ) {
						scope.modelPreview.add( ONE_DAY );
						scope.modelPreview = scope.ensureTimeIsWithinBounds( scope.modelPreview );
					} else {
						scope.ngModel.add( ONE_DAY );
						scope.ngModel = scope.ensureTimeIsWithinBounds( scope.ngModel );
						scope.time    = scope.ngModel.format( scope.fmFormat );
					}
					scope.activeIndex = Math.min( scope.largestPossibleIndex, scope.activeIndex + 1 );
				};

				scope.decrement = function decrement() {
					if( scope.fmIsOpen ) {
						scope.modelPreview.subtract( ONE_DAY );
						scope.modelPreview = scope.ensureTimeIsWithinBounds( scope.modelPreview );
					} else {
						scope.ngModel.subtract( ONE_DAY );
						scope.ngModel = scope.ensureTimeIsWithinBounds( scope.ngModel );
						scope.time    = scope.ngModel.format( scope.fmFormat );
					}
					scope.activeIndex = Math.max( 0, scope.activeIndex - 1 );
				};

				/**
				 * Check if the value in the input control is a valid timestamp.
				 */
				scope.update = function update() {
					var timeValid = checkTimeValueValid( scope.time ) && checkTimeValueWithinBounds( scope.time );
					if( timeValid ) {
						var newTime;
						if( moment.tz ) {
							newTime = moment.tz( scope.time,
								scope.fmFormat,
								scope.fmTimezone );
						} else {
							newTime = moment( scope.time, scope.fmFormat );
						}
						controller.$setViewValue( newTime );
					}
				};

				scope.handleKeyboardInput = function handleKeyboardInput( event ) {
					switch( event.keyCode ) {
						case 13:
							// Enter
							if( scope.modelPreview ) {
								scope.ngModel  = scope.modelPreview;
								scope.fmIsOpen = false;
							}
							break;
						case 27:
							// Escape
							scope.closePopup();
							break;
						case 33:
							// Page up
							openPopup();
							scope.modelPreview.subtract( ONE_WEEK );
							scope.modelPreview = scope.ensureTimeIsWithinBounds( scope.modelPreview );
							scope.activeIndex  = Math.max( 0, scope.activeIndex - 7 );
							break;
						case 34:
							// Page down
							openPopup();
							scope.modelPreview.add( ONE_WEEK );
							scope.modelPreview = scope.ensureTimeIsWithinBounds( scope.modelPreview );
							scope.activeIndex  = Math.min( scope.largestPossibleIndex, scope.activeIndex + 7 );
							break;
						case 38:
							// Up arrow
							openPopup();
							scope.decrement();
							break;
						case 40:
							// Down arrow
							openPopup();
							scope.increment();
							break;
						default:
					}
					$timeout( ensureUpdatedView );
				};

				/**
				 * Prevent default behavior from happening.
				 * @param event
				 */
				scope.preventDefault = function preventDefault( event ) {
					event.preventDefault();
				};

				/**
				 * Remember the highest index of the existing list items.
				 * We use this to constrain the possible values for the index that marks a list item as active.
				 * @param {Number} index
				 */
				scope.largestPossibleIndexIs = function largestPossibleIndexIs( index ) {
					scope.largestPossibleIndex = index;
				};

				scope.focusInputElement = function focusInputElement() {
					$( inputElement ).focus();
				};

				var inputElement     = element.find( "input" );
				var popupListElement = element.find( "ul" );

				/**
				 * Open the popup when the input box gets focus.
				 */
				inputElement.bind( "focus", function onFocus() {
					// Without delay the popup can glitch close itself instantly after being opened.
					$timeout( openPopup, 150 );
					scope.isFocused = true;
				} );

				/**
				 * Invoked when the input box loses focus.
				 */
				inputElement.bind( "blur", function onBlur() {
					// Delay any action by 150ms
					$timeout( function checkFocusState() {
						// Check if we didn't get refocused in the meantime.
						// This can happen if the input box is selected and the user toggles the dropdown.
						// This would cause a hide and close in rapid succession, so don't do it.
						if( !$( inputElement ).is( ":focus" ) ) {
							scope.closePopup();
							validateView();
						}
					}, 150 );
					scope.isFocused = false;
				} );

				popupListElement.bind( "mousedown", function onMousedown( event ) {
					event.preventDefault();
				} );

				if( typeof Hamster === "function" ) {
					Hamster( inputElement[ 0 ] ).wheel( function onMousewheel( event, delta, deltaX, deltaY ) {
						if( scope.isFocused ) {
							event.preventDefault();

							scope.activeIndex -= delta;
							scope.activeIndex = Math.min( scope.largestPossibleIndex,
								Math.max( 0, scope.activeIndex ) );

							scope.select( scope.dropDownOptions[ scope.activeIndex ], scope.activeIndex );
							$timeout( ensureUpdatedView );
						}
					} );
				}

			}
		};
	}
	fmDatepicker.$inject = ["$timeout"];

})();

angular.module('fmDatepicker').run(['$templateCache', function($templateCache) {
  $templateCache.put("fmDatepicker.html",
    "<div><div class=\"input-group\"><span class=\"input-group-btn\" ng-if=\"fmStyle === &quot;sequential&quot;\"><button type=\"button\" class=\"{{fmBtnClass}}\" ng-click=\"decrement()\" ng-disabled=\"activeIndex === 0 || fmDisabled\"><span class=\"{{fmIconClasses.minus}}\"></span></button></span> <input type=\"text\" class=\"form-control\" ng-model=\"time\" ng-keyup=\"handleKeyboardInput( $event )\" ng-change=\"update()\" ng-disabled=\"fmDisabled\"> <span class=\"input-group-btn\"><button type=\"button\" class=\"{{fmBtnClass}}\" ng-if=\"fmStyle ===&quot;sequential&quot;\" ng-click=\"increment()\" ng-disabled=\"activeIndex === largestPossibleIndex || fmDisabled\"><span class=\"{{fmIconClasses.plus}}\"></span></button> <button type=\"button\" class=\"{{fmBtnClass}}\" ng-if=\"fmStyle === &quot;dropdown&quot;\" ng-class=\"{active : fmIsOpen}\" fm-datepicker-toggle ng-disabled=\"fmDisabled\"><span class=\"{{fmIconClasses.calendar}}\"></span></button></span></div><div class=\"dropdown\" ng-if=\"fmStyle === &quot;dropdown&quot; && fmIsOpen\" ng-class=\"{open : fmIsOpen}\"><ul class=\"dropdown-menu form-control\" style=\"height:auto; max-height:160px; overflow-y:scroll\" ng-mousedown=\"handleListClick( $event )\"><!-- Fill an empty array with time values between start and end time with the given interval, then iterate over that array. --><li ng-repeat=\"time in ( $parent.dropDownOptions = ( [] | fmDateInterval:fmStartDate:fmEndDate ) )\" ng-click=\"select( time, $index )\" ng-class=\"{active : activeIndex === $index}\"><!-- For each item, check if it is the last item. If it is, communicate the index to a method in the scope. -->{{$last? largestPossibleIndexIs( $index ) : angular.noop()}}<!-- Render a link into the list item, with the formatted time value. --><a href=\"#\" ng-click=\"preventDefault( $event )\">{{time | fmDateFormat:fmFormat}}</a></li></ul></div></div>");
}]);
