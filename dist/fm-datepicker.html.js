angular.module('fmDatepicker').run(['$templateCache', function($templateCache) {
  $templateCache.put("fmDatepicker.html",
    "<div><div class=\"input-group\"><span class=\"input-group-btn\" ng-if=\"fmStyle === &quot;sequential&quot;\"><button type=\"button\" class=\"{{fmBtnClass}}\" ng-click=\"decrement()\" ng-disabled=\"activeIndex === 0 || fmDisabled\"><span class=\"{{fmIconClasses.minus}}\"></span></button></span> <input type=\"text\" class=\"form-control\" ng-model=\"time\" ng-keyup=\"handleKeyboardInput( $event )\" ng-change=\"update()\" ng-disabled=\"fmDisabled\"> <span class=\"input-group-btn\"><button type=\"button\" class=\"{{fmBtnClass}}\" ng-if=\"fmStyle ===&quot;sequential&quot;\" ng-click=\"increment()\" ng-disabled=\"activeIndex === largestPossibleIndex || fmDisabled\"><span class=\"{{fmIconClasses.plus}}\"></span></button> <button type=\"button\" class=\"{{fmBtnClass}}\" ng-if=\"fmStyle === &quot;dropdown&quot;\" ng-class=\"{active : fmIsOpen}\" fm-datepicker-toggle ng-disabled=\"fmDisabled\"><span class=\"{{fmIconClasses.calendar}}\"></span></button></span></div><div class=\"dropdown\" ng-if=\"fmStyle === &quot;dropdown&quot; && fmIsOpen\" ng-class=\"{open : fmIsOpen}\"><ul class=\"dropdown-menu form-control\" style=\"height:auto; max-height:160px; overflow-y:scroll\" ng-mousedown=\"handleListClick( $event )\"><!-- Fill an empty array with time values between start and end time with the given interval, then iterate over that array. --><li ng-repeat=\"time in ( $parent.dropDownOptions = ( [] | fmDateInterval:fmStartDate:fmEndDate ) )\" ng-click=\"select( time, $index )\" ng-class=\"{active : activeIndex === $index}\"><!-- For each item, check if it is the last item. If it is, communicate the index to a method in the scope. -->{{$last? largestPossibleIndexIs( $index ) : angular.noop()}}<!-- Render a link into the list item, with the formatted time value. --><a href=\"#\" ng-click=\"preventDefault( $event )\">{{time | fmDateFormat:fmFormat}}</a></li></ul></div></div>");
}]);
