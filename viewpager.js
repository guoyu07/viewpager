/**
 * 初始化函数
 * @param containter
 * @param option
 */
$.installViewpager = function(containter, option) {
    // 获取容器对象
    container = $(container);

    // 获取可见区域的宽度
    var width = container.width();

    // 默认配置
    var defaultOption = {
        loadImg: "pullToRefresh/pull.png",
        pullImg: "pullToRefresh/load.png",
    };

    // 合并用户配置
    var finalOption = $.extend(true, defaultOption, option);

    // 获取viewpager-container
    var viewContainer = container.children().first();
    // viewContainer添加class
    viewContainer.addClass('viewpager-container');

    // 获取viewpager-page
    var viewPageList = viewContainer.children();
    // 修改viewContainer的总宽度
    viewContainer.css("width", (width * viewPageList.length) + "px");
    // 初始化每一页
    viewPageList.each(function() {
        // 为page增加class
        $(this).addClass("viewpager-page");
        // 为page设置宽度
        $(this).css("width", width + "px");
        // 获取page内的滚动容器
        var scrollContainer = $(this).children().first();
        // 为滚动容器添加class
        scrollContainer.addClass("viewpage-scroll-container");
        // 初始化下拉刷新滚动插件
        $.installPullToRefresh(scrollContainer.get(0), finalOption);
    });

    // 设置transform的函数
    function cssTransform(node, content) {
        node.css({
            '-webkit-transform' : content,
            '-moz-transform'    : content,
            '-ms-transform'     : content,
            '-o-transform'      : content,
            'transform'         : content,
        });
    }

    // 当前的page下标
    var curIndex = 0;
    // 当前的X轴位置
    var curX = 0;
    // 触摸开始X轴位置
    var touchStartX = 0;
    // 总page数
    var totalIndex = viewPageList.length;
    // 右边界
    var rightBound = (totalIndex - 1) * width * -1;
    // 滑动事件
    var touchEvent = null;
    // 切换事件
    var switchEvent = null;
    // 滑动开始时间（毫秒）
    var touchStartTime = 0;

    // 移动到某个X轴位置
    function goTowards(translateX) {
        curX = translateX;
        cssTransform(viewContainer, "translateX(" + translateX + "px) translateZ(0)");
    }

    // 偏移到某个page
    function switchToPage(index) {
        var translateX = (index * width) * -1;
        curIndex = index;
        goTowards(translateX);
    }

    // 滑动到某个page
    function transToPage(index) {
        // 开启过渡动画
        viewContainer.addClass("switchTrans");
        // 向目标移动
        switchToPage(index);
        // 结束切换事件
        switchEvent = null;
    }

    // 手势滑动
    container.on("touchstart", function(event) {
        touchStartX = event.originalEvent.changedTouches[0].clientX;
        // 新的触摸事件
        touchEvent = {};
        if (switchEvent) {
            return; // 上一个切换事件没有结束
        }
        // 新的切换事件
        switchEvent = touchEvent;
        // 当前时间
        touchStartTime = new Date().getTime();
        // 暂停动画
        viewContainer.removeClass("switchTrans");
    }).on("touchmove", function(event) {
        if (touchEvent != switchEvent) { // 上一个切换事件还没结束
            return;
        }
        var touchCurX = event.originalEvent.changedTouches[0].clientX;
        // 计算拖动的距离
        var touchDistance = touchCurX - touchStartX;
        // 拖动的目标位置
        var towardX = -1 * (curIndex * width)  + touchDistance;
        // 不能滑动出边界
        if (towardX > 0) { // 拖出左边界
            towardX = 0;
        } else if (towardX < rightBound) { // 拖出右边界
            towardX = rightBound;
        }
        // 移动到拖动位置
        goTowards(towardX);
    }).on("touchend", function(event) {
        if (touchEvent != switchEvent) { // 上一个切换事件还没结束
            return;
        }
        // 当前page的偏移量
        var pageX = -1 * (curIndex * width);
        // 下一个page下标
        var nextIndex = curIndex;
        // 本次拖动的宽度
        var diffX = Math.abs(curX - pageX);
        // 本次的拖动时间
        var curTime = new Date().getTime();
        // 拖动超过1/2或者时间小于200ms,则切换
        var canMove = false;
        if (diffX * 2 >= width || curTime - touchStartTime <= 200) {
            canMove = true;
        }
        if (curX < pageX) { // 向左拖
            if (canMove) { // 过半
                nextIndex = curIndex + 1;
            }
        } else if (curX > pageX) { // 向右拖
            if (canMove) { // 过半
                nextIndex = curIndex - 1;
            }
        } else { // 没有拖动, 立即结束
            switchEvent = null;
            return;
        }
        // 开始动画
        transToPage(nextIndex);
    });

    // 返回控制工具
    return {
        // 切换page
        transToPage: function userTransToPage(index) {
            if (switchEvent) { // 禁止并发的切换事件
                return;
            }
            // 判断目标page和当前page是否相邻
            if (index == curIndex - 1 || index == curIndex + 1) {
                // 创建新的切换事件
                switchEvent = {};
                // 开启动画, 但是延迟绘制
                setTimeout(function() {
                    transToPage(index);
                }, 100);
            } else if (index != curIndex) {
                // 直接切换到目标page
                switchToPage(index);
            }
        }
    };
}