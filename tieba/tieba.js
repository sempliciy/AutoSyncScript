const cookieName = '百度贴吧'
const cookieKey = 'chavy_cookie_tieba'
const cookieVal = $persistentStore.read(cookieKey)

function sign() {
  let url = {
    url: `https://tieba.baidu.com/mo/q/newmoindex`,
    headers: {
      Cookie: cookieVal
    }
  }

  $httpClient.post(url, (error, response, data) => {
    let result = JSON.parse(data)
    let tbs = result.data.tbs
    let forums = result.data.like_forum
    let signinfo = {
      forumCnt: forums.length,
      signedCnt: 0,
      successCnt: 0,
      failedCnt: 0,
      skipedCnt: 0
    }

    let singIndex = 0
    for (const bar of forums) {
      // 已签
      if (bar.is_sign == 1) {
        signinfo.signedCnt += 1
        signinfo.skipedCnt += 1
        console.log(`签到跳过: ${bar.forum_name}, 原因: 重复签到`)
      }
      // 未签
      else {
        singIndex += 1
        setTimeout(
          () =>
            signBar(bar, tbs, (error, response, data) => {
              let signresult = JSON.parse(data)
              if (signresult.no == 0 || signresult.no == 1011) {
                signinfo.signedCnt += 1
                signinfo.successCnt += 1
                console.log(`签到成功: ${bar.forum_name}`)
              } else {
                signinfo.failedCnt += 1
                console.log(`签到失败: ${bar[1]}, 编码: ${signresult.no}, 原因: ${signresult.error}`)
              }
            }),
          singIndex * 100
        )
      }
    }
    check(forums, signinfo)
  })
}

function signBar(bar, tbs, cb) {
  let url = {
    url: `http://tieba.baidu.com/sign/add`,
    method: 'POST',
    headers: { Cookie: cookieVal },
    body: `ie=utf-8&kw=${bar.forum_name}&tbs=${tbs}`
  }
  $httpClient.post(url, cb)
}

function check(forums, signinfo, checkms = 0) {
  if (signinfo.forumCnt == signinfo.signedCnt) {
    let title = `${cookieName}`
    let subTitle = ``
    let detail = `今日共签: ${signinfo.signedCnt}, 本次成功: ${signinfo.successCnt}, 失败: ${signinfo.failedCnt}, 跳过: ${signinfo.skipedCnt}`

    // 成功数+跳过数=总数 = 全部签到成功
    if (signinfo.successCnt + signinfo.skipedCnt == signinfo.signedCnt) {
      subTitle = `签到结果: 全部签到成功`
    } else {
      subTitle = `签到结果: 部分签到成功`
    }
    console.log(`${title}, ${subTitle}, ${detail}`)
    $notification.post(title, subTitle, detail)
    $done({})
  } else {
    if (checkms > 5000) {
      $done({})
    } else {
      setTimeout(() => check(forums, signinfo, checkms + 100), 100)
    }
  }
}

sign()
