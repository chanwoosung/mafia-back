module.exports = function timer(time,callback) {
    const interval = setInterval(() =>{
      const nowTime = new Date().getTime();
      let diff = time - nowTime
      let min = Math.floor(diff/(60*1000));
      let sec = min/60;
      console.log(diff, min, sec);
      if(min ===0 && sec === 0) {
        console.log('work?')
        clearInterval(interval);
        callback();
        return true;
      }
    }, 1000);
    return interval;

  }