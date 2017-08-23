;
(function () {
  "use strict";

  angular.module('mobos.utils')
    .directive('chatTabScroll', function () {
                                  var directive = {
                                      link: link,
                                      restrict: 'A'
                                  };
                                  return directive;

                                  function link(scope, element, attrs) {
                          			$('row[layout-gravity="free"]' ).removeAttr('style');
                        			$('row[layout-gravity="free"]' ).removeClass('layout-content-scroll');
                        			$('row[layout-gravity="free"]' ).addClass('chat-content-scroll');
                        			
                        			var elem = $('row[layout-gravity="free"]' );
                        			var topPos = elem[0].scrollHeight;
                        			//console.log("topPostopPostopPostopPos "+elem[0].scrollHeight+" ...topPos "+topPos+"..elem.offset().top..."+elem.offset().top);
                        			//$('row[layout-gravity="free"]' ).scrollTop(topPos+120);
                        			
                        			var winH = $(window).height();
                        			 var headH = $('#headerNavId').height(); 
                        			 var textAH = $('.chatListFooter').height();
                        			 var conH = winH-headH-textAH-100;
                        			 //$('row[layout-gravity="free"]').css({"height":conH+"px", "overflow": "hidden"});
                        			

                        			 var tabElem = $(element);
                        			 tabElem.css({"height": (conH-100)+"px", "overflow-y":"scroll", "overflow-x":"hidden"});
                        			// tabElem.animate({scrollTop: topPos+120}, "slow");//scrollTop();
                        			// element[0].scrollTop = topPos+120;
                        			 tabElem.scrollTop = elem.scrollHeight;
                        			 
                        		}
                              }
                          );
})();