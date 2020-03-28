class Statistic {
  constructor () {
    this.startedFrom = new Date()
    this.errorCount = 0
  }

  spank (err) {
    console.error(`${new Date().toISOString()}\t${JSON.stringify(err)}`)
    this.errorCount++
  }

  uptime () {
    const now = new Date()
    const hours = (now - this.startedFrom) / 36e5
    if (hours < 1) return '不到 1 (人间)小时'
    return ` ${Math.floor(hours)} (人间)小时`
  }

  toString () {
    const time = `妹抖酱今天已经连续工作了${this.uptime()}`
    const errors = this.errorCount === 0
      ? '今天的工作做得很好, 前辈说咱今天表现很棒(◍•͈⌔•͈◍)'
      : `今天被前辈批评了 ${this.errorCount} 次, 总感觉还是给前辈添了很多麻烦(◞‸◟ )`
    return `${time}, ${errors}`
  }
}

const statistic = new Statistic()
module.exports = statistic
