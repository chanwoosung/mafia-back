module.exports = function calculateArray(userList,voteList) {
  let count = 0;
  let nicknameArr = [];
  let idArr = [];
  console.log("************************");
  userList.filter(element => {
    console.log(element)
    let num = 0;
    voteList.map((vote, index) => {
      console.log(vote)
      if(vote.nickname === element.nickname) {
        console.log(vote.nickname,  element.nickname,  element.nickname===vote.nickname,element.nickname==vote.nickname, count ,num)
        num++;
      }
      if(index === voteList.length-1) {
        console.log(index, voteList.length);
        if(num !==0 && num === count) {
          nicknameArr.push(element.nickname);
          idArr.push(element._id);
          console.log('???',num,count,parseInt(num) == parseInt(count),parseInt(num) == parseInt(count),(num) ===(count));
        }
        if(num > count) {
          nicknameArr=[];
          nicknameArr.push(element.nickname);
          idArr.push(element._id);
          count = num;
        }
      }
      console.log('**',num,count,nicknameArr,'**');
    })
  });
  return {
    count,
    nicknameArr,
    idArr
  }
}