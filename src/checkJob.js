module.exports = function checkJob(nickname,userList) {
  const citizenList = userList.map(user=>user.nickname === nickname)
  return citizenList.length > 0
}