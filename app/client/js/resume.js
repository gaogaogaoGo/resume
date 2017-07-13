$(function() {
  $("section:first-child h1").addClass("rollIn");

  //右键事件取消默认事件
  document.addEventListener("contextmenu", function(e) {
    e.preventDefault();
  }, false);
});

(function() {
  var startY, lineAmin, outClass, inClass, current = 0,
    isScroll = true,
    scrollNext = true,
    $currentPage = null;

  function nextPage(index) {
    isScroll = false;
    var $current = $("section").eq(index);
    if (index > 5) {
      current = 5;
      isScroll = true;
      return;
    }
    switch (index) {
      case 1:
        outClass = "scaleDownUp";
        inClass = "scaleUp";
        animationInSecondPage($current);
        break;
      case 2:
        outClass = "rotateBottomSideFirst";
        inClass = "moveFromBottom";
        animationInThreePage($current);
        break;
      case 3:
        outClass = "rotateFall";
        inClass = "scaleUp";
        animationInFourPage($current);
        break;
      case 4:
        outClass = "rotateSidesOut";
        inClass = "rotateSidesIn";
        animationInFivePage($current);
        break;
      case 5:
        outClass = "moveToTop";
        inClass = "moveFromBottom";
        animationInSixPage($current);
        break;
    }
    $current.addClass("page-current " + inClass).prev().removeClass().addClass(outClass);
    $current.on("webkitAnimationEnd animationend", function() {
      isScroll = true;
      $current.off("webkitAnimationEnd animationend").removeClass(inClass).siblings().removeClass();
    });
  }

  function prePage(index) {
    isScroll = false;
    var $current = $("section").eq(index);
    if (index < 0) {
      current = 0;
      isScroll = true;
      return;
    }
    outClass = "scaleDown";
    inClass = "scaleUpDown";
    $current.addClass("page-current " + inClass).next().removeClass().addClass(outClass);
    $current.on("webkitAnimationEnd animationend", function() {
      isScroll = true;
      $current.off("webkitAnimationEnd animationend").removeClass(inClass).siblings().removeClass();
    });
  }

  function animationInSecondPage(element) {
    var $avatar = element.find(".avatar"),
      $info = element.find(".info");
    $info.children().first().addClass("base-info").next().addClass("bounceInDown").next().addClass("intro-info");
    $avatar.on("webkitAnimationEnd animationend", function() { 
      $(this).off("webkitAnimationEnd animationend"); 
    });
  }

  function animationInThreePage(element) {
    var $smallHead = element.find("#process .smallHead");
    $smallHead.addClass("fromTop");
    $smallHead.on("webkitAnimationEnd animationend", function() {
      $smallHead.off("webkitAnimationEnd animationend");
      $smallHead.addClass("moveHead").next().find("div").addClass("expand");
    });
    element.find(".tip li").addClass("tipShow").end().find(".lan,.extra,.skill").addClass("scaleDown2");
  }

  function animationInFourPage(element) {
    var $firstChild = element.children(".project-list-2nd");
    $firstChild.addClass("in");
    element.find(".type div:first-child").addClass("rotate90").next().addClass("reverse-rotate90");
  }

  function animationInFivePage(element) {
    var pElem = element.find("p");
    var imgHead = element.find(".smallHead1");
    imgHead.addClass("imgMoveFromLeft");
    pElem.eq(0).addClass("animation-delay-500 zoomInDown");
    pElem.eq(1).addClass("animation-delay-1500 zoomInRight");
    pElem.eq(2).addClass("animation-delay-1950 zoomInUp");
  }

  function animationInSixPage(element) { 
    element.find(".card").addClass("fadeIn"); 
  }

  function touchSatrtFunc(e) { 
    startY = e.targetTouches[0].pageY; 
  }

  function touchMoveFunc(e) {
    e.preventDefault();
    var endY = e.targetTouches[0].pageY;
    if (endY - startY < -100) { 
      scrollNext = true; 
    }
    if (endY - startY > 100) { 
      scrollNext = false; 
    }
  }
  document.addEventListener("touchstart", touchSatrtFunc, false);
  document.addEventListener("touchmove", touchMoveFunc, false);
  $(document).on("mousewheel DOMMouseScroll touchmove", function(e) {
    if (isScroll) {
      if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0 || !scrollNext) { 
        prePage(--current);
      } 
      else { 
        nextPage(++current); 
      }
    }
  });
  $(document).on("keydown", function(e) {
    if (isScroll) {
      if (e.keyCode == 38) { 
        prePage(--current); 
      } 
      else {
        if (e.keyCode == 40) { 
          nextPage(++current);
        }
      }
    }
  });
}());
