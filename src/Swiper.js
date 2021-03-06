/*
react-native-hooks-swiper
a powerful Swiper hooks component for React Native
powered by Voyz Shen
*/

'use strict';
import React, { useState, useEffect,useRef } from 'react';
import { StyleSheet,View,Text,Image,TouchableOpacity,ScrollView,Platform,Dimensions,UIManager } from 'react-native';

// ----- static variables -----
const { height:HEIGHT,width:WIDTH } = Dimensions.get('window');
const _isAndroid = Platform.OS == 'android';
// ------ temp props -------
let tmpMidIndex = 0;                                                                        //存储当前页码

export default function Swiper(props) {
    // ----------------- input props -----------------
    const {
        width=WIDTH,                                                                        //[参数]容器宽度
        height=HEIGHT,                                                                      //[参数]容器高度
        boxBackgroundColor='#ffffff00',                                                     //[参数]容器背景色
        direction='row',                                                                    //[参数]滚动方向
        scrollEnabled=true,                                                                 //[参数]是否可以手动滚动
        bounces=true,                                                                       //[参数]弹性拉动(IOS)
        loop=true,                                                                          //[参数]是否循环
        autoplay=true,                                                                      //[参数]是否自动播放
        autoplayGapTime=3,                                                                  //[参数]自动播放间隔时间
        autoplayDirection=true,                                                             //[参数]自动播放方向
        children=[],                                                                        //[参数]子元素
        animated=true,                                                                      //[参数]翻页动画
        minOffset = 10,                                                                     //[参数]翻页最小偏移量
        initIndex=0,                                                                        //[参数]初始页
        showPagination=true,                                                                //[参数]是否显示页码器
        paginationPosition='bottom',                                                        //[参数]页码器位置
        paginationOffset=5,                                                                 //[参数]页码器偏移量
        paginationUnselectedSize=6,                                                         //[参数]页码点未选中态大小
        paginationSelectedSize=10,                                                          //[参数]页码点选中态大小
        paginationUnselectedColor='#fff',                                                   //[参数]页码点未选中态颜色
        paginationSelectedColor='#000',                                                     //[参数]页码点选中态颜色
        onPaginationChange,                                                                 //[回调函数]页码改变
        onScrollBeginDrag,                                                                  //[回调函数]开始滚动
        onScrollEndDrag,                                                                    //[回调函数]结束滚动
    } = props ;
    // -------------------- props ---------------------
    const childrenLength = children.length,                                                 //子元素数量
          contentOffsetList = new Array(childrenLength).fill(1).map((child,index)=>{        //偏移量列表
            return direction == 'row' ? width*index : height*index;
          });
    let inScroll = false;                                                                   //手动滚动中

    // rebuild children Array
    const rebulidChildren = (midIndex) => {
        let newChildrenArr = [];
        let preIndex =  midIndex==0 ? childrenLength-1 : midIndex-1,
            backIndex = midIndex==childrenLength-1 ? 0 : midIndex+1;

        newChildrenArr.push(children[preIndex]);
        newChildrenArr.push(children[midIndex]);
        newChildrenArr.push(children[backIndex]);

        return newChildrenArr;
    }

    // -------------------- States --------------------
    const [currIndex, setCurrIndex] = useState(initIndex)                         //current index
    const [currChildren, setChildren] = useState(rebulidChildren(initIndex))      //current children
    const [androidMask, setAndroidMask] = useState(false)                         //mask for avoiding flash

    // -------------------- Refs ----------------------
    const _scrollView = useRef(null);

    // ------------------- Effects --------------------
    useEffect(() => {
        // scroll to init child
        setTimeout(() => {
            _scrollView.current.scrollTo({
                y:direction!='row' ?
                    (loop ? height : contentOffsetList[initIndex])
                    : 0,
                x:direction=='row' ?
                    (loop ? width :  contentOffsetList[initIndex])
                    : 0,
                animated: false
            })
        }, 0);
    }, []);

    // custom hook: useInterval
    function useInterval(callback, delay) {
        const savedCallback = useRef();

        useEffect(() => {
            savedCallback.current = callback;
        });

        useEffect(() => {
            function tick() {
                savedCallback.current();
            }
            if (delay !== null) {
                let id = setInterval(tick, delay);
                return () => clearInterval(id);
            }
        }, [delay]);
    }

    // useInterval
    useInterval(()=>{
        if(autoplay){
            onAutoplay();
        }
    },autoplayGapTime*1000)


    // ------------------ functions -------------------

    // on scroll begin
    const _onScrollBeginDrag = (event) => {
        !!onScrollBeginDrag && onScrollBeginDrag(event);
        inScroll = true;
    }

    // on scroll end
    const _onScrollEndDrag = (event,autoplayOffset) => {
        !!onScrollEndDrag && onScrollEndDrag(event)
        if(!autoplayOffset) inScroll = false;

        const _offset = !!autoplayOffset ?
                autoplayOffset
                : event.nativeEvent.contentOffset[direction == 'row' ? 'x' : 'y'];
        const _oneStep = direction == 'row' ?
                width
                : height;
        let _currIndex = currIndex;

        if(!inScroll){
            // without loop
            if(!loop){
                if(_offset<=0) _currIndex = 0;
                else if(_offset >= contentOffsetList[childrenLength-1]) _currIndex = childrenLength-1;
                else if(_offset >= _currIndex*_oneStep+minOffset) _currIndex += 1;
                else if(_offset <= _currIndex*_oneStep-minOffset) _currIndex -= 1;

                _scrollView.current.scrollTo({
                    x:direction == 'row' ? contentOffsetList[_currIndex] : 0,
                    y:direction != 'row' ? contentOffsetList[_currIndex] : 0,
                    animated
                });

                setCurrIndex(_currIndex);
            }
            // loop
            else{
                if(_offset >= _oneStep + minOffset){
                    if(_currIndex == childrenLength-1) _currIndex = 0;
                    else _currIndex += 1;
                    _scrollView.current.scrollTo({
                        x:direction == 'row' ? 2*_oneStep : 0,
                        y:direction != 'row' ? 2*_oneStep : 0,
                        animated
                    });
                    setCurrIndex(_currIndex);
                }else if(_offset <= _oneStep - minOffset){
                    if(_currIndex == 0) _currIndex = childrenLength-1;
                    else _currIndex -= 1;
                    _scrollView.current.scrollTo({
                        x:0,
                        y:0,
                        animated
                    });
                    setCurrIndex(_currIndex);
                }
                // updata children
                setTimeout(() => {
                    tmpMidIndex = _currIndex;
                    _isAndroid && setAndroidMask(true);
                    _scrollView.current.scrollTo({
                        y:direction!='row' ?
                            height : 0,
                        x:direction=='row' ?
                            width :  0,
                        animated: false
                    })
                    setChildren(rebulidChildren(_currIndex));
                    _isAndroid && setTimeout(() => {
                        setAndroidMask(false);
                    }, 100);
                }, _isAndroid ? 50 : 500);
            }

            // callback
            !!onPaginationChange && onPaginationChange(_currIndex);
        }
    }

    // on autoplay
    const onAutoplay = () => {
        const _oneStep = direction == 'row' ? width : height;
        let _autoplayOffset,_currIndex = currIndex;

        // without loop
        if(!loop){
            if(_currIndex == 0 && !autoplayDirection) return;
            if(_currIndex == childrenLength-1 && autoplayDirection) return;
            _autoplayOffset = autoplayDirection ?
                contentOffsetList[_currIndex]+minOffset*2
                : contentOffsetList[_currIndex]-minOffset*2
            _onScrollEndDrag(null,_autoplayOffset)
        }
        // loop
        else{
            _autoplayOffset = autoplayDirection ? _oneStep+minOffset*2 : _oneStep-minOffset*2;
            _onScrollEndDrag(null,_autoplayOffset)
        }
    }

    // -------------------- render ---------------------
    const styles = createStyle();

    // pagination shower
    const paginationShower = () => {
        let posStyle = {};
        switch (paginationPosition) {
            case 'bottom':
                posStyle = {
                    bottom:0+paginationOffset,left:0,right:0,
                    height:paginationSelectedSize,
                    flexDirection: 'row'
                };
                break;
            case 'left':
                posStyle = {
                    left:0+paginationOffset,bottom:0,top:0,
                    width:paginationSelectedSize,
                    flexDirection: 'column'
                };
                break;
            case 'top':
                posStyle = {
                    top:0+paginationOffset,left:0,right:0,
                    height:paginationSelectedSize,
                    flexDirection: 'row'
                };
                break;
            case 'right':
                posStyle = {
                    right:0+paginationOffset,bottom:0,top:0,
                    width:paginationSelectedSize,
                    flexDirection: 'column'
                };
                break;
            default:
                break;
        }
        return (
            <View style={[styles.paginationContainer,posStyle]}>
                {
                    new Array(childrenLength).fill(1).map((e,i)=>{
                        return (
                            <View style={{
                                width:i==currIndex ?
                                    paginationSelectedSize : paginationUnselectedSize,
                                height:i==currIndex ?
                                    paginationSelectedSize : paginationUnselectedSize,
                                borderRadius:i==currIndex ?
                                    paginationSelectedSize : paginationUnselectedSize,
                                backgroundColor:i==currIndex ?
                                    paginationSelectedColor : paginationUnselectedColor,
                                marginLeft:paginationPosition == 'top' || paginationPosition == 'bottom' ?
                                    (i!=0 ? 5 : 0) : 0,
                                marginTop: paginationPosition == 'left' || paginationPosition == 'right' ?
                                    (i!=0 ? 5 : 0) : 0,
                                }} key={i}/>
                        )
                    })
                }
            </View>
        )
    }

    return (
        <View style={[styles.outermostContainer,{backgroundColor:boxBackgroundColor}]}>
            {/* scroll view */}
            <ScrollView style={{width:width,height:height}}
                        horizontal={direction == 'row' ? true : false}
                        scrollEnabled={scrollEnabled}
                        bounces={bounces}
                        onScrollBeginDrag={_onScrollBeginDrag}
                        onScrollEndDrag={_onScrollEndDrag}
                        ref = {_scrollView}
                        showsHorizontalScrollIndicator={false}>
                { loop ? currChildren : children}
            </ScrollView>
            {/* mask (android) */}
            { _isAndroid && !!androidMask && <View style={styles.androidMask}>{children[tmpMidIndex]}</View> }
            {/* pagination shower */}
            { !!showPagination && paginationShower() }
        </View>
    )
}

const createStyle = ()=>{
    return StyleSheet.create({
        outermostContainer:{
            position: 'relative',
        },
        androidMask:{
            position: 'absolute',
            top:0,
            left:0,
            bottom:0,
            right:0,
        },
        paginationContainer:{
            justifyContent: 'center',
            alignItems: 'center',
            position:'absolute',
            zIndex:99
        }
    })
}