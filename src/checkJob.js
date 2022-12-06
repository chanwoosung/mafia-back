module.exports = function checkJob(nickname,mafiaList) {
  const mafia = mafiaList.filter(user=>user.nickname === nickname)
  console.log("!@#",mafia,mafia.length)
  return mafia.length > 0
}