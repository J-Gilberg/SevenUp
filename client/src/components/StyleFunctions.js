export const getHandStyles = (i) => {
    return {
        position: 'absolute'
        , zindex: i
        , left: (i * 30) + 'px'
        , height: '120px'
        , width: '80px'
    }
}

export const getSuitStackMinStyles = (i) => {
    return {
        position: 'absolute'
        , zIndex: 8 - i
        , top: (90 - (i * 30)) + 'px'
        , height: '120px'
        , width: '80px'
    }
}

export const getSuitStackMaxStyles = (i) => {
    return {
        position: 'absolute'
        , zIndex: (9 + i)
        , top: (120 + (i * 30)) + 'px'
        , height: '120px'
        , width: '80px'
    }
}